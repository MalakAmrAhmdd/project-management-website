from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.models import Project
from app.schemas.project import (ProjectCreate, ProjectUpdate, ProjectRead, ProjectFull)
from app.services.placeholder_service import create_project_placeholders
from app.repositories.project import ProjectRepository
from app.dependencies.entities import get_or_404

router = APIRouter()
project_repo = ProjectRepository(Project)

@router.get("/", response_model=List[ProjectRead])
async def list_projects(db: AsyncSession = Depends(get_db)):
    return await project_repo.list(db)

@router.get("/{project_id}", response_model=ProjectFull)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await project_repo.get(project_id, db)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/", response_model=ProjectRead, status_code=201)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = await project_repo.create(data, db)
    # Auto-create placeholder hierarchy
    await create_project_placeholders(db, project.id, start_date=project.original_start_date)
    await db.refresh(project)
    return project

@router.patch("/{id}", response_model=ProjectRead)
async def update_project(data: ProjectUpdate, db: AsyncSession = Depends(get_db), project: Project = Depends(get_or_404(Project))):
    return await project_repo.update(project, data, db)

@router.delete("/{id}", status_code=204)
async def delete_project(db: AsyncSession = Depends(get_db),project: Project = Depends(get_or_404(Project))):
    await project_repo.delete(project, db)