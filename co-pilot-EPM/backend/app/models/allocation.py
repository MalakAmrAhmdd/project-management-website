from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class Allocation(Base):
    __tablename__ = "allocations"
    __table_args__ = (
        UniqueConstraint("member_id", "milestone_id", name="uq_member_milestone"),
    )

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    milestone_id = Column(Integer, ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False)

    velocity_if_100_pct = Column(Float, default=0.0)       # story points/week if 100% dedicated
    contribution_percentage = Column(Float, default=1.0)    # 0.0 .. N (fraction of time on this milestone)
    effective_velocity = Column(Float, default=0.0)         # velocity_if_100_pct * contribution_percentage
    average_fto = Column(Float, default=0.0)                # average future time off in weeks

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    member = relationship("Member", back_populates="allocations")
    milestone = relationship("Milestone", back_populates="allocations")
