from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    role = Column(String(255), default="Engineer")
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)

    # Computed/cached fields — updated by calculation engine
    allocation_percentage = Column(Float, default=0.0)
    overall_avg_velocity = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="members")
    allocations = relationship("Allocation", back_populates="member", cascade="all, delete-orphan")
