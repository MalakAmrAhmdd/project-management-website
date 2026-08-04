from app.services.calculation_engine import cascade_recalculate_from_project
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models import Milestone, Project, Phase, Epic
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

class ProjectRepository(BaseRepository):
    async def list(self,db: AsyncSession)->list:
        result = await db.execute(select(Project).order_by(Project.name))
        return result.scalars().all()

    async def get(self, id:int, db: AsyncSession):
        statement = (
                select(Project)
                .options(
                    selectinload(Project.phases)
                    .selectinload(Phase.milestones)
                    .selectinload(Milestone.epics)
                    .selectinload(Epic.stories)
                )
                .where(Project.id == id)
            )
        result = await db.execute(statement)
        return result.scalar_one_or_none()

    async def update(self, project, data, db: AsyncSession):
        updates = data.model_dump(exclude_unset=True)
        for key, value in updates.items():
            setattr(project, key, value)
        # If state or points changed, recalculate
        if "total_estimated_points" in updates or "state" in updates:
            await cascade_recalculate_from_project(db, project.id, reason="Project fields updated")
        await self.save(project, db)
        return project