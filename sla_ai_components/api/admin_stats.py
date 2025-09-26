from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from sla_ai_components.data.repos import count_distinct_vendors, count_total_factories

router = APIRouter(prefix="/api/admin", tags=["admin"])

class StatsOut(BaseModel):
    vendor_count: int
    factory_count_total: int

@router.get("/stats", response_model=StatsOut)
def admin_stats():
    """Get admin dashboard statistics - always returns stable JSON"""
    try:
        vendors = count_distinct_vendors()
    except Exception:
        vendors = 0
    try:
        total_factories = count_total_factories()
    except Exception:
        total_factories = 0
    # Ensure ints
    return {"vendor_count": int(vendors or 0), "factory_count_total": int(total_factories or 0)}
