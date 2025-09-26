"""
Pydantic schemas for SLA admin dashboard.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union, TypeVar, Generic
from datetime import datetime
from enum import Enum
from models import Role, DemoRequestStatus, QuoteStatus, JobType, JobStatus

# ==== BASE SCHEMAS ====

class PageParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(50, ge=1, le=100, description="Page size")
    sort: Optional[str] = Field(None, description="Sort field (prefix with - for desc)")

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    size: int
    pages: int

# ==== AUTH SCHEMAS ====

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# ==== USER SCHEMAS ====

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    role: Role = Role.support
    is_admin: bool = False
    is_active: bool = True
    org_id: Optional[int] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[Role] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    org_id: Optional[int] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    last_seen_at: Optional[datetime] = None
    two_fa_enabled: bool = False

    class Config:
        from_attributes = True

# ==== ORGANIZATION SCHEMAS ====

class OrganizationBase(BaseModel):
    name: str
    plan: str = "free"
    region: Optional[str] = None
    flags: Dict[str, Any] = {}

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    region: Optional[str] = None
    flags: Optional[Dict[str, Any]] = None

class OrganizationOut(OrganizationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==== DEMO REQUEST SCHEMAS ====

class DemoRequestBase(BaseModel):
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    company_name: Optional[str] = None
    note: Optional[str] = None
    status: DemoRequestStatus = DemoRequestStatus.new
    org_id: Optional[int] = None
    assignee_id: Optional[int] = None

class DemoRequestCreate(DemoRequestBase):
    pass

class DemoRequestUpdate(BaseModel):
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    company_name: Optional[str] = None
    note: Optional[str] = None
    status: Optional[DemoRequestStatus] = None
    assignee_id: Optional[int] = None

class DemoRequestOut(DemoRequestBase):
    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==== ENHANCED USER SCHEMA ====

class UserOutEnhanced(UserBase):
    id: int
    created_at: datetime
    last_seen_at: Optional[datetime] = None
    two_fa_enabled: bool = False
    organization: Optional[OrganizationOut] = None
    demo_requests: Optional[List[DemoRequestOut]] = None

    class Config:
        from_attributes = True

class UsersResponse(BaseModel):
    data: List[UserOutEnhanced]
    total: int
    page: int
    size: int
    pages: int

# ==== QUOTE SCHEMAS ====

class QuoteBase(BaseModel):
    sku: Optional[str] = None
    factory_id: Optional[int] = None
    qty: Optional[int] = None
    incoterm: Optional[str] = None
    est_unit_cost: Optional[float] = None
    margin: Optional[float] = None
    status: QuoteStatus = QuoteStatus.draft
    org_id: Optional[int] = None

class QuoteCreate(QuoteBase):
    pass

class QuoteUpdate(BaseModel):
    sku: Optional[str] = None
    factory_id: Optional[int] = None
    qty: Optional[int] = None
    incoterm: Optional[str] = None
    est_unit_cost: Optional[float] = None
    margin: Optional[float] = None
    status: Optional[QuoteStatus] = None

class QuoteOut(QuoteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==== FACTORY SCHEMAS ====

class FactoryBase(BaseModel):
    name: str
    country: Optional[str] = None
    city: Optional[str] = None
    certifications: List[str] = []
    moq: Optional[int] = None
    lead_time_days: Optional[int] = None
    rating: Optional[float] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None

class FactoryCreate(FactoryBase):
    pass

class FactoryUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    certifications: Optional[List[str]] = None
    moq: Optional[int] = None
    lead_time_days: Optional[int] = None
    rating: Optional[float] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None

class FactoryOut(FactoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==== JOB SCHEMAS ====

class JobBase(BaseModel):
    type: JobType
    payload: Dict[str, Any] = {}
    status: JobStatus = JobStatus.queued

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    status: Optional[JobStatus] = None
    error: Optional[str] = None

class JobOut(JobBase):
    id: int
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==== FEATURE FLAG SCHEMAS ====

class FeatureFlagBase(BaseModel):
    key: str
    description: Optional[str] = None
    enabled_global: bool = False
    enabled_orgs: List[int] = []

class FeatureFlagCreate(FeatureFlagBase):
    pass

class FeatureFlagUpdate(BaseModel):
    description: Optional[str] = None
    enabled_global: Optional[bool] = None
    enabled_orgs: Optional[List[int]] = None

class FeatureFlagOut(FeatureFlagBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==== AUDIT LOG SCHEMAS ====

class AuditLogOut(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    entity: str
    entity_id: str
    action: str
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    at: datetime

    class Config:
        from_attributes = True

# ==== WEBHOOK EVENT SCHEMAS ====

class WebhookEventBase(BaseModel):
    provider: str
    event_type: str
    payload: Dict[str, Any]
    status: str = "delivered"

class WebhookEventCreate(WebhookEventBase):
    pass

class WebhookEventOut(WebhookEventBase):
    id: int
    retry_count: int
    last_retry_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==== KPI SCHEMAS ====

class KPIData(BaseModel):
    signups_7d: int
    signups_30d: int
    active_dau: int
    active_mau: int
    demo_pending: int
    quotes_7d: int
    quotes_30d: int
    top_regions: List[Dict[str, Union[str, int]]]
    errors_7d: int
    signups_series: List[Dict[str, Union[str, int]]] = []
    quotes_series: List[Dict[str, Union[str, int]]] = []

# ==== IMPERSONATION SCHEMAS ====

class ImpersonateRequest(BaseModel):
    user_id: int

class ImpersonateResponse(BaseModel):
    impersonation_token: str
    impersonated_user: UserOut
    expires_at: datetime

# ==== FILTER SCHEMAS ====

class UserFilters(BaseModel):
    q: Optional[str] = None
    role: Optional[Role] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    org_id: Optional[int] = None

class DemoRequestFilters(BaseModel):
    q: Optional[str] = None
    status: Optional[DemoRequestStatus] = None
    org_id: Optional[int] = None
    assignee_id: Optional[int] = None

class QuoteFilters(BaseModel):
    q: Optional[str] = None
    status: Optional[QuoteStatus] = None
    org_id: Optional[int] = None
    factory_id: Optional[int] = None

class FactoryFilters(BaseModel):
    q: Optional[str] = None
    country: Optional[str] = None
    min_rating: Optional[float] = None

class JobFilters(BaseModel):
    type: Optional[JobType] = None
    status: Optional[JobStatus] = None

class AuditLogFilters(BaseModel):
    entity: Optional[str] = None
    action: Optional[str] = None
    actor_user_id: Optional[int] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None

class WebhookEventFilters(BaseModel):
    provider: Optional[str] = None
    event_type: Optional[str] = None
    status: Optional[str] = None

# ==== ALGO OUTPUT SCHEMAS ====

class RequestType(str, Enum):
    sourcing = "sourcing"
    quoting = "quoting"
    shipping = "shipping"

class AlgoOutputCreate(BaseModel):
    user_id: str
    tenant_id: Optional[str] = None
    request_type: RequestType
    request_id: Optional[str] = None
    model: Optional[str] = None
    model_version: Optional[str] = None
    num_matches_ge_80: int = 0
    total_matches: Optional[int] = None
    top_match_score: Optional[float] = None
    top_matches: Optional[List[Dict[str, Any]]] = None  # list[{"id": str|None, "name": str|None, "score": float}]
    latency_ms: Optional[int] = None
    status: Optional[str] = "success"
    error_message: Optional[str] = None
    input_payload: Optional[Dict[str, Any]] = None
    output_summary: Optional[str] = None
    reasoning: Optional[Dict[str, Any]] = None

class AlgoOutputRead(AlgoOutputCreate):
    id: str
    created_at: datetime

class AlgoOutputList(BaseModel):
    items: List[AlgoOutputRead]
    total: int
    page: int
    page_size: int

# Update forward references
LoginResponse.model_rebuild()
