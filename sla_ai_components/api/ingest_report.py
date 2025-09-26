from __future__ import annotations
from fastapi import APIRouter
from typing import Dict, Any, List
import json

router = APIRouter(prefix="/api/ingest", tags=["ingest"])

# Import the upload storage to access reports
from .upload import _UPLOADS

@router.get("/report")
def get_ingest_report():
    """Get the latest ingest report from the most recent upload"""
    if not _UPLOADS:
        return {"message": "No uploads found", "reports": []}
    
    # Get all uploads
    all_uploads = []
    for upload_id, upload in _UPLOADS.items():
        report = upload.get("ingest_report", {})
        all_uploads.append({
            "upload_id": upload_id,
            "filename": upload.get("filename", "unknown"),
            "status": upload.get("status", "unknown"),
            "report": report
        })
    
    # Get the most recent upload
    latest_upload_id = max(_UPLOADS.keys())
    latest_upload = _UPLOADS[latest_upload_id]
    latest_report = latest_upload.get("ingest_report", {})
    
    return {
        "latest_upload": {
            "upload_id": latest_upload_id,
            "filename": latest_upload.get("filename", "unknown"),
            "status": latest_upload.get("status", "unknown"),
            "report": latest_report
        },
        "all_uploads": all_uploads
    }
