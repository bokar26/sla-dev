from __future__ import annotations
from fastapi import APIRouter
from sla_ai_components.ingest.daemon import bootstrap_scan

router = APIRouter(prefix="/ingest", tags=["ingest"])

@router.post("/rescan")
def rescan_data_folder():
    """Manually trigger a rescan of the data folder"""
    try:
        files_processed = bootstrap_scan()
        return {
            "status": "ok", 
            "message": f"Data folder rescanned successfully. {files_processed} files processed.",
            "files_processed": files_processed
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to rescan data folder: {str(e)}",
            "files_processed": 0
        }
