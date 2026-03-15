"""
Vote ORM model — likes / dislikes on reports.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("report_id", "user_id", name="uq_vote_user_report"),)

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action = Column(String(10), nullable=False)  # 'like' | 'dislike'
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="votes")
    user = relationship("User", backref="votes")

    def __repr__(self) -> str:
        return f"<Vote(id={self.id}, action='{self.action}')>"
