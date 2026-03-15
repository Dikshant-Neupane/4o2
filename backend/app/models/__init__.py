# ORM Models package
from app.models.dataset import Dataset
from app.models.training_run import TrainingRun
from app.models.user import User
from app.models.department import Department
from app.models.report import Report
from app.models.vote import Vote
from app.models.comment import Comment

__all__ = [
    "Dataset", "TrainingRun",
    "User", "Department", "Report", "Vote", "Comment",
]

print("[PHASE 2] ✅ All DB models defined: users, departments, reports, votes, comments")
