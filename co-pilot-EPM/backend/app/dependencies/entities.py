from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import (
    Allocation, Epic, Member, Milestone, Phase,
    Project, Story,Team,
)

def get_or_404(model):
    async def dependency(
        id: int,
        db: AsyncSession = Depends(get_db),
    ):
        obj = await db.get(model, id)
        if obj is None:
            raise HTTPException(
                status_code=404,
                detail=f"{model.__name__} not found",
            )
        return obj
    return dependency

get_project_or_404 = get_or_404(Project)
get_team_or_404 = get_or_404(Team)
get_member_or_404 = get_or_404(Member)
get_phase_or_404 = get_or_404(Phase)
get_milestone_or_404 = get_or_404(Milestone)
get_epic_or_404 = get_or_404(Epic)
get_story_or_404 = get_or_404(Story)
get_allocation_or_404 = get_or_404(Allocation)