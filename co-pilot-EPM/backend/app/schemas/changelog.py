from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ChangeLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    field_changed: str
    old_value: Optional[str]
    new_value: Optional[str]
    reason: str
    changed_by: str
    changed_at: Optional[datetime] = None
