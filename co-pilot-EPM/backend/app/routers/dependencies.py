from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.member import Member
from app.models.team import Team

#using depencency injection pattern to fetch entities and raise 404 if not found

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