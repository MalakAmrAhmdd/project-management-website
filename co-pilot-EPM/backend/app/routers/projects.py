from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List

from app.routers.dependencies import get_project_or_404
from app.database import get_db
from app.models import Project, Phase, Milestone, Epic
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectRead, ProjectFull,
)
from app.services.placeholder_service import create_project_placeholders
from app.services.calculation_engine import cascade_recalculate_from_project

router = APIRouter()


@router.get("/", response_model=List[ProjectRead])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.name))
    return result.scalars().all()


@router.get("/{project_id}", response_model=ProjectFull)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    statement = (
        select(Project)
        .options(
            selectinload(Project.phases)
            .selectinload(Phase.milestones)
            .selectinload(Milestone.epics)
            .selectinload(Epic.stories)
        )
        .where(Project.id == project_id)
    )
    result = await db.execute(statement)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/", response_model=ProjectRead, status_code=201)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**data.model_dump())
    db.add(project)
    await db.flush()
    # Auto-create placeholder hierarchy
    await create_project_placeholders(db, project.id, start_date=project.original_start_date)
    await db.refresh(project)
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(project_id: int, data: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    project = await get_project_or_404(project_id, db)

    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(project, key, value)

    # If state or points changed, recalculate
    if "total_estimated_points" in updates or "state" in updates:
        await cascade_recalculate_from_project(db, project_id, reason="Project fields updated")

    await db.flush()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await get_project_or_404(project_id, db)
    await db.delete(project)
