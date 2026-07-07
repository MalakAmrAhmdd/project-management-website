from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime


class MemberCreate(BaseModel):
    name: str
    email: str
    role: str = "Engineer"
    team_id: int


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team_id: Optional[int] = None


class MemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str
    team_id: int
    allocation_percentage: float
    overall_avg_velocity: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AllocationBrief(BaseModel):
    allocation_id: int
    milestone_id: int
    milestone_name: Optional[str] = None
    milestone_state: Optional[str] = None
    phase_name: Optional[str]= None
    project_name: Optional[str] = None
    velocity_if_100_pct: float
    contribution_percentage: float
    effective_velocity: float
    average_fto: float


class MemberWithContributions(MemberRead):
    allocations: List[AllocationBrief] = []


from app.schemas.allocation import AllocationRead  # noqa: E402
MemberWithContributions.model_rebuild()
