from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models import Epic, Story
from app.services.placeholder_service import consume_or_expand_milestone, fill_milestone_gaps
from app.services.reorder_service import insert_at_position, normalize_order
from app.services.calculation_engine import cascade_recalculate_from_milestone
from app.routers.dependencies import get_phase_or_404 , get_milestone_or_404


class StoryRepository(BaseRepository[Story]):
    async def list(self, epic_id: int)->list[Story]:
        result = await self.db.execute(
                select(Story).where(self.model.epic_id == epic_id).order_by(Story.order_index)
            )
        return result.scalars().all()

    async def create(self, data):
        db = self.db
        epic = await self.db.get(Epic, data.epic_id)
