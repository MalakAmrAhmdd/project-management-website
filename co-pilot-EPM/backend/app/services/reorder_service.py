"""
Reorder Service — handles inserting items at arbitrary positions
and normalizing order_index for siblings.
"""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Phase, Milestone, Epic, Story


_MODEL_MAP = {
    "phase": (Phase, "project_id"),
    "milestone": (Milestone, "phase_id"),
    "epic": (Epic, "milestone_id"),
    "story": (Story, "epic_id"),
}


async def insert_at_position(
    db: AsyncSession,
    entity_type: str,
    parent_id: int,
    position: int,
    entity_id: int,
):
    """Move an entity to a specific position among its siblings, shifting others."""
    model_cls, parent_fk = _MODEL_MAP[entity_type]

    # Get all siblings ordered
    result = await db.execute(
        select(model_cls)
        .where(getattr(model_cls, parent_fk) == parent_id)
        .order_by(model_cls.order_index)
    )
    siblings = list(result.scalars().all())

    # Remove target from list
    target = None
    remaining = []
    for s in siblings:
        if s.id == entity_id:
            target = s
        else:
            remaining.append(s)

    if target is None:
        return

    # Insert at requested position
    position = max(0, min(position, len(remaining)))
    remaining.insert(position, target)

    # Renumber
    for idx, item in enumerate(remaining):
        item.order_index = idx


async def normalize_order(
    db: AsyncSession,
    entity_type: str,
    parent_id: int,
):
    """Normalize order_index values to be sequential starting from 0."""
    model_cls, parent_fk = _MODEL_MAP[entity_type]

    result = await db.execute(
        select(model_cls)
        .where(getattr(model_cls, parent_fk) == parent_id)
        .order_by(model_cls.order_index)
    )
    siblings = list(result.scalars().all())

    for idx, item in enumerate(siblings):
        item.order_index = idx
