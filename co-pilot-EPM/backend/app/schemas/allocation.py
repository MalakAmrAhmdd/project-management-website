from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class AllocationCreate(BaseModel):
    member_id: int
    milestone_id: int
    velocity_if_100_pct: float = 0.0
    contribution_percentage: float = 1.0
    average_fto: float = 0.0


class AllocationUpdate(BaseModel):
    velocity_if_100_pct: Optional[float] = None
    contribution_percentage: Optional[float] = None
    average_fto: Optional[float] = None


class AllocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    member_id: int
    milestone_id: int
    velocity_if_100_pct: float
    contribution_percentage: float
    effective_velocity: float
    average_fto: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AllocationWithDetails(AllocationRead):
    member_name: Optional[str] = None
    member_email: Optional[str] = None
    milestone_name: Optional[str] = None
    phase_name: Optional[str] = None
    project_name: Optional[str] = None
