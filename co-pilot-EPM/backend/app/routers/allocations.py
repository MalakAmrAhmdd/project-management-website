from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.models import Allocation, Member, Milestone, Phase, Project
from app.schemas.allocation import AllocationCreate, AllocationRead, AllocationWithDetails
from app.routers.dependencies import get_allocation_or_404, valid_allocation_create
from app.services.allocation_service import (
    allocate_member,
    remove_allocation,
)

router = APIRouter()

@router.get("/", response_model=List[AllocationWithDetails])
async def list_allocations(
    milestone_id: int = None,
    member_id: int = None,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Allocation, Member, Milestone, Phase, Project)
        .join(Member, Allocation.member_id == Member.id)
        .join(Milestone, Allocation.milestone_id == Milestone.id)
        .join(Phase, Milestone.phase_id == Phase.id)
        .join(Project, Phase.project_id == Project.id)
    )
    if milestone_id is not None:
        q = q.where(Allocation.milestone_id == milestone_id)
    if member_id is not None:
        q = q.where(Allocation.member_id == member_id)

    rows = (await db.execute(q)).all()

    return [
        AllocationWithDetails(
            id=alloc.id,
            member_id=alloc.member_id,
            milestone_id=alloc.milestone_id,
            velocity_if_100_pct=alloc.velocity_if_100_pct,
            contribution_percentage=alloc.contribution_percentage,
            effective_velocity=alloc.effective_velocity,
            average_fto=alloc.average_fto,
            created_at=alloc.created_at,
            updated_at=alloc.updated_at,
            member_name=member.name,
            member_email=member.email,
            milestone_name=milestone.name,
            phase_name=phase.name,
            project_name=project.name,
        )
        for alloc, member, milestone, phase, project in rows
    ]


@router.post("/", response_model=AllocationRead, status_code=201)
async def create_allocation(data: AllocationCreate = Depends(valid_allocation_create), db: AsyncSession = Depends(get_db)):

    alloc = await allocate_member(
        db,
        member_id=data.member_id,
        milestone_id=data.milestone_id,
        velocity_if_100_pct=data.velocity_if_100_pct,
        contribution_percentage=data.contribution_percentage,
        average_fto=data.average_fto,
    )
    return alloc

@router.patch("/{allocation_id}", response_model=AllocationRead)
async def update_alloc(allocation: Allocation = Depends(get_allocation_or_404), db: AsyncSession = Depends(get_db)):
    return allocation


@router.delete("/{allocation_id}", status_code=204)
async def delete_alloc(allocation_id: int, db: AsyncSession = Depends(get_db)):
    success = await remove_allocation(db, allocation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Allocation not found")