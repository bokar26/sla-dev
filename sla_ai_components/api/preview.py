from __future__ import annotations
from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from pathlib import Path
from sla_ai_components.ingest.excel_loader import load_any
from sla_ai_components.ingest.preview import make_preview
from sla_ai_components.ingest.mapping_profiles import get_profile_for_tenant

router = APIRouter(prefix="/ingest", tags=["ingest"])

def get_tenant_id():
    return "tenant_demo"

# Import the storage from upload.py
from sla_ai_components.api.upload import _get_upload_row

@router.get("/preview")
def get_preview(upload_id: int = Query(...), tenant_id: str = Depends(get_tenant_id)):
    # look up file path & status for upload_id (replace with DB)
    info = _get_upload_row(upload_id)
    if not info or info["tenant_id"] != tenant_id:
        raise HTTPException(404, "Upload not found")
    if info["status"] != "preview_ready":
        raise HTTPException(409, f"Upload status is {info['status']}")

    frames = load_any(info["file_path"])  # store path in uploads table in real impl
    preview = make_preview(frames)
    # If a mapping profile exists for this tenant & sheet_type, attach it
    for p in preview:
        prof = get_profile_for_tenant(tenant_id, p["sheet_type"])
        if prof:
            p["profile_mapping_yaml"] = prof["mapping_yaml"]
    return {"upload_id": upload_id, "sheets": preview}
