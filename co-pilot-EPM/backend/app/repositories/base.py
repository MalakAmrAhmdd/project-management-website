from abc import ABC, abstractmethod
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

class BaseRepository(ABC):
    def __init__(self, model ,db: AsyncSession):
        self.model = model 
        self.db = db

    async def get(self, id: int):
        return await self.db.get(self.model, id)

    async def create(self, data: BaseModel):
        obj = self.model(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj, data: BaseModel):
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, key, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj):
        await self.db.delete(obj)

    @abstractmethod
    async def list(self) -> list: ...