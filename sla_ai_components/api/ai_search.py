from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, List
import numpy as np

from sla_ai_components.nlp.parse_spec import parse_query_to_spec
from sla_ai_components.nlp.crosscheck import enrich_spec_with_data

router = APIRouter(prefix="/ai", tags=["ai"])

class AiSearchRequest(BaseModel):
    query: str
    qty: int | None = None
    profile: str | None = None  # "cost" | "speed" | "balanced" (future)
    # optional overrides:
    duty_pct: float | None = None
    seasonal_penalty: float | None = None

class Hit(BaseModel):
    factory_id: str
    lane_id: str
    total: float
    match: float
    cost: float
    logistics: float
    risk: float
    fob: float
    transit_days: float
    on_time: float

class AiSearchResponse(BaseModel):
    sku_spec: Dict[str, Any]
    enriched: Dict[str, Any]
    results: List[Hit]
    top_index: int

@router.post("/search", response_model=AiSearchResponse)
def ai_search(req: AiSearchRequest):
    # 1) NL → spec
    spec = parse_query_to_spec(req.query)

    # 2) Crosscheck with data (adds counts, corridor hints)
    enriched = enrich_spec_with_data(spec.copy())

    # 3) Apply defaults & profiles (you can expand later)
    qty = req.qty or 1000
    duty_pct = req.duty_pct if req.duty_pct is not None else 0.0
    seasonal = req.seasonal_penalty if req.seasonal_penalty is not None else 0.0

    # 4) Call ranking logic directly (reuse existing ranking endpoint logic)
    # For now, we'll create a simple mock ranking response
    # In a real implementation, you'd call the ranking endpoint or import its logic
    
    # Mock ranking results for demonstration
    mock_results = [
        {
            "factory_id": "F001",
            "lane_id": "IN-US-001", 
            "total": 0.85,
            "match": 0.92,
            "cost": 12.50,
            "logistics": 0.78,
            "risk": 0.15,
            "fob": 8.75,
            "transit_days": 18.0,
            "on_time": 0.95
        },
        {
            "factory_id": "F002",
            "lane_id": "IN-US-002",
            "total": 0.78,
            "match": 0.88,
            "cost": 11.25,
            "logistics": 0.72,
            "risk": 0.20,
            "fob": 7.50,
            "transit_days": 22.0,
            "on_time": 0.88
        },
        {
            "factory_id": "F003", 
            "lane_id": "CN-US-001",
            "total": 0.72,
            "match": 0.85,
            "cost": 10.80,
            "logistics": 0.68,
            "risk": 0.25,
            "fob": 6.90,
            "transit_days": 25.0,
            "on_time": 0.82
        }
    ]

    # 5) Sort by total score (already sorted in mock) and mark top
    results = [Hit(**r) for r in mock_results]
    top_index = 0 if results else -1

    return AiSearchResponse(
        sku_spec=spec,
        enriched=enriched,
        results=results,
        top_index=top_index
    )
