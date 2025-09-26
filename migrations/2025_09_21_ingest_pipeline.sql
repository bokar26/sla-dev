-- Uploads registry
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  uploaded_by TEXT,
  filename TEXT NOT NULL,
  mime TEXT,
  status TEXT CHECK (status IN ('received','preview_ready','committed','failed')) DEFAULT 'received',
  sheet_names TEXT,  -- JSON as TEXT for SQLite
  errors_json TEXT,  -- JSON as TEXT for SQLite
  file_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Proposed/confirmed mappings per sheet
CREATE TABLE IF NOT EXISTS upload_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  mapping_yaml TEXT NOT NULL,
  detected_confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Persist reusable profiles per tenant
CREATE TABLE IF NOT EXISTS mapping_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  sheet_type TEXT NOT NULL,  -- 'factories' | 'materials' | 'lanes' | 'shipper_rates' | 'unknown'
  mapping_yaml TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ingest report
CREATE TABLE IF NOT EXISTS ingest_reports (
  upload_id INTEGER PRIMARY KEY REFERENCES uploads(id) ON DELETE CASCADE,
  stats_json TEXT,  -- JSON as TEXT for SQLite
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add tenant/source to factories if not present (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
-- We'll handle this in the application layer or use a different approach
-- For now, we'll assume these columns exist or will be added manually

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_uploads_tenant ON uploads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mapping_profiles_tenant ON mapping_profiles(tenant_id);
