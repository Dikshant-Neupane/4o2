"""
Authentication service — JWT token creation, verification, and user lookup.
"""

from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User


def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token for the given user."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
        "iat": now,
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token


def verify_access_token(token: str) -> dict:
    """Verify and decode a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid or expired token: {e}")


def get_user_by_token(db: Session, authorization: str) -> User:
    """Extract and verify token from Authorization header, return the User."""
    if not authorization or not authorization.startswith("Bearer "):
        raise ValueError("No authorization token")
    token = authorization.replace("Bearer ", "")
    payload = verify_access_token(token)
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise ValueError("User not found")
    return user
