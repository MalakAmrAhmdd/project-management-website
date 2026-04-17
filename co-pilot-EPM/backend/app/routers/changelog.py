from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.models import ChangeLog
from app.schemas.changelog import ChangeLogRead

router = APIRouter()


@router.get("/", response_model=List[ChangeLogRead])
async def list_changelog(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(ChangeLog).order_by(ChangeLog.changed_at.desc()).limit(limit)
    if entity_type:
        q = q.where(ChangeLog.entity_type == entity_type)
    if entity_id is not None:
        q = q.where(ChangeLog.entity_id == entity_id)
    result = await db.execute(q)
    return result.scalars().all()
