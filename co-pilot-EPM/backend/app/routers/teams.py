from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List
from app.core.database import get_db
from app.models import Team
from app.schemas.team import TeamCreate, TeamUpdate, TeamRead, TeamWithMembers
from app.routers.dependencies import get_team_or_404

router = APIRouter()

@router.get("/", response_model=List[TeamRead])
async def list_teams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Team).order_by(Team.name))
    return result.scalars().all()

@router.get("/{team_id}", response_model=TeamWithMembers)
async def get_team(team_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Team).options(selectinload(Team.members)).where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/", response_model=TeamRead, status_code=201)
async def create_team(data: TeamCreate, db: AsyncSession = Depends(get_db)):
    team = Team(**data.model_dump())
    db.add(team)
    await db.flush()
    await db.refresh(team)
    return team

@router.patch("/{team_id}", response_model=TeamRead)
async def update_team(data: TeamUpdate,
                    db: AsyncSession = Depends(get_db), team: Team = Depends(get_team_or_404)):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(team, key, value)
    await db.flush()
    await db.refresh(team)
    return team

@router.delete("/{team_id}", status_code=204)
async def delete_team( db: AsyncSession = Depends(get_db), team: Team = Depends(get_team_or_404)):
    await db.delete(team)