"""
Alibaba integration API endpoints.
"""

import os
import uuid
import logging
import requests
from datetime import datetime, timedelta
from functools import lru_cache
from urllib.parse import quote, urlencode
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from database import get_db
from models import (
    IntegrationCredential, AlibabaOrder, AlibabaShipment, AlibabaSupplier,
    SyncLog, IntegrationProviderConfig, ProviderEnum, SyncKindEnum, SyncStatusEnum
)
from crypto import encrypt_data, decrypt_data
from sync_jobs import sync_full
from config.alibaba_provider import get_b2b_cfg

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/integrations/alibaba", tags=["alibaba"])


# Pydantic models for BYOA
class ProviderConfigIn(BaseModel):
    client_id: str
    client_secret: str
    auth_url: str
    token_url: str
    api_base: str
    redirect_uri: str
    scopes: str

class ImportJobOut(BaseModel):
    job_id: str

class ProviderConfigOut(BaseModel):
    is_byoa_enabled: bool
    has_creds: bool


# OAuth configuration is now handled by config.alibaba module


def get_current_user_id() -> str:
    """Mock function to get current user ID - replace with real auth"""
    return "550e8400-e29b-41d4-a716-446655440000"


def get_byoa_config_for_user(user_id: str, db: Session) -> Optional[IntegrationProviderConfig]:
    """Get BYOA config for a user if available"""
    uid = uuid.UUID(user_id)
    return db.query(IntegrationProviderConfig).filter(
        IntegrationProviderConfig.user_id == uid,
        IntegrationProviderConfig.provider == ProviderEnum.ALIBABA,
        IntegrationProviderConfig.is_byoa_enabled == True
    ).first()


def create_provider_config_from_byoa(byoa_cfg: IntegrationProviderConfig):
    """Create a provider config object from BYOA database record"""
    from types import SimpleNamespace
    
    return SimpleNamespace(
        client_id=decrypt_data(byoa_cfg.client_id),
        client_secret=decrypt_data(byoa_cfg.client_secret),
        auth_url=byoa_cfg.auth_url,
        token_url=byoa_cfg.token_url,
        api_base=byoa_cfg.api_base,
        redirect_uri=byoa_cfg.redirect_uri,
        scope=byoa_cfg.scopes
    )


# BYOA Provider Config Endpoints
@router.get("/provider-config", response_model=ProviderConfigOut)
def get_provider_config(db: Session = Depends(get_db)):
    """Get BYOA provider configuration status for current user"""
    uid = uuid.UUID(get_current_user_id())
    cfg = db.query(IntegrationProviderConfig).filter(
        IntegrationProviderConfig.user_id == uid,
        IntegrationProviderConfig.provider == ProviderEnum.ALIBABA
    ).first()
    
    return ProviderConfigOut(
        is_byoa_enabled=bool(cfg and cfg.is_byoa_enabled),
        has_creds=bool(cfg and cfg.client_id and cfg.client_secret),
    )


@router.post("/provider-config/enable-byoa")
def enable_byoa(db: Session = Depends(get_db)):
    """Enable BYOA mode for current user"""
    uid = uuid.UUID(get_current_user_id())
    cfg = db.query(IntegrationProviderConfig).filter(
        IntegrationProviderConfig.user_id == uid,
        IntegrationProviderConfig.provider == ProviderEnum.ALIBABA
    ).first()
    
    if not cfg:
        cfg = IntegrationProviderConfig(
            user_id=uid, 
            provider=ProviderEnum.ALIBABA
        )
        db.add(cfg)
    
    cfg.is_byoa_enabled = True
    db.commit()
    return {"ok": True}


@router.post("/provider-config")
def save_provider_config(body: ProviderConfigIn, db: Session = Depends(get_db)):
    """Save BYOA provider configuration for current user"""
    uid = uuid.UUID(get_current_user_id())
    cfg = db.query(IntegrationProviderConfig).filter(
        IntegrationProviderConfig.user_id == uid,
        IntegrationProviderConfig.provider == ProviderEnum.ALIBABA
    ).first()
    
    if not cfg:
        cfg = IntegrationProviderConfig(
            user_id=uid, 
            provider=ProviderEnum.ALIBABA
        )
        db.add(cfg)
    
    # Encrypt sensitive data
    cfg.client_id = encrypt_data(body.client_id)
    cfg.client_secret = encrypt_data(body.client_secret)
    cfg.auth_url = body.auth_url.strip()
    cfg.token_url = body.token_url.strip()
    cfg.api_base = body.api_base.strip()
    cfg.redirect_uri = body.redirect_uri.strip()
    cfg.scopes = body.scopes.strip()
    cfg.is_byoa_enabled = True
    db.commit()
    
    return {"ok": True}


@router.get("/oauth/url")
async def get_oauth_url(request: Request, db: Session = Depends(get_db)):
    """
    Return a real Alibaba B2B OAuth URL for popup flow.
    Uses BYOA config if available, otherwise falls back to server env.
    """
    uid = uuid.UUID(get_current_user_id())
    
    # Check for BYOA config first
    byoa_cfg = db.query(IntegrationProviderConfig).filter(
        IntegrationProviderConfig.user_id == uid,
        IntegrationProviderConfig.provider == ProviderEnum.ALIBABA,
        IntegrationProviderConfig.is_byoa_enabled == True
    ).first()
    
    if byoa_cfg and byoa_cfg.client_id and byoa_cfg.client_secret:
        # Use BYOA config
        client_id = decrypt_data(byoa_cfg.client_id)
        client_secret = decrypt_data(byoa_cfg.client_secret)
        auth_url = byoa_cfg.auth_url
        redirect_uri = byoa_cfg.redirect_uri
        scopes = byoa_cfg.scopes
        
        logger.info("Using BYOA config for OAuth URL")
    else:
        # Fall back to server env
        try:
            cfg = get_b2b_cfg()
            client_id = cfg.client_id
            client_secret = cfg.client_secret
            auth_url = str(cfg.auth_url)
            redirect_uri = str(cfg.redirect_uri)
            scopes = cfg.scope
            logger.info("Using server env config for OAuth URL")
        except RuntimeError as e:
            logger.error("Alibaba OAuth not configured: %s", e)
            raise HTTPException(
                status_code=400, 
                detail="Alibaba OAuth not configured. Either enable BYOA in Alibaba settings or set server env."
            )

    state = str(uuid.uuid4())
    q = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scopes,
        "state": state,
    }
    url = f"{auth_url}?{urlencode(q)}"
    logger.info("Alibaba auth URL ready")
    return {"url": url, "state": state}


@router.get("/oauth/callback")
async def oauth_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    popup: int = Query(0),
    db: Session = Depends(get_db),
):
    """Handle OAuth callback and exchange code for tokens with popup support"""
    uid = uuid.UUID(get_current_user_id())
    
    # Check for BYOA config first
    byoa_cfg = db.query(IntegrationProviderConfig).filter(
        IntegrationProviderConfig.user_id == uid,
        IntegrationProviderConfig.provider == ProviderEnum.ALIBABA,
        IntegrationProviderConfig.is_byoa_enabled == True
    ).first()
    
    if byoa_cfg and byoa_cfg.client_id and byoa_cfg.client_secret:
        # Use BYOA config
        client_id = decrypt_data(byoa_cfg.client_id)
        client_secret = decrypt_data(byoa_cfg.client_secret)
        token_url = byoa_cfg.token_url
        redirect_uri = byoa_cfg.redirect_uri
        logger.info("Using BYOA config for token exchange")
    else:
        # Fall back to server env
        try:
            cfg = get_b2b_cfg()
            client_id = cfg.client_id
            client_secret = cfg.client_secret
            token_url = str(cfg.token_url)
            redirect_uri = str(cfg.redirect_uri)
            logger.info("Using server env config for token exchange")
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Exchange code for tokens (no mocks)
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }
    try:
        resp = requests.post(token_url, data=data, timeout=30)
        if resp.status_code != 200:
            logger.error("Token exchange failed %s %s", resp.status_code, resp.text)
            raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")
        token = resp.json()
    except requests.exceptions.RequestException as e:
        logger.exception("OAuth exchange error")
        raise HTTPException(status_code=502, detail="OAuth exchange error")

    # Get user ID
    user_id = get_current_user_id()
    user_uuid = uuid.UUID(user_id)
    
    # Store credentials
    expires_at = None
    if "expires_in" in token:
        expires_at = datetime.utcnow() + timedelta(seconds=int(token["expires_in"]))
    
    # Check if credentials already exist
    existing_credential = db.query(IntegrationCredential).filter(
        and_(
            IntegrationCredential.user_id == user_uuid,
            IntegrationCredential.provider == ProviderEnum.ALIBABA
        )
    ).first()
        
    if existing_credential:
        # Update existing credentials
        existing_credential.access_token = encrypt_data(token["access_token"])
        existing_credential.refresh_token = encrypt_data(token.get("refresh_token", ""))
        existing_credential.expires_at = expires_at
        existing_credential.scope = token.get("scope", "")
        existing_credential.connected_at = datetime.utcnow()
        existing_credential.revoked_at = None
    else:
        # Create new credentials
        credential = IntegrationCredential(
            user_id=user_uuid,
            provider=ProviderEnum.ALIBABA,
            access_token=encrypt_data(token["access_token"]),
            refresh_token=encrypt_data(token.get("refresh_token", "")),
            expires_at=expires_at,
            scope=token.get("scope", ""),
            connected_at=datetime.utcnow()
        )
        db.add(credential)
    
    db.commit()

    # kick off initial FULL sync (real)
    try:
        sync_full(user_id)
    except Exception as e:
        logger.warning("Initial sync failed to start: %s", e)

    if popup:
        html = """<!doctype html>
<html><body>
<script>
  try {
    window.opener && window.opener.postMessage({provider:"alibaba", status:"success"}, "*");
  } catch(e) {}
  window.close();
</script>
Connected. You can close this window.
</body></html>"""
        return Response(content=html, media_type="text/html")
    return {"success": True, "redirect_url": "/dashboard?alibaba=connected"}


@router.post("/disconnect")
async def disconnect_alibaba(db: Session = Depends(get_db)):
    """Disconnect Alibaba integration"""
    user_id = get_current_user_id()
    user_uuid = uuid.UUID(user_id)
    
    # Find and revoke credentials
    credential = db.query(IntegrationCredential).filter(
        and_(
            IntegrationCredential.user_id == user_uuid,
            IntegrationCredential.provider == ProviderEnum.ALIBABA,
            IntegrationCredential.revoked_at.is_(None)
        )
    ).first()
    
    if credential:
        credential.revoked_at = datetime.utcnow()
        db.commit()
        logger.info(f"Alibaba integration disconnected for user {user_id}")
    
    return {"success": True, "message": "Alibaba integration disconnected"}


@router.get("/status")
async def get_alibaba_status(db: Session = Depends(get_db)):
    """Get Alibaba integration status and metrics"""
    user_id = get_current_user_id()
    user_uuid = uuid.UUID(user_id)
    
    # Check if connected
    credential = db.query(IntegrationCredential).filter(
        and_(
            IntegrationCredential.user_id == user_uuid,
            IntegrationCredential.provider == ProviderEnum.ALIBABA,
            IntegrationCredential.revoked_at.is_(None)
        )
    ).first()
    
    if not credential:
        return {
            "connected": False,
            "account_name": None,
            "last_sync_at": None,
            "metrics": {
                "orders_count": 0,
                "shipments_count": 0,
                "suppliers_count": 0
            },
            "recent_logs": []
        }
    
    # Get metrics
    orders_count = db.query(AlibabaOrder).filter(AlibabaOrder.user_id == user_uuid).count()
    shipments_count = db.query(AlibabaShipment).filter(AlibabaShipment.user_id == user_uuid).count()
    suppliers_count = db.query(AlibabaSupplier).filter(AlibabaSupplier.user_id == user_uuid).count()
    
    # Get last sync time
    last_sync = db.query(SyncLog).filter(
        and_(
            SyncLog.user_id == user_uuid,
            SyncLog.provider == ProviderEnum.ALIBABA,
            SyncLog.status == SyncStatusEnum.COMPLETED
        )
    ).order_by(SyncLog.finished_at.desc()).first()
    
    last_sync_at = last_sync.finished_at if last_sync else None
    
    # Get recent logs
    recent_logs = db.query(SyncLog).filter(
        and_(
            SyncLog.user_id == user_uuid,
            SyncLog.provider == ProviderEnum.ALIBABA
        )
    ).order_by(SyncLog.started_at.desc()).limit(5).all()
    
    logs_data = []
    for log in recent_logs:
        logs_data.append({
            "kind": log.kind.value,
            "status": log.status.value,
            "started_at": log.started_at,
            "finished_at": log.finished_at,
            "error_message": log.error_message,
            "stats": log.stats
        })
    
    return {
        "connected": True,
        "account_name": "Alibaba Account",  # Could be extracted from API
        "last_sync_at": last_sync_at,
        "metrics": {
            "orders_count": orders_count,
            "shipments_count": shipments_count,
            "suppliers_count": suppliers_count
        },
        "recent_logs": logs_data
    }


@router.post("/sync")
async def sync_alibaba_data(kind: str, db: Session = Depends(get_db)):
    """Trigger Alibaba data sync"""
    user_id = get_current_user_id()
    
    try:
        if kind == "FULL":
            result = sync_full(user_id)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown sync kind: {kind}")
        
        return {"success": True, "result": result}
        
    except Exception as e:
        logger.error(f"Sync failed for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.get("/orders")
async def get_alibaba_orders(db: Session = Depends(get_db)):
    """Get Alibaba orders"""
    user_id = get_current_user_id()
    user_uuid = uuid.UUID(user_id)
    
    orders = db.query(AlibabaOrder).filter(AlibabaOrder.user_id == user_uuid).all()
    
    orders_data = []
    for order in orders:
        orders_data.append({
            "id": order.id,
            "alibaba_order_id": order.alibaba_order_id,
            "status": order.status,
            "buyer_company": order.buyer_company,
            "supplier_company": order.supplier_company,
            "currency": order.currency,
            "total_amount": order.total_amount,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "fulfillment_state": order.fulfillment_state
        })
    
    return {"orders": orders_data}


@router.get("/shipments")
async def get_alibaba_shipments(db: Session = Depends(get_db)):
    """Get Alibaba shipments"""
    user_id = get_current_user_id()
    user_uuid = uuid.UUID(user_id)
    
    shipments = db.query(AlibabaShipment).filter(AlibabaShipment.user_id == user_uuid).all()
    
    shipments_data = []
    for shipment in shipments:
        shipments_data.append({
            "id": shipment.id,
            "alibaba_order_id": shipment.alibaba_order_id,
            "tracking_no": shipment.tracking_no,
            "status": shipment.status,
            "carrier": shipment.carrier,
            "last_event_at": shipment.last_event_at,
            "eta": shipment.eta
        })
    
    return {"shipments": shipments_data}


@router.get("/suppliers")
async def get_alibaba_suppliers(db: Session = Depends(get_db)):
    """Get Alibaba suppliers"""
    user_id = get_current_user_id()
    user_uuid = uuid.UUID(user_id)
    
    suppliers = db.query(AlibabaSupplier).filter(AlibabaSupplier.user_id == user_uuid).all()
    
    suppliers_data = []
    for supplier in suppliers:
        suppliers_data.append({
            "id": supplier.id,
            "alibaba_supplier_id": supplier.alibaba_supplier_id,
            "name": supplier.name,
            "email": supplier.email,
            "phone": supplier.phone,
            "location": supplier.location,
            "rating": supplier.rating
        })
    
    return {"suppliers": suppliers_data}


@router.get("/diagnostics")
async def alibaba_diagnostics(request: Request):
    """
    Returns which B2B env vars are present (masked) and the computed redirect URI.
    Helpful for setup debugging; does NOT expose secrets.
    """
    try:
        cfg = get_b2b_cfg()
        ok = True
        err = None
    except RuntimeError as e:
        cfg = None
        ok = False
        err = str(e)

    # What callback does the server compute right now?
    try:
        computed_callback = str(request.url_for("oauth_callback"))
    except Exception:
        computed_callback = None

    return {
        "ok": ok,
        "error": err,
        "present": {
            "ALIBABA_B2B_AUTH_URL": bool(os.getenv("ALIBABA_B2B_AUTH_URL")),
            "ALIBABA_B2B_TOKEN_URL": bool(os.getenv("ALIBABA_B2B_TOKEN_URL")),
            "ALIBABA_B2B_API_BASE": bool(os.getenv("ALIBABA_B2B_API_BASE")),
            "ALIBABA_B2B_CLIENT_ID": bool(os.getenv("ALIBABA_B2B_CLIENT_ID")),
            "ALIBABA_B2B_CLIENT_SECRET": bool(os.getenv("ALIBABA_B2B_CLIENT_SECRET")),
            "ALIBABA_B2B_SCOPE": bool(os.getenv("ALIBABA_B2B_SCOPE")),
            "ALIBABA_B2B_REDIRECT_URI": bool(os.getenv("ALIBABA_B2B_REDIRECT_URI")),
        },
        "redirect_uri_env": (str(cfg.redirect_uri) if ok and cfg else None),
        "redirect_uri_computed": computed_callback,
        "frontend_origin": os.getenv("FRONTEND_ORIGIN"),
    }


# CSV Import Endpoints
@router.post("/import/orders", response_model=ImportJobOut)
async def import_orders(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import Alibaba orders from CSV/XLSX file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Save file temporarily
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    # Enqueue background job (stub for now)
    # TODO: Implement actual background job processing
    logger.info(f"Enqueued CSV import job {job_id} for file {file.filename}")
    
    return ImportJobOut(job_id=job_id)


@router.post("/import/shipments", response_model=ImportJobOut)
async def import_shipments(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import Alibaba shipments from CSV/XLSX file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Save file temporarily
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    # Enqueue background job (stub for now)
    # TODO: Implement actual background job processing
    logger.info(f"Enqueued CSV import job {job_id} for file {file.filename}")
    
    return ImportJobOut(job_id=job_id)


@router.post("/import/suppliers", response_model=ImportJobOut)
async def import_suppliers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import Alibaba suppliers from CSV/XLSX file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Save file temporarily
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    # Enqueue background job (stub for now)
    # TODO: Implement actual background job processing
    logger.info(f"Enqueued CSV import job {job_id} for file {file.filename}")
    
    return ImportJobOut(job_id=job_id)


# Email Ingestion Endpoints (stubs)
@router.post("/email/connect")
async def connect_email(db: Session = Depends(get_db)):
    """Connect email for Alibaba order ingestion"""
    # TODO: Implement Gmail/IMAP OAuth
    return {"message": "Email connection not yet implemented"}


@router.get("/email/status")
async def email_status(db: Session = Depends(get_db)):
    """Get email ingestion status"""
    # TODO: Implement email status check
    return {"connected": False, "last_sync": None}


# ==== NEW SLA SEARCH INTEGRATION ====

@router.get("/search/enabled")
async def search_enabled():
    """Check if Alibaba search is enabled for SLA"""
    return {"enabled": os.getenv("FEATURE_ALIBABA", "0") == "1"}

@router.post("/search/suppliers")
async def search_suppliers_for_sla(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Search Alibaba suppliers for SLA integration"""
    if os.getenv("FEATURE_ALIBABA", "0") != "1":
        return {"items": []}
    
    # Get access token for current user
    user_id = get_current_user_id()
    user_uuid = uuid.UUID(user_id)
    
    credential = db.query(IntegrationCredential).filter(
        and_(
            IntegrationCredential.user_id == user_uuid,
            IntegrationCredential.provider == ProviderEnum.ALIBABA,
            IntegrationCredential.revoked_at.is_(None)
        )
    ).first()
    
    if not credential:
        return {"items": []}
    
    try:
        access_token = decrypt_data(credential.access_token)
        
        # Import our new search functions
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from connectors.alibaba_client import search_suppliers, map_supplier
        
        items = await search_suppliers(
            access_token, 
            payload.get("query", ""), 
            payload.get("filters") or {}
        )
        return {"items": [map_supplier(x) for x in items]}
        
    except Exception as e:
        logger.error(f"Alibaba supplier search failed: {str(e)}")
        return {"items": []}

@router.post("/search/products")
async def search_products_for_sla(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Search Alibaba products for SLA integration"""
    if os.getenv("FEATURE_ALIBABA", "0") != "1":
        return {"items": []}
    
    # Get access token for current user
    user_id = get_current_user_id()
    user_uuid = uuid.UUID(user_id)
    
    credential = db.query(IntegrationCredential).filter(
        and_(
            IntegrationCredential.user_id == user_uuid,
            IntegrationCredential.provider == ProviderEnum.ALIBABA,
            IntegrationCredential.revoked_at.is_(None)
        )
    ).first()
    
    if not credential:
        return {"items": []}
    
    try:
        access_token = decrypt_data(credential.access_token)
        
        # Import our new search functions
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from connectors.alibaba_client import search_products, map_product
        
        items = await search_products(
            access_token, 
            payload.get("query", ""), 
            payload.get("filters") or {}
        )
        return {"items": [map_product(x) for x in items]}
        
    except Exception as e:
        logger.error(f"Alibaba product search failed: {str(e)}")
        return {"items": []}