from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models import Phase, Project
from app.schemas.project import PhaseCreate, PhaseUpdate, PhaseRead
from app.services.placeholder_service import consume_or_expand_phase
from app.services.reorder_service import insert_at_position, normalize_order
from app.services.calculation_engine import cascade_recalculate_from_phase
from app.routers.dependencies import get_phase_or_404

router = APIRouter()


@router.get("/", response_model=List[PhaseRead])
async def list_phases(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Phase).where(Phase.project_id == project_id).order_by(Phase.order_index)
    )
    return result.scalars().all()


@router.get("/{phase_id}", response_model=PhaseRead)
async def get_phase(phase: Phase = Depends(get_phase_or_404)):
    return phase


@router.post("/", response_model=PhaseRead, status_code=201)
async def create_phase(data: PhaseCreate, db: AsyncSession = Depends(get_db)):
    # Verify parent exists
    project = await db.get(Project, data.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    phase_data = data.model_dump(exclude={"project_id", "order_index"})
    phase_data["state"] = phase_data["state"].value if hasattr(phase_data["state"], "value") else phase_data["state"]

    phase, consumed = await consume_or_expand_phase(db, data.project_id, phase_data)

    # Handle explicit ordering
    if data.order_index is not None:
        await insert_at_position(db, "phase", data.project_id, data.order_index, phase.id)

    await normalize_order(db, "phase", data.project_id)

    # Inherit start date from project if not set
    if not phase.original_start_date and project.original_start_date:
        phase.original_start_date = project.original_start_date
        phase.actual_start_date = project.actual_start_date or project.original_start_date

    await cascade_recalculate_from_phase(db, phase.id, reason="New phase created")
    await db.flush()
    await db.refresh(phase)
    return phase


@router.patch("/{phase_id}", response_model=PhaseRead)
async def update_phase(phase: Phase = Depends(get_phase_or_404), data: PhaseUpdate = None, db: AsyncSession = Depends(get_db)):
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(phase, key, value)

    if "order_index" in updates:
        await insert_at_position(db, "phase", phase.project_id, updates["order_index"], phase.id)
        await normalize_order(db, "phase", phase.project_id)

    await cascade_recalculate_from_phase(db, phase.id, reason="Phase updated")
    await db.flush()
    await db.refresh(phase)
    return phase


@router.delete("/{phase_id}", status_code=204)
async def delete_phase(phase: Phase = Depends(get_phase_or_404), db: AsyncSession = Depends(get_db)):
    project_id = phase.project_id
    await db.delete(phase)
    await db.flush()
    await normalize_order(db, "phase", project_id)
