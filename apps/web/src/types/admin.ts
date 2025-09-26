export enum Role {
  superadmin = "superadmin",
  analyst = "analyst",
  support = "support",
}

export enum DemoRequestStatus {
  new = "new",
  contacted = "contacted",
  scheduled = "scheduled",
  done = "done",
}

export enum QuoteStatus {
  draft = "draft",
  calculated = "calculated",
  sent = "sent",
  accepted = "accepted",
  rejected = "rejected",
}

export enum JobType {
  index = "index",
  quote_calc = "quote_calc",
  webhook = "webhook",
  sync = "sync",
}

export enum JobStatus {
  queued = "queued",
  running = "running",
  success = "success",
  failed = "failed",
}

export interface User {
  id: number;
  email: string;
  name?: string;
  role: Role;
  is_admin: boolean;
  is_active: boolean;
  org_id?: number;
  created_at: string;
  last_seen_at?: string;
  two_fa_enabled: boolean;
}

export interface Organization {
  id: number;
  name: string;
  plan: string;
  region?: string;
  flags: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DemoRequest {
  id: number;
  org_id?: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  note?: string;
  status: DemoRequestStatus;
  assignee_id?: number;
  created_at: string;
  resolved_at?: string;
}

export interface Quote {
  id: number;
  org_id?: number;
  sku?: string;
  factory_id?: number;
  qty?: number;
  incoterm?: string;
  est_unit_cost?: number;
  margin?: number;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
}

export interface Factory {
  id: number;
  name: string;
  country?: string;
  city?: string;
  certifications: string[];
  moq?: number;
  lead_time_days?: number;
  rating?: number;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  type: JobType;
  payload: Record<string, any>;
  status: JobStatus;
  started_at?: string;
  finished_at?: string;
  error?: string;
  created_at: string;
}

export interface FeatureFlag {
  id: number;
  key: string;
  description?: string;
  enabled_global: boolean;
  enabled_orgs: number[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  actor_user_id?: number;
  entity: string;
  entity_id: string;
  action: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  at: string;
}

export interface WebhookEvent {
  id: number;
  provider: string;
  event_type: string;
  payload: Record<string, any>;
  status: string;
  retry_count: number;
  last_retry_at?: string;
  created_at: string;
}
