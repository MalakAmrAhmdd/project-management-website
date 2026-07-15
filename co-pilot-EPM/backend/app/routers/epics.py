from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models import Epic, Milestone, Story
from app.schemas.project import EpicCreate, EpicUpdate, EpicRead, EpicWithStories
from app.routers.dependencies import get_epic_or_404
from app.services.placeholder_service import consume_or_expand_epic
from app.services.reorder_service import insert_at_position, normalize_order
from app.services.calculation_engine import cascade_recalculate_from_milestone

router = APIRouter()


@router.get("/", response_model=List[EpicRead])
async def list_epics(milestone_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Epic).where(Epic.milestone_id == milestone_id).order_by(Epic.order_index)
    )
    return result.scalars().all()


@router.get("/{epic_id}", response_model=EpicRead)
async def get_epic(epic = Depends(get_epic_or_404)):
    return epic

@router.post("/", response_model=EpicRead, status_code=201)
async def create_epic(data: EpicCreate, db: AsyncSession = Depends(get_db)):
    milestone = await db.get(Milestone, data.milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    epic_data = data.model_dump(exclude={"milestone_id", "order_index"})
    epic_data["state"] = epic_data["state"].value if hasattr(epic_data["state"], "value") else epic_data["state"]

    epic, consumed = await consume_or_expand_epic(db, data.milestone_id, epic_data)

    if data.order_index is not None:
        await insert_at_position(db, "epic", data.milestone_id, data.order_index, epic.id)

    await normalize_order(db, "epic", data.milestone_id)

    # Inherit start date from milestone
    if not epic.original_start_date and milestone.original_start_date:
        epic.original_start_date = milestone.original_start_date
        epic.actual_start_date = milestone.actual_start_date or milestone.original_start_date

    await cascade_recalculate_from_milestone(db, data.milestone_id, reason="New epic created")
    await db.flush()
    await db.refresh(epic)
    return epic


@router.patch("/{epic_id}", response_model=EpicRead)
async def update_epic( data: EpicUpdate, db: AsyncSession = Depends(get_db), epic = Depends(get_epic_or_404)):
    
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(epic, key, value)

    if "order_index" in updates:
        await insert_at_position(db, "epic", epic.milestone_id, updates["order_index"], epic.id)
        await normalize_order(db, "epic", epic.milestone_id)

    await cascade_recalculate_from_milestone(db, epic.milestone_id, reason="Epic updated")
    await db.flush()
    await db.refresh(epic)
    return epic


@router.delete("/{epic_id}", status_code=204)
async def delete_epic(epic = Depends(get_epic_or_404), db: AsyncSession = Depends(get_db)):
    milestone_id = epic.milestone_id
    await db.delete(epic)
    await db.flush()
    await normalize_order(db, "epic", milestone_id)
    await cascade_recalculate_from_milestone(db, milestone_id, reason="Epic deleted")
