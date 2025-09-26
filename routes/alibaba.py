from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any, List
from pydantic import BaseModel
import os
from connectors.alibaba_client import (
    is_enabled, oauth_url, exchange_code_for_token, search_suppliers, search_products,
    map_supplier, map_product, AlibabaAuthError, AlibabaApiError
)

router = APIRouter(prefix="/api/alibaba", tags=["alibaba"])

class SearchRequest(BaseModel):
    query: str
    filters: Dict[str, Any] = {}
    access_token: str = ""

class OAuthCallbackRequest(BaseModel):
    code: str
    state: str = ""

@router.get("/enabled")
async def alibaba_enabled():
    """Check if Alibaba integration is enabled"""
    return {"enabled": is_enabled()}

@router.get("/oauth/url")
async def get_oauth_url():
    """Get OAuth authorization URL"""
    if not is_enabled():
        raise HTTPException(400, "Alibaba disabled/misconfigured")
    
    try:
        url = oauth_url("state-sla")
        return {"url": url}
    except AlibabaAuthError as e:
        raise HTTPException(400, str(e))

@router.post("/oauth/callback")
async def oauth_callback(request: OAuthCallbackRequest):
    """Handle OAuth callback"""
    try:
        tokens = await exchange_code_for_token(request.code)
        # TODO: Persist tokens to user/org store keyed by current user/org
        # For now, return the tokens (in production, store securely)
        return {
            "ok": True,
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token"),
            "expires_in": tokens.get("expires_in")
        }
    except AlibabaAuthError as e:
        raise HTTPException(400, str(e))

@router.post("/search/suppliers")
async def alibaba_search_suppliers(request: SearchRequest):
    """Search Alibaba suppliers"""
    if not is_enabled():
        return {"items": []}
    
    if not request.access_token:
        return {"items": []}
    
    try:
        items = await search_suppliers(
            request.access_token, 
            request.query, 
            request.filters
        )
        mapped_items = [map_supplier(x) for x in items]
        return {"items": mapped_items}
    except (AlibabaAuthError, AlibabaApiError) as e:
        raise HTTPException(400, str(e))

@router.post("/search/products")
async def alibaba_search_products(request: SearchRequest):
    """Search Alibaba products"""
    if not is_enabled():
        return {"items": []}
    
    if not request.access_token:
        return {"items": []}
    
    try:
        items = await search_products(
            request.access_token, 
            request.query, 
            request.filters
        )
        mapped_items = [map_product(x) for x in items]
        return {"items": mapped_items}
    except (AlibabaAuthError, AlibabaApiError) as e:
        raise HTTPException(400, str(e))

@router.get("/config")
async def get_alibaba_config():
    """Get Alibaba configuration for frontend"""
    return {
        "enabled": is_enabled(),
        "has_credentials": bool(os.getenv("ALIBABA_B2B_CLIENT_ID") and os.getenv("ALIBABA_B2B_CLIENT_SECRET")),
        "api_base": os.getenv("ALIBABA_B2B_API_BASE", "https://api.alibaba.com/"),
        "redirect_uri": os.getenv("ALIBABA_B2B_REDIRECT_URI")
    }