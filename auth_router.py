"""
Authentication router for SLA admin dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from auth import (
    authenticate_user, create_access_token, create_refresh_token, 
    verify_token, get_current_user, get_user_by_id
)
from models import User
from schemas import LoginRequest, LoginResponse, RefreshTokenRequest, UserOut

# Create auth router
auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.get("/test")
def test_endpoint():
    """Test endpoint to verify auth router is working"""
    return {"message": "Auth router is working", "status": "ok"}

@auth_router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
    request: Request = None
):
    """Authenticate user and return tokens."""
    import logging
    log = logging.getLogger("auth")
    
    # Normalize email
    email = login_data.email.strip().lower()
    log.info("🔐 Login attempt for %s", email)
    
    user = authenticate_user(db, email, login_data.password)
    if not user:
        log.info("❌ LOGIN_FAIL reason=user_not_found_or_bad_password email=%s", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        log.info("❌ LOGIN_FAIL reason=account_inactive email=%s", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ACCOUNT_INACTIVE",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    log.info("✅ LOGIN_SUCCESS email=%s role=%s", email, user.role)
    
    # Update last seen
    user.last_seen_at = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user)
    )

@auth_router.post("/refresh", response_model=LoginResponse)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    try:
        payload = verify_token(refresh_data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = get_user_by_id(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        access_token = create_access_token(data={"sub": user.id})
        new_refresh_token = create_refresh_token(data={"sub": user.id})
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            user=UserOut.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@auth_router.get("/me", response_model=UserOut)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user

@auth_router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should discard tokens)."""
    return {"message": "Successfully logged out"}
