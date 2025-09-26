from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
from sla_ai_components.ingest.excel_loader import load_any
from sla_ai_components.ingest.commit import commit_sheet

router = APIRouter(prefix="/ingest", tags=["ingest"])

def get_tenant_id():
    return "tenant_demo"

# Import the storage from upload.py
from sla_ai_components.api.upload import _get_upload_row

# Simple in-memory storage for reports - replace with real DB
_REPORTS = {}

def _save_ingest_report(upload_id: int, stats: dict):
    _REPORTS[upload_id] = stats

def _set_upload_status(upload_id: int, status: str):
    from sla_ai_components.api.upload import _set_upload_status
    _set_upload_status(upload_id, status)

class CommitBody(BaseModel):
    upload_id: int
    mappings: Dict[str, str]  # {sheet_name: mapping_yaml}

@router.post("/commit")
def commit_upload(body: CommitBody, tenant_id: str = Depends(get_tenant_id)):
    info = _get_upload_row(body.upload_id)
    if not info or info["tenant_id"] != tenant_id:
        raise HTTPException(404, "Upload not found")

    frames = load_any(info["file_path"])
    stats = []
    for sheet_name, df in frames.items():
        mapping_yaml = body.mappings.get(sheet_name)
        if not mapping_yaml:
            # skip un-mapped sheets, but record
            stats.append({"sheet": sheet_name, "skipped": len(df)})
            continue
        s = commit_sheet(tenant_id, body.upload_id, sheet_name, df, mapping_yaml)
        stats.append(s)

    _save_ingest_report(body.upload_id, {"sheets": stats})
    _set_upload_status(body.upload_id, "committed")
    return {"upload_id": body.upload_id, "report": {"sheets": stats}}
