from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import ItemState


class Phase(Base):
    __tablename__ = "phases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(2000), default="")
    state = Column(Enum(ItemState), default=ItemState.NOT_STARTED, nullable=False)
    order_index = Column(Integer, default=0)
    is_placeholder = Column(Boolean, default=False)

    total_estimated_points = Column(Float, default=0.0)
    num_allocated_resources = Column(Integer, default=0)

    original_start_date = Column(Date, nullable=True)
    original_end_date = Column(Date, nullable=True)
    actual_start_date = Column(Date, nullable=True)
    adaptive_end_date = Column(Date, nullable=True)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="phases")
    milestones = relationship("Milestone", back_populates="phase", cascade="all, delete-orphan",
                              order_by="Milestone.order_index")
