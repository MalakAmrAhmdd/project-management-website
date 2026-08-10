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
        if not obj:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        return obj
    return dependency