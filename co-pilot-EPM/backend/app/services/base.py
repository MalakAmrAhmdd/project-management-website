# services/base.py
from typing import Generic, TypeVar, Callable
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository

T = TypeVar("T")

class HierarchyService(Generic[T]):
    def __init__(
        self,
        repo: BaseRepository[T],
        parent_field: str,          # "phase_id", "milestone_id", "project_id"
        create_placeholders: Callable  # function to create children placeholders
    ):
        self.repo = repo
        self.parent_field = parent_field
        self.create_placeholders = create_placeholders

    async def consume_or_expand(self, parent_id: int, data: dict, db: AsyncSession) -> tuple[T, bool]:
        placeholder = await self.repo.find_placeholder(db, self.parent_field, parent_id)

        if placeholder:
            for key, value in data.items():
                if value is not None:
                    setattr(placeholder, key, value)
            placeholder.is_placeholder = False
            return placeholder, True
        else:
            max_idx = await self.repo.get_max_order_index(db, self.parent_field, parent_id)
            data.pop("is_placeholder", None)
            obj = self.repo.model(
                **{self.parent_field: parent_id},
                order_index=max_idx + 1,
                is_placeholder=False,
                **data
            )
            await self.repo.create(db, obj)
            await self.create_placeholders(db, obj.id)
            return obj, False

    async def create_placeholder(self, parent_id: int) -> T:
        pass