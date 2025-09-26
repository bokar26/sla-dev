-- factories
CREATE TABLE IF NOT EXISTS factories (
  factory_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  city TEXT,
  capabilities_json JSONB,       -- {"knit":["loop-knit"],"gsm":[280,500],...}
  lead_time_days_p50 INT,
  defect_rate_90d REAL,          -- 0..1
  on_time_rate_180d REAL         -- 0..1
);

-- skus (what user wants to make)
CREATE TABLE IF NOT EXISTS skus (
  sku_id TEXT PRIMARY KEY,
  category TEXT,
  spec_json JSONB,               -- {"fabric":"loop-knit","gsm":400,"blend":[80,20]}
  target_cost REAL,
  target_lead_time INT
);

-- factory_quotes (historical or current quotes)
CREATE TABLE IF NOT EXISTS factory_quotes (
  id BIGSERIAL PRIMARY KEY,
  factory_id TEXT REFERENCES factories(factory_id),
  sku_id TEXT REFERENCES skus(sku_id),
  date DATE,
  quoted_fob REAL,
  moq INT,
  material_id TEXT,
  material_claim_price REAL,
  notes TEXT
);

-- material index time-series
CREATE TABLE IF NOT EXISTS material_prices (
  id BIGSERIAL PRIMARY KEY,
  material_id TEXT,
  name TEXT,
  grade TEXT,
  unit TEXT,                     -- kg/m/yd
  region TEXT,
  date DATE,
  price_usd_per_unit REAL,
  source TEXT
);

-- shipping lanes
CREATE TABLE IF NOT EXISTS lanes (
  lane_id TEXT PRIMARY KEY,
  origin_port TEXT,
  dest_port TEXT,
  mode TEXT                      -- ocean/air/rail
);

-- lane rates & performance
CREATE TABLE IF NOT EXISTS shipper_rates (
  id BIGSERIAL PRIMARY KEY,
  lane_id TEXT REFERENCES lanes(lane_id),
  carrier TEXT,
  date DATE,
  price_usd_per_unit REAL,       -- per cbm or kg
  unit TEXT,                     -- "cbm" or "kg"
  transit_days_p50 INT,
  transit_var REAL,
  on_time_rate REAL              -- 0..1
);

-- duties by HS code and corridor
CREATE TABLE IF NOT EXISTS duties (
  hs_code TEXT,
  origin TEXT,
  dest TEXT,
  duty_pct REAL,
  last_update DATE,
  PRIMARY KEY (hs_code, origin, dest)
);
