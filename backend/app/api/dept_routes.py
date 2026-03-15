"""
Department API — list available civic departments/categories.

Prefix: /api/v1/departments
"""

from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.department import Department

router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])


class DepartmentResponse(BaseModel):
    id: int
    name: str
    category_id: str
    icon: Optional[str] = None
    is_active: bool = False
    description: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    """Return all departments from DB. Frontend uses this to populate category cards."""
    depts = db.query(Department).all()
    print(f"[PHASE 5] GET /departments — returning {len(depts)} departments")
    return [DepartmentResponse.model_validate(d) for d in depts]
