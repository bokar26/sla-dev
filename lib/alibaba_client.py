"""
Real Alibaba API client with OAuth token management and API calls.
No mocks - requires real environment variables and API endpoints.
"""

import os
import time
import requests
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import IntegrationCredential, ProviderEnum
from crypto import decrypt_data, encrypt_data

logger = logging.getLogger(__name__)


class AlibabaClient:
    """Real Alibaba API client with OAuth token management."""
    
    def __init__(self, access_token: str, refresh_token: Optional[str], 
                 credential_row: IntegrationCredential, db: Session):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.credential_row = credential_row
        self.db = db
        
        # Load configuration from environment
        self.api_base = os.getenv("ALIBABA_API_BASE", "https://api.alibaba.com")
        self.token_base = os.getenv("ALIBABA_TOKEN_BASE", "https://oauth.alibabacloud.com")
        self.client_id = os.getenv("ALIBABA_CLIENT_ID")
        self.client_secret = os.getenv("ALIBABA_CLIENT_SECRET")
        
        if not self.client_id or not self.client_secret:
            raise ValueError("ALIBABA_CLIENT_ID and ALIBABA_CLIENT_SECRET must be set")
    
    async def ensure_token_fresh(self) -> None:
        """Ensure access token is fresh, refresh if needed."""
        if not self.credential_row.expires_at:
            return  # No expiration set, assume valid
        
        # Refresh if expires within 2 minutes
        refresh_threshold = datetime.utcnow() + timedelta(seconds=120)
        if self.credential_row.expires_at <= refresh_threshold:
            await self._refresh_token()
    
    async def _refresh_token(self) -> None:
        """Refresh access token using refresh token."""
        if not self.refresh_token:
            raise RuntimeError("No refresh token available")
        
        try:
            response = requests.post(
                f"{self.token_base}/v1/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": self.refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Token refresh failed: {response.status_code} {response.text}")
                raise RuntimeError(f"Token refresh failed: {response.status_code}")
            
            token_data = response.json()
            
            # Update credential row
            self.credential_row.access_token = encrypt_data(token_data["access_token"])
            if "refresh_token" in token_data:
                self.credential_row.refresh_token = encrypt_data(token_data["refresh_token"])
                self.refresh_token = token_data["refresh_token"]
            
            if "expires_in" in token_data:
                self.credential_row.expires_at = datetime.utcnow() + timedelta(
                    seconds=int(token_data["expires_in"])
                )
            
            self.access_token = token_data["access_token"]
            self.db.commit()
            
            logger.info("Successfully refreshed Alibaba access token")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Token refresh request failed: {str(e)}")
            raise RuntimeError(f"Token refresh request failed: {str(e)}")
    
    async def request(self, method: str, path: str, params: Optional[Dict] = None, 
                     json: Optional[Dict] = None, headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Make authenticated API request with automatic token refresh."""
        await self.ensure_token_fresh()
        
        url = f"{self.api_base}{path}"
        request_headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            **(headers or {})
        }
        
        # Retry logic with exponential backoff
        backoff_delays = [0.5, 1, 2, 4]
        
        for attempt, delay in enumerate(backoff_delays):
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    params=params,
                    json=json,
                    headers=request_headers,
                    timeout=30
                )
                
                # Success
                if response.status_code < 400:
                    return response.json()
                
                # Rate limited or server error - retry
                if response.status_code in [429, 500, 502, 503, 504]:
                    if attempt < len(backoff_delays) - 1:
                        logger.warning(f"API request failed with {response.status_code}, retrying in {delay}s")
                        time.sleep(delay)
                        continue
                
                # Client error or final retry failed
                logger.error(f"API request failed: {response.status_code} {response.text}")
                response.raise_for_status()
                
            except requests.exceptions.RequestException as e:
                if attempt < len(backoff_delays) - 1:
                    logger.warning(f"API request exception: {str(e)}, retrying in {delay}s")
                    time.sleep(delay)
                    continue
                raise
        
        raise RuntimeError("All retry attempts failed")
    
    async def list_orders(self, updated_after: Optional[datetime] = None, 
                         page_token: Optional[str] = None) -> Tuple[List[Dict], Optional[str]]:
        """List orders from Alibaba API."""
        params = {}
        if updated_after:
            params["updated_after"] = updated_after.isoformat()
        if page_token:
            params["page_token"] = page_token
        
        response = await self.request("GET", "/v1/orders", params=params)
        
        orders = response.get("orders", [])
        next_token = response.get("next_page_token")
        
        return orders, next_token
    
    async def list_shipments(self, order_external_id: str) -> List[Dict]:
        """List shipments for a specific order."""
        response = await self.request("GET", f"/v1/orders/{order_external_id}/shipments")
        return response.get("shipments", [])
    
    async def list_suppliers(self, page_token: Optional[str] = None) -> Tuple[List[Dict], Optional[str]]:
        """List suppliers from Alibaba API."""
        params = {}
        if page_token:
            params["page_token"] = page_token
        
        response = await self.request("GET", "/v1/suppliers", params=params)
        
        suppliers = response.get("suppliers", [])
        next_token = response.get("next_page_token")
        
        return suppliers, next_token
    
    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get specific order details."""
        return await self.request("GET", f"/v1/orders/{order_id}")
    
    async def get_shipment(self, shipment_id: str) -> Dict[str, Any]:
        """Get specific shipment details."""
        return await self.request("GET", f"/v1/shipments/{shipment_id}")
    
    async def get_supplier(self, supplier_id: str) -> Dict[str, Any]:
        """Get specific supplier details."""
        return await self.request("GET", f"/v1/suppliers/{supplier_id}")


def get_client_for_user(db: Session, user_uuid) -> AlibabaClient:
    """Get Alibaba client for a specific user."""
    cred = db.query(IntegrationCredential).filter(
        IntegrationCredential.user_id == user_uuid,
        IntegrationCredential.provider == ProviderEnum.ALIBABA,
        IntegrationCredential.revoked_at.is_(None)
    ).first()
    
    if not cred:
        raise RuntimeError("Alibaba integration not connected for user")
    
    return AlibabaClient(
        access_token=decrypt_data(cred.access_token),
        refresh_token=decrypt_data(cred.refresh_token) if cred.refresh_token else None,
        credential_row=cred,
        db=db
    )
