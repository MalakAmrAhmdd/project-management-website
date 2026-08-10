from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException
from app.core.database import get_db
from app.schemas.allocation import AllocationCreate, AllocationUpdate
from app.services.allocation_service import update_allocation
from app.models import Epic, Milestone, Story, Member, Team, Phase, Project, Allocation
from app.schemas.project import EpicCreate

async def valid_allocation_create(data: AllocationCreate, db: AsyncSession = Depends(get_db)) -> AllocationCreate:
    # Check if member exists
    member = await db.get(Member, data.member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Check if milestone exists
    milestone = await db.get(Milestone, data.milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    # Check for duplicate
    existing = await db.execute(
        select(Allocation).where(
            Allocation.member_id == data.member_id,
            Allocation.milestone_id == data.milestone_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Allocation already exists for this member/milestone pair")
    
    return data