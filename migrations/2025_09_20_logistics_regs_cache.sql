CREATE TABLE IF NOT EXISTS logistics_regulations_cache (
  id BIGSERIAL PRIMARY KEY,
  origin_country TEXT NOT NULL,
  dest_country TEXT NOT NULL,
  hs_code TEXT NOT NULL,
  fetched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  basis TEXT,                      -- "FOB" or "CIF"
  duty_rate_pct REAL,
  import_tax_rate_pct REAL,
  exemptions_json JSONB,           -- e.g., {"FTA":"X", "de_minimis":800}
  documents_json JSONB,            -- e.g., ["COO","Commercial Invoice","Packing List","Phytosanitary Cert"]
  restrictions_json JSONB,         -- e.g., {"prohibited":false, "licenses":["BIS"], "notes":"..."}
  confidence REAL,
  source TEXT,                     -- "LLM" | "manual" | "fed_db"
  raw_json JSONB                   -- the unparsed LLM blob for audit
);

CREATE INDEX IF NOT EXISTS idx_regs_cache_key ON logistics_regulations_cache (origin_country, dest_country, hs_code);
