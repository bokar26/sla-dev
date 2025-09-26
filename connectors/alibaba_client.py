# Alibaba B2B API Client
# Legal compliance: Uses official Alibaba.com Open Platform APIs only
import os
import time
import hashlib
import httpx
from typing import Dict, Any, List, Tuple, Optional

API_BASE = os.getenv("ALIBABA_B2B_API_BASE", "https://api.alibaba.com/")
CLIENT_ID = os.getenv("ALIBABA_B2B_CLIENT_ID")
CLIENT_SECRET = os.getenv("ALIBABA_B2B_CLIENT_SECRET")
REDIRECT_URI = os.getenv("ALIBABA_B2B_REDIRECT_URI")

class AlibabaAuthError(Exception):
    """Alibaba authentication error"""
    pass

class AlibabaApiError(Exception):
    """Alibaba API error"""
    pass

def is_enabled() -> bool:
    """Check if Alibaba integration is enabled and properly configured"""
    return (
        os.getenv("FEATURE_ALIBABA", "0") == "1" and 
        CLIENT_ID and 
        CLIENT_SECRET and 
        REDIRECT_URI
    )

def oauth_url(state: str) -> str:
    """Generate OAuth authorization URL"""
    if not is_enabled():
        raise AlibabaAuthError("Alibaba disabled/misconfigured")
    
    # NOTE: Confirm actual OAuth path per Alibaba docs
    return (
        f"{API_BASE}auth/authorize?"
        f"response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}&state={state}&scope=read"
    )

async def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """Exchange authorization code for access token"""
    if not is_enabled():
        raise AlibabaAuthError("Alibaba disabled/misconfigured")
    
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(f"{API_BASE}auth/token", data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
        })
        if r.status_code != 200:
            raise AlibabaAuthError(f"Token exchange failed: {r.status_code} {r.text}")
        return r.json()

async def refresh_token(refresh_token: str) -> Dict[str, Any]:
    """Refresh access token using refresh token"""
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(f"{API_BASE}auth/token", data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        })
        if r.status_code != 200:
            raise AlibabaAuthError(f"Refresh failed: {r.status_code} {r.text}")
        return r.json()

# ---- SEARCH FUNCTIONS ----
async def search_suppliers(access_token: str, query: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Search for suppliers on Alibaba"""
    params = {"q": query, **{k: v for k, v in (filters or {}).items() if v}}
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{API_BASE}b2b/suppliers/search", params=params, headers=headers)
        if r.status_code != 200:
            raise AlibabaApiError(f"Supplier search failed: {r.status_code} {r.text}")
        return r.json().get("items", [])

async def search_products(access_token: str, query: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Search for products on Alibaba"""
    params = {"q": query, **{k: v for k, v in (filters or {}).items() if v}}
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{API_BASE}b2b/products/search", params=params, headers=headers)
        if r.status_code != 200:
            raise AlibabaApiError(f"Product search failed: {r.status_code} {r.text}")
        return r.json().get("items", [])

# ---- NORMALIZERS ----
def map_supplier(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Map Alibaba supplier data to internal format"""
    return {
        "id": f"ali:{raw.get('id')}",
        "name": raw.get("name"),
        "country": raw.get("country"),
        "city": raw.get("city"),
        "capabilities": raw.get("categories") or raw.get("capabilities") or [],
        "moq": raw.get("moq"),
        "leadTimeDays": raw.get("lead_time_days"),
        "verified": bool(raw.get("verified")),
        "yearsActive": raw.get("years_active"),
        "responseRate": raw.get("response_rate"),
        "transactionLevel": raw.get("transaction_level"),
        "rating": raw.get("rating"),
        "storefrontUrl": raw.get("url") or raw.get("storefront"),
        "source": "alibaba",
        "tags": ["alibaba"],
        "certifications": raw.get("certifications", []),
        "specialties": raw.get("specialties", []),
        "minOrderQty": raw.get("moq"),
        "historicalCogsRange": None,  # Not available from Alibaba
        "currency": raw.get("currency", "USD"),
        "score": 0.0,  # Will be calculated during ranking
    }

def map_product(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Map Alibaba product data to internal format"""
    return {
        "id": f"ali:prod:{raw.get('id')}",
        "title": raw.get("title"),
        "image": raw.get("image"),
        "category": raw.get("category"),
        "priceMin": raw.get("price_min"),
        "priceMax": raw.get("price_max"),
        "currency": raw.get("currency", "USD"),
        "moq": raw.get("moq"),
        "unit": raw.get("unit"),
        "supplierId": f"ali:{raw.get('supplier_id')}" if raw.get("supplier_id") else None,
        "storefrontUrl": raw.get("url"),
        "source": "alibaba",
        "tags": ["alibaba"],
    }

# ---- UTILITY FUNCTIONS ----
def dedup_and_merge(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Deduplicate and merge suppliers by name, country, city"""
    def key_func(x):
        return (
            str(x.get("name", "")).lower().strip(),
            x.get("country"),
            x.get("city")
        )
    
    bucket = {}
    for item in items:
        k = key_func(item)
        if k not in bucket:
            bucket[k] = item
        else:
            # Merge tags and best fields
            existing = bucket[k]
            existing["tags"] = list(set((existing.get("tags") or []) + (item.get("tags") or [])))
            if item.get("verified"):
                existing["verified"] = True
            if item.get("storefrontUrl") and not existing.get("storefrontUrl"):
                existing["storefrontUrl"] = item["storefrontUrl"]
            # Keep the higher score
            if item.get("score", 0) > existing.get("score", 0):
                existing["score"] = item["score"]
    
    return list(bucket.values())

def rerank_factories(query: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Lightweight scoring for factory ranking"""
    import math
    
    scored = []
    for item in items:
        score = 0.0
        
        # Base match score
        score += item.get("matchScore", 0) * 0.5
        
        # Verification bonus
        if item.get("verified"):
            score += 0.2
        
        # Years active bonus
        years_active = item.get("yearsActive", 0)
        score += min(years_active / 10.0, 1.0) * 0.1
        
        # Response rate bonus
        response_rate = item.get("responseRate", 0)
        score += min(response_rate / 100.0, 1.0) * 0.1
        
        # Transaction level bonus
        transaction_level = item.get("transactionLevel", 0)
        score += min(transaction_level / 5.0, 1.0) * 0.1
        
        # Alibaba-specific bonuses
        if item.get("source") == "alibaba":
            if item.get("verified"):
                score += 0.05
            if transaction_level >= 3:
                score += 0.03
            if response_rate >= 90:
                score += 0.02
        
        item["score"] = round(score, 3)
        scored.append(item)
    
    return sorted(scored, key=lambda x: x["score"], reverse=True)
