from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException
from app.database import get_db
from app.models.member import Member
from app.models.team import Team
from app.models.milestone import Milestone
from app.models.allocation import Allocation
from app.schemas.allocation import AllocationCreate, AllocationUpdate
from app.services.allocation_service import update_allocation 

# Shared FastAPI dependencies for entity validation and get-or-404 patterns

async def get_member_or_404(member_id: int, db: AsyncSession = Depends(get_db)) -> Member:
    member = await db.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member

async def get_team_or_404(team_id: int, db: AsyncSession = Depends(get_db)) -> Team:
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

# Validates that referenced member and milestone exist before creating an allocation
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

async def get_allocation_or_404(allocation_id: int, data: AllocationUpdate, 
                                db: AsyncSession = Depends(get_db)) -> Allocation:
    alloc = await update_allocation(
            db,
            allocation_id=allocation_id,
            velocity_if_100_pct=data.velocity_if_100_pct,
            contribution_percentage=data.contribution_percentage,
            average_fto=data.average_fto,
        )
    if not alloc:
            raise HTTPException(status_code=404, detail="Allocation not found")

    return alloc