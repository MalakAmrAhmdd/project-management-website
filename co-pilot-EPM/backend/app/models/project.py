from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import ItemState


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(2000), default="")
    state = Column(Enum(ItemState), default=ItemState.NOT_STARTED, nullable=False)

    total_estimated_points = Column(Float, default=0.0)
    num_allocated_resources = Column(Integer, default=0)

    original_start_date = Column(Date, nullable=True)
    original_end_date = Column(Date, nullable=True)
    actual_start_date = Column(Date, nullable=True)
    adaptive_end_date = Column(Date, nullable=True)

    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="projects")
    phases = relationship("Phase", back_populates="project", cascade="all, delete-orphan",
                          order_by="Phase.order_index")
