#!/usr/bin/env python3
"""
Suppliers router for SLA API
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/v1/suppliers", tags=["suppliers"])

class SearchReq(BaseModel):
    q: str
    country: Optional[str] = None
    materials: Optional[List[str]] = None
    certs: Optional[List[str]] = None
    moq_max: Optional[int] = None
    product_type: Optional[str] = None

class SearchRes(BaseModel):
    items: List[Dict[str, Any]]
    meta: Dict[str, Any] = {}

@router.post("/search", response_model=SearchRes)
def search_factories(body: SearchReq):
    """Search for factories/suppliers based on criteria."""
    # TODO: replace with real vector/filters
    items = [{
        "id": "sup_001",
        "name": "Example Knit Factory",
        "country": body.country or "Portugal",
        "region": body.country or "Portugal",
        "materials": ["Cotton", "Nylon"],
        "capabilities": ["Knitting", "Cutting", "Sewing"],
        "moq": 300,
        "certs": ["OEKO-TEX", "BSCI"],
        "lead_days": 21,
        "leadTimeDays": 21,
        "price_usd": 2.8,
        "score": 0.87,
        "why": [f"Match: {body.q}"],
        "explanation": f"This factory matches your search for '{body.q}' with excellent capabilities and certifications."
    }]
    return SearchRes(items=items, meta={"source": "stub"})

@router.get("/health")
def suppliers_health():
    """Health check for suppliers service."""
    return {"ok": True, "service": "suppliers"}
