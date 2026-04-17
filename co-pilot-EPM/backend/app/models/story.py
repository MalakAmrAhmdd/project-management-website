from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import ItemState


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(2000), default="")
    state = Column(Enum(ItemState), default=ItemState.NOT_STARTED, nullable=False)
    order_index = Column(Integer, default=0)
    is_placeholder = Column(Boolean, default=False)

    estimated_points = Column(Float, default=0.0)

    epic_id = Column(Integer, ForeignKey("epics.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    epic = relationship("Epic", back_populates="stories")
