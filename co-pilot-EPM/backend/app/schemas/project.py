from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from app.models.enums import ItemState


# ── Project ──────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    state: ItemState = ItemState.NOT_STARTED
    total_estimated_points: float = 0.0
    original_start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    team_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    state: Optional[ItemState] = None
    total_estimated_points: Optional[float] = None
    original_start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    adaptive_end_date: Optional[date] = None
    team_id: Optional[int] = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    state: ItemState
    total_estimated_points: float
    num_allocated_resources: int
    original_start_date: Optional[date]
    original_end_date: Optional[date]
    actual_start_date: Optional[date]
    adaptive_end_date: Optional[date]
    team_id: Optional[int]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Phase ────────────────────────────────────────────────

class PhaseCreate(BaseModel):
    name: str
    description: str = ""
    state: ItemState = ItemState.NOT_STARTED
    order_index: Optional[int] = None
    is_placeholder: bool = False
    total_estimated_points: float = 0.0
    original_start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    project_id: int


class PhaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    state: Optional[ItemState] = None
    order_index: Optional[int] = None
    is_placeholder: Optional[bool] = None
    total_estimated_points: Optional[float] = None
    original_start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    adaptive_end_date: Optional[date] = None


class PhaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    state: ItemState
    order_index: int
    is_placeholder: bool
    total_estimated_points: float
    num_allocated_resources: int
    original_start_date: Optional[date]
    original_end_date: Optional[date]
    actual_start_date: Optional[date]
    adaptive_end_date: Optional[date]
    project_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Milestone ────────────────────────────────────────────

class MilestoneCreate(BaseModel):
    name: str
    description: str = ""
    state: ItemState = ItemState.NOT_STARTED
    order_index: Optional[int] = None
    is_placeholder: bool = False
    total_estimated_points: float = 0.0
    original_start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    phase_id: int


class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    state: Optional[ItemState] = None
    order_index: Optional[int] = None
    is_placeholder: Optional[bool] = None
    total_estimated_points: Optional[float] = None
    original_start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    adaptive_end_date: Optional[date] = None


class MilestoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    state: ItemState
    order_index: int
    is_placeholder: bool
    total_estimated_points: float
    num_allocated_resources: int
    original_start_date: Optional[date]
    original_end_date: Optional[date]
    actual_start_date: Optional[date]
    adaptive_end_date: Optional[date]
    phase_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Epic ─────────────────────────────────────────────────

class EpicCreate(BaseModel):
    name: str
    description: str = ""
    state: ItemState = ItemState.NOT_STARTED
    order_index: Optional[int] = None
    is_placeholder: bool = False
    total_estimated_points: float = 0.0
    original_start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    milestone_id: int


class EpicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    state: Optional[ItemState] = None
    order_index: Optional[int] = None
    is_placeholder: Optional[bool] = None
    total_estimated_points: Optional[float] = None
    original_start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    adaptive_end_date: Optional[date] = None


class EpicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    state: ItemState
    order_index: int
    is_placeholder: bool
    total_estimated_points: float
    num_allocated_resources: int
    original_start_date: Optional[date]
    original_end_date: Optional[date]
    actual_start_date: Optional[date]
    adaptive_end_date: Optional[date]
    milestone_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Story ────────────────────────────────────────────────

class StoryCreate(BaseModel):
    name: str
    description: str = ""
    state: ItemState = ItemState.NOT_STARTED
    order_index: Optional[int] = None
    is_placeholder: bool = False
    estimated_points: float = 0.0
    epic_id: int


class StoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    state: Optional[ItemState] = None
    order_index: Optional[int] = None
    is_placeholder: Optional[bool] = None
    estimated_points: Optional[float] = None


class StoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    state: ItemState
    order_index: int
    is_placeholder: bool
    estimated_points: float
    epic_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Nested reads for tree views ──────────────────────────

class StoryReadBrief(StoryRead):
    pass


class EpicWithStories(EpicRead):
    stories: List[StoryReadBrief] = []


class MilestoneWithEpics(MilestoneRead):
    epics: List[EpicWithStories] = []


class PhaseWithMilestones(PhaseRead):
    milestones: List[MilestoneWithEpics] = []


class ProjectFull(ProjectRead):
    phases: List[PhaseWithMilestones] = []
