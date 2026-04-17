from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class TeamCreate(BaseModel):
    name: str
    description: str = ""


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TeamWithMembers(TeamRead):
    members: List["MemberRead"] = []


from app.schemas.member import MemberRead  # noqa: E402
TeamWithMembers.model_rebuild()
