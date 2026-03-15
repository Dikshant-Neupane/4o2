"""
Database seed utilities — run once on startup to populate lookup tables.
"""

from sqlalchemy.orm import Session
from app.models.department import Department


SEED_DEPARTMENTS = [
    {
        "category_id": "road_damage",
        "name": "Department of Roads",
        "icon": "Construction",
        "is_active": True,
        "description": "Handles pothole and road surface issues",
    },
    {
        "category_id": "electrical",
        "name": "Nepal Electricity Authority (NEA)",
        "icon": "Zap",
        "is_active": False,
        "description": "Handles street light and electrical issues",
    },
    {
        "category_id": "water_sanitation",
        "name": "Department of Urban Development",
        "icon": "Droplets",
        "is_active": False,
        "description": "Handles drainage and sewage issues",
    },
    {
        "category_id": "waste_management",
        "name": "KMC Waste Management Division",
        "icon": "Trash2",
        "is_active": False,
        "description": "Handles garbage and waste issues",
    },
    {
        "category_id": "public_space",
        "name": "Kathmandu Metropolitan City",
        "icon": "Trees",
        "is_active": False,
        "description": "Handles public space and park issues",
    },
]


def seed_departments(db: Session) -> int:
    """Insert default departments if the table is empty. Returns count seeded."""
    existing = db.query(Department).count()
    if existing > 0:
        print(f"[PHASE 3] Departments already seeded ({existing} rows)")
        return 0

    print("[PHASE 3] Seeding departments...")
    for item in SEED_DEPARTMENTS:
        db.add(Department(**item))
    db.commit()
    n = len(SEED_DEPARTMENTS)
    print(f"[PHASE 3] ✅ {n} departments seeded")
    return n
