from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class ChangeLog(Base):
    __tablename__ = "change_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # "project", "phase", "milestone", "epic", "story", "allocation"
    entity_id = Column(Integer, nullable=False)
    field_changed = Column(String(255), nullable=False)
    old_value = Column(String(1000), nullable=True)
    new_value = Column(String(1000), nullable=True)
    reason = Column(String(2000), default="")
    changed_by = Column(String(255), default="system")
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
