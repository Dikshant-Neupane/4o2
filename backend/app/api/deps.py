from typing import Generator, Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.auth_service import get_user_by_token
from app.models.user import User


def get_db() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy session, ensuring proper cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )
    try:
        return get_user_by_token(db, authorization)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

def get_optional_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Same as get_current_user but returns None instead of 401."""
    if not authorization:
        return None
    try:
        return get_user_by_token(db, authorization)
    except ValueError:
        return None
