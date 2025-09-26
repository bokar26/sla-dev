"""
Admin API routers for SLA dashboard.
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
from schemas import (
    UserOut, UserOutEnhanced, UsersResponse, UserCreate, UserUpdate, OrganizationOut, OrganizationCreate, OrganizationUpdate,
    DemoRequestOut, DemoRequestCreate, DemoRequestUpdate, QuoteOut, QuoteCreate, QuoteUpdate,
    FactoryOut, FactoryCreate, FactoryUpdate, JobOut, JobCreate, JobUpdate,
    FeatureFlagOut, FeatureFlagCreate, FeatureFlagUpdate, AuditLogOut, WebhookEventOut,
    KPIData, ImpersonateRequest, ImpersonateResponse, PaginatedResponse,
    UserFilters, DemoRequestFilters, QuoteFilters, FactoryFilters, JobFilters,
    AuditLogFilters, WebhookEventFilters
)

# Create admin router
admin_router = APIRouter(prefix="/admin", tags=["admin"])

# ==== UTILITY FUNCTIONS ====

def apply_pagination_and_sort(query, page: int, size: int, sort: Optional[str] = None):
    """Apply pagination and sorting to a query."""
    # Apply sorting
    if sort:
        field = sort.lstrip("-")
        if hasattr(query.column_descriptions[0]['entity'], field):
            col = getattr(query.column_descriptions[0]['entity'], field)
            if sort.startswith("-"):
                query = query.order_by(desc(col))
            else:
                query = query.order_by(asc(col))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    
    return items, total

def create_paginated_response(items, total: int, page: int, size: int):
    """Create a paginated response."""
    pages = (total + size - 1) // size
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

# ==== KPI ENDPOINTS ====

@admin_router.get("/kpis", response_model=KPIData, dependencies=[Depends(require_admin)])
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
    
    return KPIData(
        signups_7d=signups_7d,
        signups_30d=signups_30d,
        active_dau=active_dau,
        active_mau=active_mau,
        demo_pending=demo_pending,
        quotes_7d=quotes_7d,
        quotes_30d=quotes_30d,
        top_regions=top_regions_data,
        errors_7d=errors_7d,
        signups_series=signups_series,
        quotes_series=quotes_series
    )

# ==== USER ENDPOINTS ====

@admin_router.get("/users", response_model=UsersResponse, dependencies=[Depends(require_admin)])
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
    """List users with filtering and pagination, including demo requests and organization data."""
    from sqlalchemy.orm import joinedload
    
    query = db.query(User).options(
        joinedload(User.organization),
        joinedload(User.demo_requests)
    )
    
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
    
    # Apply pagination and sorting
    items, total = apply_pagination_and_sort(query, page, size, sort)
    
    # Debug: Check if items have the expected relationships
    if items:
        first_item = items[0]
        print(f"DEBUG: First item type: {type(first_item)}")
        print(f"DEBUG: First item has organization: {hasattr(first_item, 'organization')}")
        print(f"DEBUG: First item has demo_requests: {hasattr(first_item, 'demo_requests')}")
        if hasattr(first_item, 'demo_requests'):
            print(f"DEBUG: Demo requests count: {len(first_item.demo_requests) if first_item.demo_requests else 0}")
    
    # Create the response with the enhanced schema
    pages = (total + size - 1) // size
    return UsersResponse(
        data=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@admin_router.get("/users/{user_id}", response_model=UserOut, dependencies=[Depends(require_admin)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@admin_router.post("/users", response_model=UserOut, dependencies=[Depends(require_roles(Role.superadmin))])
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Create a new user."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create user
    from auth import get_password_hash
    hashed_password = get_password_hash(user_data.password)
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role=user_data.role,
        is_admin=user_data.is_admin,
        is_active=user_data.is_active,
        org_id=user_data.org_id
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log audit event
    log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        entity="user",
        entity_id=str(user.id),
        action="create",
        after=user_data.dict(),
        request=request
    )
    
    return user

@admin_router.put("/users/{user_id}", response_model=UserOut, dependencies=[Depends(require_admin)])
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Update a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Store before state for audit
    before_data = {
        "email": user.email,
        "name": user.name,
        "role": user.role.value,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "org_id": user.org_id
    }
    
    # Update fields
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    # Log audit event
    log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        entity="user",
        entity_id=str(user.id),
        action="update",
        before=before_data,
        after=update_data,
        request=request
    )
    
    return user

@admin_router.delete("/users/{user_id}", dependencies=[Depends(require_roles(Role.superadmin))])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Delete a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Store before state for audit
    before_data = {
        "email": user.email,
        "name": user.name,
        "role": user.role.value,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "org_id": user.org_id
    }
    
    db.delete(user)
    db.commit()
    
    # Log audit event
    log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        entity="user",
        entity_id=str(user_id),
        action="delete",
        before=before_data,
        request=request
    )
    
    return {"message": "User deleted successfully"}

# ==== DEMO REQUEST ENDPOINTS ====

@admin_router.get("/demo-requests", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_demo_requests(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    status: Optional[DemoRequestStatus] = Query(None),
    org_id: Optional[int] = Query(None),
    assignee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """List demo requests with filtering and pagination."""
    query = db.query(DemoRequest)
    
    # Apply filters
    if q:
        q_like = f"%{q}%"
        query = query.filter(
            or_(
                DemoRequest.contact_name.ilike(q_like),
                DemoRequest.contact_email.ilike(q_like),
                DemoRequest.company_name.ilike(q_like)
            )
        )
    
    if status:
        query = query.filter(DemoRequest.status == status)
    
    if org_id:
        query = query.filter(DemoRequest.org_id == org_id)
    
    if assignee_id:
        query = query.filter(DemoRequest.assignee_id == assignee_id)
    
    # Apply pagination and sorting
    items, total = apply_pagination_and_sort(query, page, size, sort)
    
    return create_paginated_response(items, total, page, size)

@admin_router.put("/demo-requests/{request_id}", response_model=DemoRequestOut, dependencies=[Depends(require_admin)])
def update_demo_request(
    request_id: int,
    request_data: DemoRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Update a demo request."""
    demo_request = db.query(DemoRequest).filter(DemoRequest.id == request_id).first()
    if not demo_request:
        raise HTTPException(status_code=404, detail="Demo request not found")
    
    # Store before state for audit
    before_data = {
        "contact_name": demo_request.contact_name,
        "contact_email": demo_request.contact_email,
        "contact_phone": demo_request.contact_phone,
        "company_name": demo_request.company_name,
        "note": demo_request.note,
        "status": demo_request.status.value,
        "assignee_id": demo_request.assignee_id
    }
    
    # Update fields
    update_data = request_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(demo_request, field, value)
    
    # Set resolved_at if status is done
    if request_data.status == DemoRequestStatus.done and demo_request.status != DemoRequestStatus.done:
        demo_request.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(demo_request)
    
    # Log audit event
    log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        entity="demo_request",
        entity_id=str(demo_request.id),
        action="update",
        before=before_data,
        after=update_data,
        request=request
    )
    
    return demo_request

# ==== QUOTE ENDPOINTS ====

@admin_router.get("/quotes", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_quotes(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    status: Optional[QuoteStatus] = Query(None),
    org_id: Optional[int] = Query(None),
    factory_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """List quotes with filtering and pagination."""
    query = db.query(Quote)
    
    # Apply filters
    if q:
        q_like = f"%{q}%"
        query = query.filter(Quote.sku.ilike(q_like))
    
    if status:
        query = query.filter(Quote.status == status)
    
    if org_id:
        query = query.filter(Quote.org_id == org_id)
    
    if factory_id:
        query = query.filter(Quote.factory_id == factory_id)
    
    # Apply pagination and sorting
    items, total = apply_pagination_and_sort(query, page, size, sort)
    
    return create_paginated_response(items, total, page, size)

# ==== FACTORY ENDPOINTS ====

@admin_router.get("/factories", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_factories(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """List factories with filtering and pagination."""
    query = db.query(Factory)
    
    # Apply filters
    if q:
        q_like = f"%{q}%"
        query = query.filter(
            or_(
                Factory.name.ilike(q_like),
                Factory.country.ilike(q_like),
                Factory.city.ilike(q_like)
            )
        )
    
    if country:
        query = query.filter(Factory.country == country)
    
    if min_rating:
        query = query.filter(Factory.rating >= min_rating)
    
    # Apply pagination and sorting
    items, total = apply_pagination_and_sort(query, page, size, sort)
    
    return create_paginated_response(items, total, page, size)

# ==== JOB ENDPOINTS ====

@admin_router.get("/jobs", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_jobs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query(None),
    type: Optional[JobType] = Query(None),
    status: Optional[JobStatus] = Query(None),
    db: Session = Depends(get_db)
):
    """List jobs with filtering and pagination."""
    query = db.query(Job)
    
    # Apply filters
    if type:
        query = query.filter(Job.type == type)
    
    if status:
        query = query.filter(Job.status == status)
    
    # Apply pagination and sorting
    items, total = apply_pagination_and_sort(query, page, size, sort)
    
    return create_paginated_response(items, total, page, size)

# ==== FEATURE FLAG ENDPOINTS ====

@admin_router.get("/feature-flags", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_feature_flags(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List feature flags."""
    query = db.query(FeatureFlag)
    items, total = apply_pagination_and_sort(query, page, size, sort)
    return create_paginated_response(items, total, page, size)

@admin_router.put("/feature-flags/{flag_id}", response_model=FeatureFlagOut, dependencies=[Depends(require_roles(Role.superadmin))])
def update_feature_flag(
    flag_id: int,
    flag_data: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Update a feature flag."""
    flag = db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    # Store before state for audit
    before_data = {
        "key": flag.key,
        "description": flag.description,
        "enabled_global": flag.enabled_global,
        "enabled_orgs": flag.enabled_orgs
    }
    
    # Update fields
    update_data = flag_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(flag, field, value)
    
    db.commit()
    db.refresh(flag)
    
    # Log audit event
    log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        entity="feature_flag",
        entity_id=str(flag.id),
        action="update",
        before=before_data,
        after=update_data,
        request=request
    )
    
    return flag

# ==== AUDIT LOG ENDPOINTS ====

@admin_router.get("/audit-logs", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query(None),
    entity: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    actor_user_id: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """List audit logs with filtering and pagination."""
    query = db.query(AuditLog)
    
    # Apply filters
    if entity:
        query = query.filter(AuditLog.entity == entity)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if actor_user_id:
        query = query.filter(AuditLog.actor_user_id == actor_user_id)
    
    if from_date:
        query = query.filter(AuditLog.at >= from_date)
    
    if to_date:
        query = query.filter(AuditLog.at <= to_date)
    
    # Apply pagination and sorting
    items, total = apply_pagination_and_sort(query, page, size, sort)
    
    return create_paginated_response(items, total, page, size)

# ==== WEBHOOK EVENT ENDPOINTS ====

@admin_router.get("/webhooks", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_webhook_events(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List webhook events with filtering and pagination."""
    query = db.query(WebhookEvent)
    
    # Apply filters
    if provider:
        query = query.filter(WebhookEvent.provider == provider)
    
    if event_type:
        query = query.filter(WebhookEvent.event_type == event_type)
    
    if status:
        query = query.filter(WebhookEvent.status == status)
    
    # Apply pagination and sorting
    items, total = apply_pagination_and_sort(query, page, size, sort)
    
    return create_paginated_response(items, total, page, size)

@admin_router.post("/webhooks/{event_id}/retry", dependencies=[Depends(require_admin)])
def retry_webhook_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Retry a failed webhook event."""
    event = db.query(WebhookEvent).filter(WebhookEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Webhook event not found")
    
    # Reset retry count and status
    event.retry_count = 0
    event.status = "queued"
    event.last_retry_at = datetime.utcnow()
    
    db.commit()
    
    # Log audit event
    log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        entity="webhook_event",
        entity_id=str(event.id),
        action="retry",
        request=request
    )
    
    return {"message": "Webhook event queued for retry"}

# ==== IMPERSONATION ENDPOINTS ====

@admin_router.post("/users/{user_id}/impersonate", response_model=ImpersonateResponse, dependencies=[Depends(require_roles(Role.superadmin))])
def impersonate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Start impersonating a user (read-only)."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not target_user.is_active:
        raise HTTPException(status_code=400, detail="Cannot impersonate inactive user")
    
    # Create impersonation token
    from auth import create_access_token
    from datetime import timedelta
    
    impersonation_data = {
        "sub": current_user.id,
        "impersonated_user_id": target_user.id,
        "scope": "impersonation"
    }
    
    impersonation_token = create_access_token(
        impersonation_data, 
        expires_delta=timedelta(minutes=15)
    )
    
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Log audit event
    log_audit_event(
        db=db,
        actor_user_id=current_user.id,
        entity="user",
        entity_id=str(target_user.id),
        action="impersonate_start",
        after={"impersonated_user_id": target_user.id, "expires_at": expires_at.isoformat()},
        request=request
    )
    
    return ImpersonateResponse(
        impersonation_token=impersonation_token,
        impersonated_user=target_user,
        expires_at=expires_at
    )
