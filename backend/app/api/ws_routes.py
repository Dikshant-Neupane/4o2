"""
WebSocket server for real-time notifications.

Phase 9 — broadcasts alerts to connected clients.
"""

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger
from sqlalchemy.orm import Session

from app.utils.geo_utils import haversine_distance

router = APIRouter(tags=["WebSocket"])

# ── Active connections: user_id → WebSocket ─────────────────────
active_connections: dict[str, WebSocket] = {}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Issue #2: Validate JWT token before accepting WebSocket connection."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing auth token")
        return

    try:
        from app.services.auth_service import verify_access_token
        payload = verify_access_token(token)
        if payload.get("sub") != user_id:
            await websocket.close(code=4003, reason="User ID mismatch")
            return
    except Exception:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    await websocket.accept()
    active_connections[user_id] = websocket
    logger.info("WebSocket connected: user {}", user_id)

    try:
        while True:
            data = await websocket.receive_text()
            logger.debug("WS message from user {}: {}", user_id, data)
    except WebSocketDisconnect:
        active_connections.pop(user_id, None)
        logger.info("WebSocket disconnected: user {}", user_id)


# ── Broadcast helpers (called from report_routes.py) ────────────
def broadcast_nearby_alert(report, db: Session) -> None:
    """After a report is saved, notify connected users."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        return

    msg = json.dumps({
        "type": "NEARBY_ALERT",
        "report_id": report.id,
        "severity": report.ai_severity,
        "message": f"New {report.ai_severity or 'unknown'}-severity issue reported nearby!",
    })

    count = 0
    for uid, ws in list(active_connections.items()):
        if uid == report.user_id:
            continue
        try:
            loop.create_task(ws.send_text(msg))
            count += 1
        except Exception:
            active_connections.pop(uid, None)

    if count:
        logger.info("Broadcasting NEARBY_ALERT to {} connected users", count)


def broadcast_verified(report) -> None:
    """Notify the report owner when their report gets verified."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        return

    ws = active_connections.get(report.user_id)
    if ws:
        msg = json.dumps({
            "type": "REPORT_VERIFIED",
            "report_id": report.id,
            "message": f"Your report #{report.id} has been verified by the community!",
        })
        try:
            loop.create_task(ws.send_text(msg))
            logger.info("REPORT_VERIFIED sent to user {}", report.user_id)
        except Exception:
            active_connections.pop(report.user_id, None)


def broadcast_cluster_alert(lat: float, lng: float, cluster_count: int) -> None:
    """Broadcast a cluster alert to all connected users."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        return

    msg = json.dumps({
        "type": "CLUSTER_ALERT",
        "cluster_count": cluster_count,
        "lat": lat,
        "lng": lng,
        "message": f"🚨 {cluster_count} reports detected within 500m — possible reconstruction zone!",
    })

    count = 0
    for uid, ws in list(active_connections.items()):
        try:
            loop.create_task(ws.send_text(msg))
            count += 1
        except Exception:
            active_connections.pop(uid, None)

    if count:
        logger.info("Broadcasting CLUSTER_ALERT — {} reports in area", cluster_count)
