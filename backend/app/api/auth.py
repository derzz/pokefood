import logging
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.db.session import get_db
from models.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
logger = logging.getLogger(__name__)
ALLOW_DEV_LOGIN = os.getenv("ALLOW_DEV_LOGIN", "true").lower() == "true"
DEFAULT_DEV_LOGIN_EMAIL = os.getenv("DEV_LOGIN_EMAIL", "demo@pokefood.local")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserResponse:
    logger.info("auth.register called", extra={"email": payload.email})
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, email=user.email)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    logger.info("auth.login called", extra={"email": payload.email})
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(user_id=user.id)
    return TokenResponse(access_token=token)


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(email: str | None = None, db: Session = Depends(get_db)) -> TokenResponse:
    """Temporary bypass endpoint for local development.

    Enabled by default for hackathon speed; disable in production by setting
    ALLOW_DEV_LOGIN=false.
    """
    if not ALLOW_DEV_LOGIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="dev-login is disabled")

    resolved_email = (email or DEFAULT_DEV_LOGIN_EMAIL).strip().lower()
    logger.info("auth.dev_login called", extra={"email": resolved_email})

    user = db.scalar(select(User).where(User.email == resolved_email))
    if user is None:
        user = User(
            email=resolved_email,
            password_hash=hash_password(secrets.token_urlsafe(24)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("auth.dev_login created user", extra={"email": resolved_email, "user_id": user.id})

    token = create_access_token(user_id=user.id)
    return TokenResponse(access_token=token)

