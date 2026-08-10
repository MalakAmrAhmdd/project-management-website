from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models import Milestone
from app.services.placeholder_service import consume_or_expand_milestone, fill_milestone_gaps
from app.services.reorder_service import insert_at_position, normalize_order
from app.services.calculation_engine import cascade_recalculate_from_milestone
from app.routers.dependencies import get_phase_or_404 , get_milestone_or_404


class ProjectRepository(BaseRepository):
    async def list(self, phase_id: int)->list:
        result = await self.db.execute(
        select(self.model).where(self.model.phase_id == phase_id).order_by(Milestone.order_index)
    )
        return result.scalars().all()