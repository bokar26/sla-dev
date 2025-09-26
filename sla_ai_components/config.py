from __future__ import annotations

# Auto-ingestion configuration
DATA_FOLDER = "./data"
DEFAULT_TENANT_ID = "tenant_demo"
WATCH_DATA_FOLDER = True
WATCH_INTERVAL_SECS = 10
AUTO_COMMIT_FROM_DATA_FOLDER = True  # Set to False for manual confirmation

# Dedupe and validation settings
DISABLE_FACTORY_DEDUPE = False  # Re-enable factory deduplication
