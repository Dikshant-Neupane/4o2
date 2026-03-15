"""
Report API — submit reports (with AI pipeline), nearby feed, voting, comments.

Prefix: /api/v1/reports
Covers Phases 6, 7, and 8.
"""

import json
import os
from datetime import datetime
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from loguru import logger
from PIL import Image
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.api.deps import get_current_user, get_optional_user
from app.models.comment import Comment
from app.models.department import Department
from app.models.report import Report
from app.models.user import User
from app.models.vote import Vote
from app.services.inference import InferenceService
from app.utils.geo_utils import haversine_distance

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

# ── Constants ───────────────────────────────────────────────────
CLUSTER_RADIUS_M = 500
CLUSTER_THRESHOLD = 5
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
VERIFY_LIKE_THRESHOLD = 5

# Approximate degree deltas for bounding-box pre-filter (~500m at ~27°N Nepal)
LAT_DELTA = 0.0045
LNG_DELTA = 0.0055

SEVERITY_WEIGHT = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}

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
    width_cm: Optional[float] = None
    depth_cm: Optional[float] = None
    area_sqm: Optional[float] = None
    road_type: Optional[str] = None
    weather: Optional[str] = None
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
    comments: list["CommentResponse"] = []


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
    user_id: str
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
    area_sqm: Optional[str] = None
    road_type: Optional[str] = None
    weather: Optional[str] = None


# ── Helpers ─────────────────────────────────────────────────────
def _severity_from_confidence(confidence: float) -> str:
    if confidence > 0.8:
        return "HIGH"
    elif confidence > 0.6:
        return "MEDIUM"
    return "LOW"


def _cluster_check(report: Report, db: Session) -> str:
    """Phase 8: count nearby active reports using bounding-box pre-filter."""
    # Issue #7: Pre-filter by bounding box before computing haversine
    nearby_reports = db.query(Report).filter(
        Report.id != report.id,
        Report.status != "rejected",
        Report.latitude.between(report.latitude - LAT_DELTA, report.latitude + LAT_DELTA),
        Report.longitude.between(report.longitude - LNG_DELTA, report.longitude + LNG_DELTA),
    ).all()

    cluster_count = sum(
        1 for r in nearby_reports
        if haversine_distance(report.latitude, report.longitude, r.latitude, r.longitude) <= CLUSTER_RADIUS_M
    )

    logger.info("Cluster check for report {} — {} nearby reports", report.id, cluster_count)

    if cluster_count >= CLUSTER_THRESHOLD:
        logger.info("RECONSTRUCTION ALERT — {} reports within {}m", cluster_count, CLUSTER_RADIUS_M)
        return "reconstruction"
    else:
        return "individual"


def _report_to_dict(report: Report) -> dict:
    """Build a response dict from a report with eagerly-loaded department."""
    dept_name = None
    if report.department:
        dept_name = report.department.name

    return {
        "id": report.id,
        "user_id": report.user_id,
        "department_id": report.department_id,
        "department_name": dept_name,
        "image_path": report.image_path,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "description": report.description,
        "status": report.status,
        "ai_detected": report.ai_detected,
        "ai_detection_confidence": report.ai_detection_confidence,
        "ai_severity": report.ai_severity,
        "ai_bounding_box_json": report.ai_bounding_box_json,
        "width_cm": report.width_cm,
        "depth_cm": report.depth_cm,
        "area_sqm": report.area_sqm,
        "road_type": report.road_type,
        "weather": report.weather,
        "priority_score": report.priority_score,
        "verified": report.verified,
        "like_count": report.like_count,
        "dislike_count": report.dislike_count,
        "alert_type": report.alert_type,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }


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
    logger.info("New report submitted by user {}", current_user.id)

    # Validate MIME type
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images accepted")

    # Validate category
    dept = db.query(Department).filter(Department.category_id == category_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail=f"Unknown category_id: {category_id}")

    # Read image bytes with size limit (Issue #13)
    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail=f"Image must be under {MAX_IMAGE_SIZE // (1024*1024)} MB")

    # ── Run AI inference ──────────────────────────────────────
    try:
        service = _get_inference()
        ai_result = service.predict_from_bytes(image_bytes)
    except Exception as e:
        logger.warning("AI inference failed: {}", e)
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
    priority_score = confidence * SEVERITY_WEIGHT.get(severity, 1)

    width_cm = predictions[0].get("width_cm") if predictions else None
    depth_cm = predictions[0].get("depth_cm") if predictions else None
    area_sqm = predictions[0].get("area_sqm") if predictions else None
    road_type = predictions[0].get("road_type") if predictions else None
    weather = predictions[0].get("weather") if predictions else None

    logger.info("AI result: detected={}, confidence={:.2%}, severity={}, width={}cm, depth={}cm", detected, confidence, severity, width_cm, depth_cm)

    # Create report record
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
        width_cm=width_cm,
        depth_cm=depth_cm,
        area_sqm=area_sqm,
        road_type=road_type,
        weather=weather,
        priority_score=priority_score,
    )
    db.add(report)
    db.flush()  # get report.id

    # Save image as WebP
    try:
        img = Image.open(BytesIO(image_bytes))
        save_path = os.path.join(MEDIA_DIR, f"{report.id}.webp")
        img.save(save_path, "WEBP", quality=75)
        report.image_path = f"/media/uploads/{report.id}.webp"
    except Exception as e:
        logger.warning("Image save failed: {}", e)

    # Phase 8: cluster check
    report.alert_type = _cluster_check(report, db)

    db.commit()
    db.refresh(report)

    logger.info("Report {} saved, routed to: {}", report.id, dept.name)

    # Broadcast via WebSocket
    try:
        from app.api.ws_routes import broadcast_nearby_alert
        broadcast_nearby_alert(report, db)
    except Exception as e:
        logger.warning("WebSocket broadcast skipped: {}", e)

    # Manually build response since we already have dept
    resp = _report_to_dict(report)
    resp["department_name"] = dept.name
    return resp


# ═══════════════════════════════════════════════════════════════
# Phase 6: Get nearby reports (Issue #8: bounding-box pre-filter)
# ═══════════════════════════════════════════════════════════════
@router.get("/nearby", response_model=list[ReportResponse])
def get_nearby_reports(
    lat: float,
    lng: float,
    radius: int = 500,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    # Pre-filter by approximate bounding box
    lat_delta = radius / 111_000  # rough degrees
    lng_delta = radius / 85_000   # rough degrees at ~27°N

    candidates = (
        db.query(Report)
        .options(joinedload(Report.department))
        .filter(
            Report.status != "rejected",
            Report.latitude.between(lat - lat_delta, lat + lat_delta),
            Report.longitude.between(lng - lng_delta, lng + lng_delta),
        )
        .all()
    )

    nearby = []
    for r in candidates:
        dist = haversine_distance(lat, lng, r.latitude, r.longitude)
        if dist <= radius:
            nearby.append((dist, r))

    nearby.sort(key=lambda x: x[0])
    nearby = nearby[:limit]

    return [_report_to_dict(r) for _, r in nearby]


# ═══════════════════════════════════════════════════════════════
# Phase 6: Get report by ID
# ═══════════════════════════════════════════════════════════════
@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = (
        db.query(Report)
        .options(joinedload(Report.department))
        .filter(Report.id == report_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _report_to_dict(report)


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
        width_cm=f"{report.width_cm} cm" if report.width_cm is not None else "N/A",
        depth_cm=f"{report.depth_cm} cm" if report.depth_cm is not None else "N/A",
        area_sqm=f"{report.area_sqm} sqm" if report.area_sqm is not None else "N/A",
        road_type=report.road_type if report.road_type is not None else "N/A",
        weather=report.weather if report.weather is not None else "N/A",
    )


# ═══════════════════════════════════════════════════════════════
# Phase 7: Vote on a report (Issue #11: SQL-level increment)
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

    vote = Vote(report_id=report_id, user_id=current_user.id, action=body.action)
    db.add(vote)

    # Issue #11: Use SQL-level increment to avoid race condition
    if body.action == "like":
        report.like_count = Report.like_count + 1
    else:
        report.dislike_count = Report.dislike_count + 1

    db.flush()
    db.refresh(report)

    # Auto-verify if enough likes
    if (report.like_count or 0) >= VERIFY_LIKE_THRESHOLD and (report.dislike_count or 0) < (report.like_count or 0) / 2:
        if not report.verified:
            report.verified = True
            logger.info("Report {} VERIFIED", report_id)
            try:
                from app.api.ws_routes import broadcast_verified
                broadcast_verified(report)
            except Exception as e:
                logger.warning("broadcast_verified failed: {}", e)

    db.commit()
    db.refresh(report)

    return VoteResponse(
        like_count=report.like_count or 0,
        dislike_count=report.dislike_count or 0,
        verified=report.verified,
    )


# ═══════════════════════════════════════════════════════════════
# Phase 7: Add a comment (Issue #23: don't re-query current_user)
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

    return CommentResponse(
        id=comment.id,
        report_id=comment.report_id,
        user_id=comment.user_id,
        text=comment.text,
        created_at=comment.created_at,
        user=CommentUserResponse(id=current_user.id, name=current_user.name),
    )


# ═══════════════════════════════════════════════════════════════
# Phase 7: Get comments (Issue #9: fix N+1 with joinedload)
# ═══════════════════════════════════════════════════════════════
@router.get("/{report_id}/comments", response_model=list[CommentResponse])
def get_comments(report_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.report_id == report_id)
        .order_by(Comment.created_at.desc())
        .all()
    )
    return [
        CommentResponse(
            id=c.id,
            report_id=c.report_id,
            user_id=c.user_id,
            text=c.text,
            created_at=c.created_at,
            user=CommentUserResponse(id=c.user.id, name=c.user.name) if c.user else None,
        )
        for c in comments
    ]
