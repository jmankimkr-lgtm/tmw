from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey,
    Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Planner(Base):
    __tablename__ = "planners"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_planner_user_date"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    one_win = Column(Text)
    tomorrow_1 = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="planners")
    brain_dumps = relationship("BrainDump", back_populates="planner", cascade="all, delete")
    big3_tasks = relationship("Big3Task", back_populates="planner", cascade="all, delete")
    time_blocks = relationship("TimeBlock", back_populates="planner", cascade="all, delete")


class BrainDump(Base):
    __tablename__ = "brain_dumps"

    id = Column(Integer, primary_key=True, index=True)
    planner_id = Column(Integer, ForeignKey("planners.id", ondelete="CASCADE"), nullable=False)
    seq = Column(Integer, nullable=False)   # 1~15
    content = Column(Text)

    planner = relationship("Planner", back_populates="brain_dumps")


class Big3Task(Base):
    __tablename__ = "big3_tasks"

    id = Column(Integer, primary_key=True, index=True)
    planner_id = Column(Integer, ForeignKey("planners.id", ondelete="CASCADE"), nullable=False)
    seq = Column(Integer, nullable=False)   # 1~3
    task = Column(Text)
    detail_goal = Column(Text)
    is_done = Column(Boolean, default=False)

    planner = relationship("Planner", back_populates="big3_tasks")


class TimeBlock(Base):
    __tablename__ = "time_blocks"

    id = Column(Integer, primary_key=True, index=True)
    planner_id = Column(Integer, ForeignKey("planners.id", ondelete="CASCADE"), nullable=False)
    time_slot = Column(String(20), nullable=False)  # e.g. '07:30-08:00'
    task = Column(Text)
    is_done = Column(Boolean, default=False)

    planner = relationship("Planner", back_populates="time_blocks")
