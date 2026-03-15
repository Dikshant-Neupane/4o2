"""
Department ORM model — government departments that receive reports.
"""

from sqlalchemy import Boolean, Column, Integer, String, Text

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category_id = Column(String(50), nullable=False, unique=True, index=True)
    icon = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=False)
    description = Column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<Department(id={self.id}, name='{self.name}')>"
