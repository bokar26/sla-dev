from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Literal, List, Dict, Any
import asyncio
import time
from ..internal_loader import get_corpus
from rapidfuzz import fuzz

router = APIRouter(prefix="/v1", tags=["search"])

class SearchRequest(BaseModel):
    q: Optional[str] = None
    country: Optional[str] = None
    product_type: Optional[str] = None
    quantity: Optional[int] = None
    customization: Optional[Literal["any","yes","no"]] = "any"
    min_score: Optional[int] = 50

def score_supplier(supplier: Dict[str, Any], query: str, country: Optional[str] = None) -> float:
    """Simple scoring function for suppliers"""
    if not query:
        return 50.0  # Base score for empty query
    
    score = 0.0
    
    # Text similarity (50%)
    name = str(supplier.get("name", "")).lower()
    product_types = str(supplier.get("product_types", "")).lower()
    materials = str(supplier.get("materials", "")).lower()
    description = str(supplier.get("description", "")).lower()
    
    text_blob = f"{name} {product_types} {materials} {description}"
    text_score = fuzz.token_set_ratio(query.lower(), text_blob)
    score += 0.5 * text_score
    
    # Country match (30%)
    supplier_country = str(supplier.get("country", "")).lower()
    if country:
        if supplier_country == country.lower():
            country_score = 100.0
        else:
            country_score = 40.0  # Less penalty for wrong country
    else:
        country_score = 80.0  # Higher neutral score
    score += 0.3 * country_score
    
    # Base score (20%) - always give some points
    score += 0.2 * 60.0
    
    return min(100.0, score)

@router.post("/search")
async def search_suppliers(req: SearchRequest):
    """Clean search implementation"""
    start_time = time.time()
    
    # Get corpus
    corpus = await get_corpus()
    
    if not corpus:
        return {
            "items": [],
            "meta": {
                "elapsed_ms": int((time.time() - start_time) * 1000),
                "passes": [{"pass": 1, "thr": req.min_score, "candidates": 0, "kept": 0, "t": 0}],
                "providers_used": {"internal": True},
                "warning": "No internal data loaded"
            }
        }
    
    # Score all suppliers
    query = req.q or ""
    scored_suppliers = []
    
    for supplier in corpus:
        score = score_supplier(supplier, query, req.country)
        if score >= (req.min_score or 80):
            supplier_id = supplier.get("id") or supplier.get("supplier_id") or f"supplier_{len(scored_suppliers)}"
            url = supplier.get("url") or supplier.get("website") or supplier.get("alibaba_url")
            
            scored_suppliers.append({
                "id": f"int_{supplier_id}",
                "name": supplier.get("name", "Unknown Supplier"),
                "country": supplier.get("country"),
                "score": round(score, 2),
                "materials": supplier.get("materials"),
                "moq": supplier.get("moq") or supplier.get("MOQ"),
                "lead_time": supplier.get("lead_time"),
                "source": {"type": "internal", "url": url},
                "reasoning": {"score_breakdown": f"text:{score:.1f}"},
                "raw": supplier
            })
    
    # Sort by score and take top 10
    scored_suppliers.sort(key=lambda x: x["score"], reverse=True)
    top_suppliers = scored_suppliers[:10]
    
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    return {
        "items": top_suppliers,
        "meta": {
            "elapsed_ms": elapsed_ms,
            "passes": [{
                "pass": 1,
                "thr": req.min_score or 80,
                "candidates": len(scored_suppliers),
                "kept": len(top_suppliers),
                "t": elapsed_ms
            }],
            "providers_used": {"internal": True},
            "total_corpus": len(corpus),
            "scored_candidates": len(scored_suppliers)
        }
    }
