from app.repositories.base import BaseRepository
from app.models import Team
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models import Team

class TeamRepository(BaseRepository[Team]):

    async def list(self) -> list[Team]:
        result = await self.db.execute(select(Team).order_by(Team.name))
        return result.scalars().all()

    async def get(self, id: int) -> Team | None:
        result = await self.db.execute(
            select(Team).options(selectinload(Team.members)).where(Team.id == id)
        )
        return result.scalar_one_or_none()