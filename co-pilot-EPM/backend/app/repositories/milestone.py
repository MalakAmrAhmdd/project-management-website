from fastapi import Query
from app.core.database import get_db
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models import Milestone, Epic, Story
from app.services.placeholder_service import consume_or_expand_milestone, fill_milestone_gaps
from app.services.reorder_service import insert_at_position, normalize_order
from app.services.calculation_engine import cascade_recalculate_from_milestone
from app.routers.dependencies import get_phase_or_404 , get_milestone_or_404


class MilestoneRepository(BaseRepository[Milestone]):
    async def list(self, phase_id: int)->list[Milestone]:
        result = await self.db.execute(
        select(self.model).where(self.model.phase_id == phase_id).order_by(Milestone.order_index)
    )
        return result.scalars().all()

    async def create(self, data):
        db = self.db
        phase = await get_phase_or_404(data.phase_id, db)

        ms_data = data.model_dump(exclude={"phase_id", "order_index"})
        ms_data["state"] = ms_data["state"].value if hasattr(ms_data["state"], "value") else ms_data["state"]

        ms, consumed = await consume_or_expand_milestone(db, data.phase_id, ms_data)

        if data.order_index is not None:
            await insert_at_position(db, "milestone", data.phase_id, data.order_index, ms.id)

        await normalize_order(db, "milestone", data.phase_id)

        # Inherit start date from phase if not set
        if not ms.original_start_date and phase.original_start_date:
            ms.original_start_date = phase.original_start_date
            ms.actual_start_date = phase.actual_start_date or phase.original_start_date

        await cascade_recalculate_from_milestone(db, ms.id, reason="New milestone created")
        await fill_milestone_gaps(db, data.phase_id)
        await db.flush()
        await db.refresh(ms)
        return ms
