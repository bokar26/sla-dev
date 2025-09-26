"""
Simple admin API routers for SLA dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from typing import Optional, List
from datetime import datetime, timedelta
import json

from database import get_db
from auth import get_current_user, require_admin, require_roles, log_audit_event
from models import (
    User, Organization, DemoRequest, Quote, Factory, Job, FeatureFlag, 
    AuditLog, WebhookEvent, Role, DemoRequestStatus, QuoteStatus, 
    JobType, JobStatus
)

# Create admin router
admin_router = APIRouter(prefix="/admin", tags=["admin"])

# ==== KPI ENDPOINTS ====

@admin_router.get("/kpis", dependencies=[Depends(require_admin)])
def get_kpis(db: Session = Depends(get_db)):
    """Get KPI data for the admin dashboard."""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Signups
    signups_7d = db.query(User).filter(User.created_at >= week_ago).count()
    signups_30d = db.query(User).filter(User.created_at >= month_ago).count()
    
    # Active users (simplified - using last_seen_at)
    active_dau = db.query(User).filter(
        User.last_seen_at >= now - timedelta(days=1)
    ).count()
    active_mau = db.query(User).filter(
        User.last_seen_at >= month_ago
    ).count()
    
    # Demo requests
    demo_pending = db.query(DemoRequest).filter(
        DemoRequest.status == DemoRequestStatus.new
    ).count()
    
    # Quotes
    quotes_7d = db.query(Quote).filter(Quote.created_at >= week_ago).count()
    quotes_30d = db.query(Quote).filter(Quote.created_at >= month_ago).count()
    
    # Top regions (from organizations)
    top_regions = db.query(
        Organization.region,
        func.count(Organization.id).label('count')
    ).filter(
        Organization.region.isnot(None)
    ).group_by(Organization.region).order_by(desc('count')).limit(5).all()
    
    top_regions_data = [{"region": r.region, "count": r.count} for r in top_regions]
    
    # Errors (placeholder - would integrate with actual error tracking)
    errors_7d = 0
    
    # Time series data (simplified)
    signups_series = []
    quotes_series = []
    
    # Generate last 7 days data
    for i in range(7):
        date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(date, datetime.min.time())
        day_end = datetime.combine(date, datetime.max.time())
        
        signup_count = db.query(User).filter(
            and_(User.created_at >= day_start, User.created_at <= day_end)
        ).count()
        
        quote_count = db.query(Quote).filter(
            and_(Quote.created_at >= day_start, Quote.created_at <= day_end)
        ).count()
        
        signups_series.append({"date": date.isoformat(), "count": signup_count})
        quotes_series.append({"date": date.isoformat(), "count": quote_count})
    
    return {
        "signups_7d": signups_7d,
        "signups_30d": signups_30d,
        "active_dau": active_dau,
        "active_mau": active_mau,
        "demo_pending": demo_pending,
        "quotes_7d": quotes_7d,
        "quotes_30d": quotes_30d,
        "top_regions": top_regions_data,
        "errors_7d": errors_7d,
        "signups_series": signups_series,
        "quotes_series": quotes_series
    }

# ==== USER ENDPOINTS ====

@admin_router.get("/users", dependencies=[Depends(require_admin)])
def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    role: Optional[Role] = Query(None),
    is_admin: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    org_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """List users with filtering and pagination."""
    query = db.query(User)
    
    # Apply filters
    if q:
        q_like = f"%{q}%"
        query = query.filter(
            or_(
                User.email.ilike(q_like),
                User.name.ilike(q_like)
            )
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if org_id:
        query = query.filter(User.org_id == org_id)
    
    # Apply sorting
    if sort:
        field = sort.lstrip("-")
        if hasattr(User, field):
            col = getattr(User, field)
            if sort.startswith("-"):
                query = query.order_by(desc(col))
            else:
                query = query.order_by(asc(col))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    
    # Convert to dict format
    users_data = []
    for user in items:
        user_dict = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "org_id": user.org_id,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_seen_at": user.last_seen_at.isoformat() if user.last_seen_at else None,
            "two_fa_enabled": user.two_fa_enabled
        }
        users_data.append(user_dict)
    
    pages = (total + size - 1) // size
    
    return {
        "data": users_data,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }
