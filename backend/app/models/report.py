"""
Report ORM model — civic issue reports submitted by citizens.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    image_path = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending")

    # AI detection fields
    ai_detected = Column(Boolean, default=False)
    ai_detection_confidence = Column(Float, nullable=True)
    ai_severity = Column(String(20), nullable=True)
    ai_severity_confidence = Column(Float, nullable=True)
    ai_bounding_box_json = Column(Text, nullable=True)

    # Scoring
    priority_score = Column(Float, default=0.0)
    verified = Column(Boolean, default=False)
    like_count = Column(Integer, default=0)
    dislike_count = Column(Integer, default=0)

    # Clustering
    alert_type = Column(String(20), nullable=True)  # 'reconstruction' | 'individual'

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="reports")
    department = relationship("Department", backref="reports")
    votes = relationship("Vote", back_populates="report", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="report", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Report(id={self.id}, status='{self.status}', severity='{self.ai_severity}')>"
