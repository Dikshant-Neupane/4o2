from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import bcrypt
import uuid
from datetime import datetime

from app.api.deps import get_db
from app.services.auth_service import (
    create_access_token,
    get_user_by_token
)
from app.models.user import User
from loguru import logger

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# ── Constants ──────────────────────────────────────────────────
MIN_PASSWORD_LENGTH = 8

# ── Schemas ─────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    role: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ── Helpers ─────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def user_to_response(user: User) -> dict:
    return {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "role": user.role,
    }

# ── Endpoints ───────────────────────────────────────────────────
@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    logger.info("Register request for: {}", body.email)

    # Issue #4: Password strength validation
    if len(body.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        )

    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    if not body.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=body.email.strip().lower(),
        name=body.name.strip(),
        password_hash=hash_password(body.password),
        role="CITIZEN",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id, user.email)
    logger.info("Registered user: {}", user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_to_response(user),
    }


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    logger.info("Login request for: {}", body.email)

    user = db.query(User).filter(User.email == body.email.strip().lower()).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not check_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user.id, user.email)
    logger.info("Login success: {}", user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_to_response(user),
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    try:
        user = get_user_by_token(db, authorization)
        return user_to_response(user)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout():
    # Note: JWT is stateless — true logout requires token blacklisting (see Issue #6)
    return {"message": "Logged out successfully"}
