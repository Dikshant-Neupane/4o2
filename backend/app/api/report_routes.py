"""
Report API — submit reports (with AI pipeline), nearby feed, voting, comments.

Prefix: /api/v1/reports
Covers Phases 6, 7, and 8.
"""

import json
import os
from datetime import datetime
from io import BytesIO
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from PIL import Image
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.auth import get_current_user, get_optional_user
from app.models.comment import Comment
from app.models.department import Department
from app.models.report import Report
from app.models.user import User
from app.models.vote import Vote
from app.services.inference import InferenceService
from app.utils.geo_utils import haversine_distance

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

# ── Singleton inference service ─────────────────────────────────
_inference_service: Optional[InferenceService] = None


def _get_inference() -> InferenceService:
    global _inference_service
    if _inference_service is None:
        _inference_service = InferenceService()
    return _inference_service


# ── Media directory ─────────────────────────────────────────────
MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media", "uploads")
os.makedirs(MEDIA_DIR, exist_ok=True)


# ── Schemas ─────────────────────────────────────────────────────
class ReportResponse(BaseModel):
    id: int
    user_id: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    image_path: Optional[str] = None
    latitude: float
    longitude: float
    description: Optional[str] = None
    status: str = "pending"
    ai_detected: bool = False
    ai_detection_confidence: Optional[float] = None
    ai_severity: Optional[str] = None
    ai_bounding_box_json: Optional[str] = None
    priority_score: float = 0.0
    verified: bool = False
    like_count: int = 0
    dislike_count: int = 0
    alert_type: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportDetailResponse(ReportResponse):
    comments: List["CommentResponse"] = []


class VoteRequest(BaseModel):
    action: str  # 'like' | 'dislike'


class VoteResponse(BaseModel):
    like_count: int
    dislike_count: int
    verified: bool


class CommentRequest(BaseModel):
    text: str


class CommentResponse(BaseModel):
    id: int
    report_id: int
    user_id: int
    text: str
    created_at: Optional[datetime] = None
    user: Optional["CommentUserResponse"] = None

    class Config:
        from_attributes = True


class CommentUserResponse(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True


class ReportStatusResponse(BaseModel):
    id: int
    status: str
    ai_processed: bool = False
    severity: Optional[str] = None
    confidence: Optional[str] = None
    width_cm: Optional[str] = None
    depth_cm: Optional[str] = None


# ── Helpers ─────────────────────────────────────────────────────
def _severity_from_confidence(confidence: float) -> str:
    if confidence > 0.8:
        return "HIGH"
    elif confidence > 0.6:
        return "MEDIUM"
    return "LOW"


_SEVERITY_WEIGHT = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}


def _cluster_check(report: Report, db: Session) -> str:
    """Phase 8: count nearby active reports and decide reconstruction vs individual."""
    all_reports = db.query(Report).filter(
        Report.id != report.id,
        Report.status != "rejected",
    ).all()

    cluster_count = 0
    for r in all_reports:
        dist = haversine_distance(report.latitude, report.longitude, r.latitude, r.longitude)
        if dist <= 500:
            cluster_count += 1

    print(f"[PHASE 8] 📍 Cluster check for report {report.id} at ({report.latitude}, {report.longitude})")
    print(f"[PHASE 8] Nearby active reports: {cluster_count}")

    if cluster_count >= 5:
        print(f"[PHASE 8] 🚨 RECONSTRUCTION ALERT — {cluster_count} reports within 500m")
        return "reconstruction"
    else:
        print("[PHASE 8] 🔧 INDIVIDUAL REPAIR REQUEST")
        return "individual"


def _enrich_report_response(report: Report, db: Session) -> dict:
    """Build a response dict with department name included."""
    data = {
        "id": report.id,
        "user_id": report.user_id,
        "department_id": report.department_id,
        "department_name": None,
        "image_path": report.image_path,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "description": report.description,
        "status": report.status,
        "ai_detected": report.ai_detected,
        "ai_detection_confidence": report.ai_detection_confidence,
        "ai_severity": report.ai_severity,
        "ai_bounding_box_json": report.ai_bounding_box_json,
        "priority_score": report.priority_score,
        "verified": report.verified,
        "like_count": report.like_count,
        "dislike_count": report.dislike_count,
        "alert_type": report.alert_type,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }
    if report.department_id:
        dept = db.query(Department).filter(Department.id == report.department_id).first()
        if dept:
            data["department_name"] = dept.name
    return data


# ═══════════════════════════════════════════════════════════════
# Phase 6: Submit a report (with AI inference pipeline)
# ═══════════════════════════════════════════════════════════════
@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    category_id: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    print(f"[PHASE 6] 📥 New report submitted by user {current_user.id}")

    # Validate MIME type
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images accepted")

    # Validate category
    dept = db.query(Department).filter(Department.category_id == category_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail=f"Unknown category_id: {category_id}")

    # Read image bytes
    image_bytes = await image.read()

    # ── CRITICAL: Run AI inference ────────────────────────────
    print("[PHASE 6] Running AI inference...")
    try:
        service = _get_inference()
        ai_result = service.predict_from_bytes(image_bytes)
    except Exception as e:
        print(f"[PHASE 6] ⚠️ AI inference failed: {e}")
        ai_result = {
            "label": 0,
            "class_name": "unknown",
            "confidence": 0.0,
            "predictions": [],
            "model_version": None,
        }

    detected = ai_result.get("label", 0) == 1
    confidence = ai_result.get("confidence", 0.0)
    predictions = ai_result.get("predictions", [])
    severity = _severity_from_confidence(confidence) if detected else "LOW"
    priority_score = confidence * _SEVERITY_WEIGHT.get(severity, 1)

    print("[PHASE 6] === AI RESULTS ===")
    print(f"[PHASE 6] Pothole detected: {detected} (confidence: {confidence:.2%})")
    print(f"[PHASE 6] Severity: {severity} | Priority score: {priority_score:.2f}")
    print(f"[PHASE 6] Bounding boxes found: {len(predictions)}")

    # Create report record (get ID first so we can name the image)
    report = Report(
        user_id=current_user.id,
        department_id=dept.id,
        latitude=latitude,
        longitude=longitude,
        description=description,
        status="pending",
        ai_detected=detected,
        ai_detection_confidence=confidence,
        ai_severity=severity,
        ai_bounding_box_json=json.dumps(predictions) if predictions else None,
        priority_score=priority_score,
    )
    db.add(report)
    db.flush()  # get report.id

    # Save image as WebP (compress to max ~500 KB)
    try:
        img = Image.open(BytesIO(image_bytes))
        save_path = os.path.join(MEDIA_DIR, f"{report.id}.webp")
        img.save(save_path, "WEBP", quality=75)
        report.image_path = f"/media/uploads/{report.id}.webp"
        print(f"[PHASE 6] Image saved: {save_path}")
    except Exception as e:
        print(f"[PHASE 6] ⚠️ Image save failed: {e}")

    # Phase 8: cluster check
    report.alert_type = _cluster_check(report, db)

    db.commit()
    db.refresh(report)

    print(f"[PHASE 6] ✅ Report {report.id} saved to DB. Routed to: {dept.name}")

    # Broadcast via WebSocket (import here to avoid circular)
    try:
        from app.api.ws_routes import broadcast_nearby_alert
        broadcast_nearby_alert(report, db)
    except Exception as e:
        print(f"[PHASE 6] WebSocket broadcast skipped: {e}")

    return _enrich_report_response(report, db)


# ═══════════════════════════════════════════════════════════════
# Phase 6: Get nearby reports
# ═══════════════════════════════════════════════════════════════
@router.get("/nearby", response_model=List[ReportResponse])
def get_nearby_reports(
    lat: float,
    lng: float,
    radius: int = 500,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    print(f"[PHASE 6] GET /nearby at ({lat}, {lng}) radius={radius}m")
    all_reports = db.query(Report).filter(Report.status != "rejected").all()

    nearby = []
    for r in all_reports:
        dist = haversine_distance(lat, lng, r.latitude, r.longitude)
        if dist <= radius:
            nearby.append((dist, r))

    nearby.sort(key=lambda x: x[0])
    nearby = nearby[:limit]

    print(f"[PHASE 6] ✅ Found {len(nearby)} reports within {radius}m")
    return [_enrich_report_response(r, db) for _, r in nearby]


# ═══════════════════════════════════════════════════════════════
# Phase 6: Get report by ID
# ═══════════════════════════════════════════════════════════════
@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _enrich_report_response(report, db)


# ═══════════════════════════════════════════════════════════════
# Phase 6: Get report status (polled by SubmissionSuccess page)
# ═══════════════════════════════════════════════════════════════
@router.get("/{report_id}/status", response_model=ReportStatusResponse)
def get_report_status(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportStatusResponse(
        id=report.id,
        status=report.status,
        ai_processed=report.ai_detected is not None,
        severity=report.ai_severity,
        confidence=f"{(report.ai_detection_confidence or 0) * 100:.0f}%",
    )


# ═══════════════════════════════════════════════════════════════
# Phase 7: Vote on a report
# ═══════════════════════════════════════════════════════════════
@router.post("/{report_id}/vote", response_model=VoteResponse)
def cast_vote(
    report_id: int,
    body: VoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.action not in ("like", "dislike"):
        raise HTTPException(status_code=400, detail="action must be 'like' or 'dislike'")

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    existing = db.query(Vote).filter(Vote.report_id == report_id, Vote.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="ALREADY_VOTED")

    print(f"[PHASE 7] Vote: {body.action} on report {report_id} by user {current_user.id}")

    vote = Vote(report_id=report_id, user_id=current_user.id, action=body.action)
    db.add(vote)

    if body.action == "like":
        report.like_count = (report.like_count or 0) + 1
    else:
        report.dislike_count = (report.dislike_count or 0) + 1

    # Auto-verify if enough likes
    if (report.like_count or 0) >= 5 and (report.dislike_count or 0) < (report.like_count or 0) / 2:
        if not report.verified:
            report.verified = True
            print(f"[PHASE 7] 🏅 Report {report_id} VERIFIED!")
            try:
                from app.api.ws_routes import broadcast_verified
                broadcast_verified(report)
            except Exception:
                pass

    db.commit()
    db.refresh(report)
    print(f"[PHASE 7] ✅ Vote recorded. Likes: {report.like_count}, Dislikes: {report.dislike_count}")

    return VoteResponse(
        like_count=report.like_count or 0,
        dislike_count=report.dislike_count or 0,
        verified=report.verified,
    )


# ═══════════════════════════════════════════════════════════════
# Phase 7: Add a comment
# ═══════════════════════════════════════════════════════════════
@router.post("/{report_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    report_id: int,
    body: CommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Comment text required")
    if len(body.text) > 500:
        raise HTTPException(status_code=400, detail="Comment must be 500 chars or less")

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    comment = Comment(report_id=report_id, user_id=current_user.id, text=body.text.strip())
    db.add(comment)
    db.commit()
    db.refresh(comment)

    user = db.query(User).filter(User.id == current_user.id).first()
    print(f"[PHASE 7] 💬 Comment added on report {report_id} by {user.name}")

    return CommentResponse(
        id=comment.id,
        report_id=comment.report_id,
        user_id=comment.user_id,
        text=comment.text,
        created_at=comment.created_at,
        user=CommentUserResponse(id=user.id, name=user.name) if user else None,
    )


# ═══════════════════════════════════════════════════════════════
# Phase 7: Get comments for a report
# ═══════════════════════════════════════════════════════════════
@router.get("/{report_id}/comments", response_model=List[CommentResponse])
def get_comments(report_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(Comment)
        .filter(Comment.report_id == report_id)
        .order_by(Comment.created_at.desc())
        .all()
    )
    result = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        result.append(CommentResponse(
            id=c.id,
            report_id=c.report_id,
            user_id=c.user_id,
            text=c.text,
            created_at=c.created_at,
            user=CommentUserResponse(id=user.id, name=user.name) if user else None,
        ))
    return result
