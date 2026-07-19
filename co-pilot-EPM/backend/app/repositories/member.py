from fastapi import Query
from app.core.database import get_db
from sqlalchemy import select
from typing import Optional
from app.repositories.base import BaseRepository
from app.models.member import Member

class MemberRepository(BaseRepository[Member]):
    async def list(self, team_id: Optional[int] = Query(None)):
        q = select(self.model).order_by(self.model.name)
        if team_id is not None:
            q = q.where(self.model.team_id == team_id)
        result = await get_db().execute(q)
        return result.scalars().all()