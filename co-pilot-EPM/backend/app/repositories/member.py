from fastapi import Depends, Query
from app.core.database import get_db
from sqlalchemy import select
from typing import Optional
from app.repositories.base import BaseRepository
from app.models.member import Member
from sqlalchemy.ext.asyncio import AsyncSession

class MemberRepository(BaseRepository):
    async def list(self, team_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db)):
        q = select(self.model).order_by(self.model.name)
        if team_id is not None:
            q = q.where(self.model.team_id == team_id)
        result = await db.execute(q)
        return result.scalars().all()