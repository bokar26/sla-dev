from sqlalchemy import Column, String, DateTime, Text, Numeric, Boolean, Enum, ForeignKey, Index, JSON, LargeBinary, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()

class ProviderEnum(enum.Enum):
    ALIBABA = "alibaba"
    WHATSAPP = "whatsapp"
    STRIPE = "stripe"

class SyncKindEnum(enum.Enum):
    ORDERS = "ORDERS"
    SHIPMENTS = "SHIPMENTS"
    SUPPLIERS = "SUPPLIERS"
    FULL = "FULL"
    CSV_ORDERS = "CSV_ORDERS"
    CSV_SHIPMENTS = "CSV_SHIPMENTS"
    CSV_SUPPLIERS = "CSV_SUPPLIERS"
    EMAIL_ORDERS = "EMAIL_ORDERS"

class SyncStatusEnum(enum.Enum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"
    PARTIAL = "PARTIAL"

class IntegrationCredential(Base):
    __tablename__ = "integration_credentials"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    provider = Column(Enum(ProviderEnum), nullable=False)
    access_token = Column(Text, nullable=False)  # Encrypted
    refresh_token = Column(Text, nullable=True)  # Encrypted
    expires_at = Column(DateTime(timezone=True), nullable=True)
    scope = Column(Text, nullable=True)
    connected_at = Column(DateTime(timezone=True), default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        Index('idx_user_provider', 'user_id', 'provider', unique=True),
    )

class AlibabaOrder(Base):
    __tablename__ = "alibaba_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    alibaba_order_id = Column(String(255), nullable=False)
    status = Column(String(100), nullable=False)
    buyer_company = Column(String(255), nullable=True)
    supplier_company = Column(String(255), nullable=True)
    currency = Column(String(10), nullable=True)
    total_amount = Column(Numeric(15, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    fulfillment_state = Column(String(100), nullable=True)
    
    __table_args__ = (
        Index('idx_user_alibaba_order', 'user_id', 'alibaba_order_id', unique=True),
    )

class AlibabaShipment(Base):
    __tablename__ = "alibaba_shipments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    alibaba_order_id = Column(String(255), nullable=False, index=True)
    tracking_no = Column(String(255), nullable=False, index=True)
    carrier = Column(String(255), nullable=True)
    status = Column(String(100), nullable=False)
    last_event_at = Column(DateTime(timezone=True), nullable=True)
    eta = Column(DateTime(timezone=True), nullable=True)
    raw = Column(JSON, nullable=True)
    
    __table_args__ = (
        Index('idx_user_tracking', 'user_id', 'tracking_no', unique=True),
    )

class AlibabaSupplier(Base):
    __tablename__ = "alibaba_suppliers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    alibaba_supplier_id = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    rating = Column(Numeric(3, 2), nullable=True)
    raw = Column(JSON, nullable=True)
    
    __table_args__ = (
        Index('idx_user_supplier', 'user_id', 'alibaba_supplier_id', unique=True),
    )

class IntegrationProviderConfig(Base):
    __tablename__ = "integration_provider_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    provider = Column(Enum(ProviderEnum), nullable=False)
    # Encrypted fields
    client_id = Column(LargeBinary, nullable=True)
    client_secret = Column(LargeBinary, nullable=True)
    auth_url = Column(String(500), nullable=True)
    token_url = Column(String(500), nullable=True)
    api_base = Column(String(500), nullable=True)
    redirect_uri = Column(String(500), nullable=True)
    scopes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    # flags
    is_byoa_enabled = Column(Boolean, default=False)
    
    __table_args__ = (
        Index('idx_user_provider_config', 'user_id', 'provider', unique=True),
    )

class SyncLog(Base):
    __tablename__ = "sync_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    provider = Column(Enum(ProviderEnum), nullable=False)
    kind = Column(Enum(SyncKindEnum), nullable=False)
    started_at = Column(DateTime(timezone=True), default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(SyncStatusEnum), nullable=False)
    message = Column(Text, nullable=True)
    stats = Column(JSON, nullable=True)
    
    __table_args__ = (
        Index('idx_user_provider_kind', 'user_id', 'provider', 'kind'),
    )

# ==== ADMIN MODELS ====

class Role(str, enum.Enum):
    superadmin = "superadmin"
    analyst = "analyst"
    support = "support"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    role = Column(Enum(Role), default=Role.support, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    two_fa_enabled = Column(Boolean, default=False, nullable=False)
    two_fa_secret = Column(String(255), nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    demo_requests = relationship("DemoRequest", back_populates="assignee")
    audit_logs = relationship("AuditLog", back_populates="actor_user")

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    plan = Column(String(100), default="free", nullable=False)
    region = Column(String(100), nullable=True)
    flags = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="organization")
    demo_requests = relationship("DemoRequest", back_populates="organization")
    quotes = relationship("Quote", back_populates="organization")

class DemoRequestStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    scheduled = "scheduled"
    done = "done"

class DemoRequest(Base):
    __tablename__ = "demo_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), index=True, nullable=True)
    contact_phone = Column(String(50), nullable=True)
    company_name = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)
    status = Column(Enum(DemoRequestStatus), default=DemoRequestStatus.new, index=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="demo_requests")
    assignee = relationship("User", back_populates="demo_requests")

class QuoteStatus(str, enum.Enum):
    draft = "draft"
    calculated = "calculated"
    sent = "sent"
    accepted = "accepted"
    rejected = "rejected"

class Quote(Base):
    __tablename__ = "quotes"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    sku = Column(String(255), nullable=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=True)
    qty = Column(Integer, nullable=True)
    incoterm = Column(String(50), nullable=True)
    est_unit_cost = Column(Float, nullable=True)
    margin = Column(Float, nullable=True)
    status = Column(Enum(QuoteStatus), default=QuoteStatus.draft, index=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="quotes")
    factory = relationship("Factory", back_populates="quotes")

class Factory(Base):
    __tablename__ = "factories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    country = Column(String(100), index=True, nullable=True)
    city = Column(String(100), nullable=True)
    certifications = Column(JSON, default=list, nullable=False)
    moq = Column(Integer, nullable=True)
    lead_time_days = Column(Integer, nullable=True)
    rating = Column(Float, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships
    quotes = relationship("Quote", back_populates="factory")

class JobType(str, enum.Enum):
    index = "index"
    quote_calc = "quote_calc"
    webhook = "webhook"
    sync = "sync"

class JobStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    success = "success"
    failed = "failed"

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(JobType), index=True, nullable=False)
    payload = Column(JSON, default=dict, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.queued, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    __table_args__ = (
        Index('idx_job_type_status', 'type', 'status'),
    )

class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    enabled_global = Column(Boolean, default=False, nullable=False)
    enabled_orgs = Column(JSON, default=list, nullable=False)  # List of org IDs
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entity = Column(String(100), index=True, nullable=False)
    entity_id = Column(String(100), index=True, nullable=False)
    action = Column(String(100), index=True, nullable=False)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    at = Column(DateTime(timezone=True), default=func.now(), index=True)
    
    # Relationships
    actor_user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_audit_entity', 'entity', 'entity_id'),
        Index('idx_audit_action', 'action'),
    )

class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(100), index=True, nullable=False)  # stripe, alibaba, etc.
    event_type = Column(String(100), index=True, nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(String(50), default="delivered", index=True)  # delivered/failed
    retry_count = Column(Integer, default=0, nullable=False)
    last_retry_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), index=True)
    
    __table_args__ = (
        Index('idx_webhook_provider_type', 'provider', 'event_type'),
        Index('idx_webhook_status', 'status'),
    )

# ==== GOALS MODEL ====

class UserGoal(Base):
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, index=True, nullable=False)

    # UX grouping and optimization dimension
    category = Column(String, default="supply_center")  # sourcing | fulfillment | supply_center
    metric = Column(String, nullable=False)  # cost | time | custom
    unit = Column(String, nullable=False)    # USD | days | custom
    direction = Column(String, nullable=False, default="decrease")  # decrease | increase

    target_amount = Column(Float, nullable=False)  # positive target delta
    baseline_amount = Column(Float, nullable=True)
    title = Column(String, nullable=False)

    weight = Column(Float, nullable=False, default=0.30)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

class RequestTypeEnum(enum.Enum):
    sourcing = "sourcing"
    quoting = "quoting"
    shipping = "shipping"

class AlgoOutput(Base):
    __tablename__ = "algo_outputs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # who/tenant
    user_id = Column(String, index=True, nullable=False)
    tenant_id = Column(String, index=True, nullable=True)

    # request
    request_type = Column(Enum(RequestTypeEnum, name="request_type_enum"), index=True, nullable=False)
    request_id = Column(String, index=True, nullable=True)  # external id / trace id if any
    model = Column(String, nullable=True)
    model_version = Column(String, nullable=True)

    # metrics
    num_matches_ge_80 = Column(Integer, nullable=False, default=0)
    total_matches = Column(Integer, nullable=True)
    top_match_score = Column(Float, nullable=True)
    top_matches = Column(JSON, nullable=True)  # list[{"id": str|None, "name": str|None, "score": float}]
    latency_ms = Column(Integer, nullable=True)
    status = Column(String, nullable=True)  # success/error
    error_message = Column(Text, nullable=True)

    # payloads
    input_payload = Column(JSON, nullable=True)     # sanitized request, filters, etc.
    output_summary = Column(Text, nullable=True)     # short text summary for list view
    reasoning = Column(JSON, nullable=True)         # full chain-of-reasoning/audit (tools used, steps, scores)
    
    __table_args__ = (
        Index('idx_algo_outputs_created_at', 'created_at'),
        Index('idx_algo_outputs_request_type', 'request_type'),
        Index('idx_algo_outputs_user_id', 'user_id'),
        Index('idx_algo_outputs_created_at_type', 'created_at', 'request_type'),
    )
