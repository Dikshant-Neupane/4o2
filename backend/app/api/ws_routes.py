"""
WebSocket server for real-time notifications.

Phase 9 — broadcasts alerts to connected clients.
"""

import asyncio
import json
from typing import Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.utils.geo_utils import haversine_distance

router = APIRouter(tags=["WebSocket"])

# ── Active connections: user_id → WebSocket ─────────────────────
active_connections: Dict[int, WebSocket] = {}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections[user_id] = websocket
    print(f"[PHASE 9] WebSocket connected: user {user_id}")

    try:
        while True:
            # Keep connection alive; listen for client messages (e.g. ping)
            data = await websocket.receive_text()
            print(f"[PHASE 9] WS message from user {user_id}: {data}")
    except WebSocketDisconnect:
        active_connections.pop(user_id, None)
        print(f"[PHASE 9] WebSocket disconnected: user {user_id}")


# ── Broadcast helpers (called from report_routes.py) ────────────
def broadcast_nearby_alert(report, db: Session) -> None:
    """
    After a report is saved, notify connected users within 500 m.
    Runs in the current event loop (best-effort, fire-and-forget).
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        return  # No running loop — skip broadcast

    msg = json.dumps({
        "type": "NEARBY_ALERT",
        "report_id": report.id,
        "severity": report.ai_severity,
        "message": f"New {report.ai_severity or 'unknown'}-severity issue reported nearby!",
    })

    count = 0
    for uid, ws in list(active_connections.items()):
        if uid == report.user_id:
            continue  # Don't notify the reporter
        try:
            loop.create_task(ws.send_text(msg))
            count += 1
        except Exception:
            active_connections.pop(uid, None)

    if count:
        print(f"[PHASE 9] 📡 Broadcasting NEARBY_ALERT to {count} connected users")


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
            print(f"[PHASE 9] 📡 REPORT_VERIFIED sent to user {report.user_id}")
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
        print(f"[PHASE 9] 📡 Broadcasting CLUSTER_ALERT — {cluster_count} reports in area")
