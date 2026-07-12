from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models import Milestone, Phase, Epic, Story
from app.schemas.project import MilestoneCreate, MilestoneUpdate, MilestoneRead
from app.services.placeholder_service import consume_or_expand_milestone, fill_milestone_gaps
from app.services.reorder_service import insert_at_position, normalize_order
from app.services.calculation_engine import cascade_recalculate_from_milestone
from app.services.allocation_service import get_milestone_contribution_matrix
from app.routers.dependencies import get_phase_or_404 , get_milestone_or_404
router = APIRouter()




@router.get("/", response_model=List[MilestoneRead])
async def list_milestones(phase_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Milestone).where(Milestone.phase_id == phase_id).order_by(Milestone.order_index)
    )
    return result.scalars().all()


@router.get("/{milestone_id}", response_model=MilestoneRead)
async def get_milestone(milestone: Milestone = Depends(get_milestone_or_404)):
    return milestone


@router.get("/{milestone_id}/contribution-matrix")
async def milestone_contribution_matrix(milestone: Milestone = Depends(get_milestone_or_404), db: AsyncSession = Depends(get_db)):
    matrix = await get_milestone_contribution_matrix(db, milestone.id)
    return {"milestone_id": milestone.id, "contributions": matrix}


@router.post("/", response_model=MilestoneRead, status_code=201)
async def create_milestone(data: MilestoneCreate, db: AsyncSession = Depends(get_db)):
    phase = await get_phase_or_404(data.phase_id, db)

    ms_data = data.model_dump(exclude={"phase_id", "order_index"})
    ms_data["state"] = ms_data["state"].value if hasattr(ms_data["state"], "value") else ms_data["state"]

    ms, consumed = await consume_or_expand_milestone(db, data.phase_id, ms_data)

    if data.order_index is not None:
        await insert_at_position(db, "milestone", data.phase_id, data.order_index, ms.id)

    await normalize_order(db, "milestone", data.phase_id)

    # Inherit start date from phase if not set
    if not ms.original_start_date and phase.original_start_date:
        ms.original_start_date = phase.original_start_date
        ms.actual_start_date = phase.actual_start_date or phase.original_start_date

    await cascade_recalculate_from_milestone(db, ms.id, reason="New milestone created")
    await fill_milestone_gaps(db, data.phase_id)
    await db.flush()
    await db.refresh(ms)
    return ms


@router.patch("/{milestone_id}", response_model=MilestoneRead)
async def update_milestone(milestone: Milestone = Depends(get_milestone_or_404), data: MilestoneUpdate = None, db: AsyncSession = Depends(get_db)):
    updates = data.model_dump(exclude_unset=True)

    # When total_estimated_points is set directly on the milestone, store it in
    # the milestone's single placeholder epic so that recalculate_milestone can
    # re-sum it naturally (avoids the immediate overwrite from epic aggregation).
    if "total_estimated_points" in updates:
        target_points = float(updates.pop("total_estimated_points"))
        # Find the existing non-gap placeholder epic under this milestone
        ep_result = await db.execute(
            select(Epic).where(
                Epic.milestone_id == milestone.id,
                Epic.is_placeholder == True,
                Epic.name != "Epic (Gap Placeholder)",
            ).order_by(Epic.order_index).limit(1)
        )
        placeholder_epic = ep_result.scalar_one_or_none()
        if placeholder_epic:
            placeholder_epic.total_estimated_points = target_points
        else:
            # No placeholder epic — create one to hold the budget
            new_epic = Epic(
                name="Epic 1 (Placeholder)",
                milestone_id=milestone.id,
                order_index=0,
                is_placeholder=True,
                total_estimated_points=target_points,
            )
            db.add(new_epic)
            await db.flush()
            story = Story(
                name="Story 1 (Placeholder)",
                epic_id=new_epic.id,
                order_index=0,
                is_placeholder=True,
            )
            db.add(story)
            await db.flush()

    for key, value in updates.items():
        setattr(milestone, key, value)

    if "order_index" in updates:
        await insert_at_position(db, "milestone", milestone.phase_id, updates["order_index"], milestone.id)
        await normalize_order(db, "milestone", milestone.phase_id)

    await cascade_recalculate_from_milestone(db, milestone.id, reason="Milestone updated")
    await fill_milestone_gaps(db, milestone.phase_id)
    await db.flush()
    await db.refresh(milestone)
    return milestone


@router.delete("/{milestone_id}", status_code=204)
async def delete_milestone(milestone: Milestone = Depends(get_milestone_or_404), db: AsyncSession = Depends(get_db)):
    phase_id = milestone.phase_id
    await db.delete(milestone)
    await db.flush()
    await normalize_order(db, "milestone", phase_id)
