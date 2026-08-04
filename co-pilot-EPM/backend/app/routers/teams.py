from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List
from app.core.database import get_db
from app.models import Team
from app.schemas.team import TeamCreate, TeamUpdate, TeamRead, TeamWithMembers
from app.dependencies.entities import get_or_404
from app.repositories.team import TeamRepository

router = APIRouter()
team_repo = TeamRepository(Team)

@router.get("/", response_model=List[TeamRead])
async def list_teams(db: AsyncSession = Depends(get_db)):
    return await team_repo.list(db)

@router.get("/{id}", response_model=TeamWithMembers)
async def get_team(id: int, db: AsyncSession = Depends(get_db)):
    team = await team_repo.get(id, db)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/", response_model=TeamRead, status_code=201)
async def create_team(data: TeamCreate, db: AsyncSession = Depends(get_db)):
    return await team_repo.create(data, db)

@router.patch("/{id}", response_model=TeamRead)
async def update_team(data: TeamUpdate,
                    db: AsyncSession = Depends(get_db), team: Team = Depends(get_or_404(Team))):
    return await team_repo.update(team, data, db)

@router.delete("/{id}", status_code=204)
async def delete_team( db: AsyncSession = Depends(get_db), team: Team = Depends(get_or_404(Team))):
    await team_repo.delete(team, db)