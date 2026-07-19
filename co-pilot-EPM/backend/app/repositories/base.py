from abc import ABC, abstractmethod
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

class BaseRepository[T](ABC):
    def __init__(self, model: type[T] ,db: AsyncSession):
        self.model = model 
        self.db = db

    async def get(self, id: int) -> T | None:
        return await self.db.get(self.model, id)

    async def create(self, data: BaseModel) -> T:
        obj = self.model(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: T, data: BaseModel) -> T:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, key, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: T) -> None:
        await self.db.delete(obj)

    @abstractmethod
    async def list(self) -> list[T]: ...