-- SLA Suggestions system
CREATE TABLE IF NOT EXISTS suggestion_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  ran_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  stats_json TEXT  -- JSON as TEXT for SQLite
);

CREATE TABLE IF NOT EXISTS suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  run_id INTEGER REFERENCES suggestion_runs(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,                 -- 'route' | 'supplier' | 'timing'
  title TEXT NOT NULL,
  description TEXT,
  data_json TEXT NOT NULL,            -- JSON as TEXT for SQLite
  impact_score REAL NOT NULL,         -- normalized 0..1
  expected_savings_usd REAL DEFAULT 0,
  expected_eta_days_delta REAL DEFAULT 0,
  confidence REAL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'viewed' | 'accepted' | 'dismissed' | 'snoozed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  snooze_until DATETIME
);

CREATE INDEX IF NOT EXISTS idx_suggestions_tenant_status ON suggestions(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_runs_tenant ON suggestion_runs(tenant_id);
