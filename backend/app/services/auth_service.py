from datetime import datetime, timedelta
import uuid
from typing import Optional, dict

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User

def verify_google_token(credential: str) -> dict:
    print(f"[AUTH] Verifying Google token...")
    try:
        # Note: In a real environment, you'd use settings.google_client_id
        # For now, we allow verification to proceed if ID is provided
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id
        )
        print(f"[AUTH] ✅ Google token valid for: {idinfo.get('email')}")
        return {
            "google_id": idinfo["sub"],
            "email": idinfo["email"],
            "name": idinfo.get("name", ""),
            "avatar_url": idinfo.get("picture", ""),
            "email_verified": idinfo.get("email_verified", False)
        }
    except ValueError as e:
        print(f"[AUTH] ❌ Invalid Google token: {e}")
        raise ValueError(f"Invalid Google token: {e}")

def get_or_create_user(db: Session, google_data: dict) -> User:
    user = db.query(User).filter(
        User.google_id == google_data["google_id"]
    ).first()

    if user:
        user.name = google_data["name"]
        user.avatar_url = google_data["avatar_url"]
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        print(f"[AUTH] ✅ Existing user logged in: {user.email}")
    else:
        user = User(
            id=str(uuid.uuid4()),
            google_id=google_data["google_id"],
            email=google_data["email"],
            name=google_data["name"],
            avatar_url=google_data["avatar_url"],
            role="CITIZEN",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[AUTH] ✅ New user created: {user.email}")

    return user

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(
            minutes=settings.jwt_expire_minutes
        ),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    print(f"[AUTH] ✅ JWT created for user: {email}")
    return token

def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        print(f"[AUTH] ❌ JWT verification failed: {e}")
        raise ValueError("Invalid or expired token")

def get_user_by_token(db: Session, authorization: str) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise ValueError("No authorization token")
    token = authorization.replace("Bearer ", "")
    payload = verify_access_token(token)
    user = db.query(User).filter(
        User.id == payload["sub"]
    ).first()
    if not user:
        raise ValueError("User not found")
    return user
