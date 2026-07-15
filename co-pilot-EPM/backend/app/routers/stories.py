from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models import Story, Epic, Milestone
from app.schemas.project import StoryCreate, StoryUpdate, StoryRead
from app.services.placeholder_service import consume_or_expand_story
from app.services.reorder_service import insert_at_position, normalize_order
from app.services.calculation_engine import cascade_recalculate_from_milestone
from app.routers.dependencies import get_story_or_404

router = APIRouter()


@router.get("/", response_model=List[StoryRead])
async def list_stories(epic_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Story).where(Story.epic_id == epic_id).order_by(Story.order_index)
    )
    return result.scalars().all()


@router.get("/{story_id}", response_model=StoryRead)
async def get_story(story: Story = Depends(get_story_or_404)):
    return story


@router.post("/", response_model=StoryRead, status_code=201)
async def create_story(data: StoryCreate, db: AsyncSession = Depends(get_db)):
    epic = await db.get(Epic, data.epic_id)
    if not epic:
        raise HTTPException(status_code=404, detail="Epic not found")

    story_data = data.model_dump(exclude={"epic_id", "order_index"})
    story_data["state"] = story_data["state"].value if hasattr(story_data["state"], "value") else story_data["state"]

    story, consumed = await consume_or_expand_story(db, data.epic_id, story_data)

    if data.order_index is not None:
        await insert_at_position(db, "story", data.epic_id, data.order_index, story.id)

    await normalize_order(db, "story", data.epic_id)

    # Recalculate epic -> milestone -> phase -> project (points bubble up)
    # Story points contribute to epic points
    from sqlalchemy import func as sqlfunc
    pts_result = await db.execute(
        select(sqlfunc.coalesce(sqlfunc.sum(Story.estimated_points), 0.0))
        .where(Story.epic_id == data.epic_id)
    )
    epic.total_estimated_points = float(pts_result.scalar_one())

    await cascade_recalculate_from_milestone(db, epic.milestone_id, reason="New story created")
    await db.flush()
    await db.refresh(story)
    return story


@router.patch("/{story_id}", response_model=StoryRead)
async def update_story(story: Story = Depends(get_story_or_404), data: StoryUpdate = None, db: AsyncSession = Depends(get_db)):
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(story, key, value)

    if "order_index" in updates:
        await insert_at_position(db, "story", story.epic_id, updates["order_index"], story.id)
        await normalize_order(db, "story", story.epic_id)

    # Recalculate epic points
    epic = await db.get(Epic, story.epic_id)
    if epic:
        from sqlalchemy import func as sqlfunc
        pts_result = await db.execute(
            select(sqlfunc.coalesce(sqlfunc.sum(Story.estimated_points), 0.0))
            .where(Story.epic_id == story.epic_id)
        )
        epic.total_estimated_points = float(pts_result.scalar_one())
        await cascade_recalculate_from_milestone(db, epic.milestone_id, reason="Story updated")

    await db.flush()
    await db.refresh(story)
    return story


@router.delete("/{story_id}", status_code=204)
async def delete_story(story = Depends(get_story_or_404), db: AsyncSession = Depends(get_db)):
    epic_id = story.epic_id
    await db.delete(story)
    await db.flush()
    await normalize_order(db, "story", epic_id)

    # Recalculate epic points
    epic = await db.get(Epic, epic_id)
    if epic:
        from sqlalchemy import func as sqlfunc
        pts_result = await db.execute(
            select(sqlfunc.coalesce(sqlfunc.sum(Story.estimated_points), 0.0))
            .where(Story.epic_id == epic_id)
        )
        epic.total_estimated_points = float(pts_result.scalar_one())
        await cascade_recalculate_from_milestone(db, epic.milestone_id, reason="Story deleted")
