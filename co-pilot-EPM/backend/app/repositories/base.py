from abc import ABC, abstractmethod
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

class BaseRepository(ABC):
    def __init__(self, model):
        self.model = model 

    async def get(self, id: int,db: AsyncSession):
        return await db.get(self.model, id)

    async def create(self, data: BaseModel, db: AsyncSession):
        obj = self.model(**data.model_dump())
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj

    async def update(self, obj, data: BaseModel, db: AsyncSession):
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, key, value)
        await db.flush()
        await db.refresh(obj)
        return obj

    async def delete(self, obj,db: AsyncSession):
        await db.delete(obj)

    @abstractmethod
    async def list(self, db: AsyncSession) -> list: ...