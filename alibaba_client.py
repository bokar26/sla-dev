import requests
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import logging
from dataclasses import dataclass
from config.alibaba_provider import get_b2b_cfg

logger = logging.getLogger(__name__)

@dataclass
class AlibabaOrder:
    order_id: str
    status: str
    buyer_company: str
    supplier_company: str
    currency: str
    total_amount: float
    created_at: datetime
    updated_at: datetime

@dataclass
class AlibabaShipment:
    order_id: str
    tracking_no: str
    carrier: str
    status: str
    last_event_at: datetime
    eta: Optional[datetime]
    events: List[Dict]

@dataclass
class AlibabaSupplier:
    supplier_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    rating: Optional[float]

class AlibabaAPIError(Exception):
    """Custom exception for Alibaba API errors"""
    pass

class AlibabaClient:
    def __init__(self, access_token: str, refresh_token: Optional[str], 
                 credential_row=None, db=None, provider_cfg=None):
        # Use provided config or fall back to server env
        if provider_cfg:
            self.cfg = provider_cfg
        else:
            self.cfg = get_b2b_cfg()
        
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.cred = credential_row
        self.db = db
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        })
    
    def _make_request(self, method: str, path: str, params: Dict = None, 
                     json_data: Dict = None, max_retries: int = 3) -> Dict:
        """Make HTTP request with retry logic"""
        url = f"{self.cfg.api_base.rstrip('/')}/{path.lstrip('/')}"
        
        for attempt in range(max_retries):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    params=params,
                    json=json_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 401:
                    # Token expired, try to refresh
                    if self.refresh_token and attempt == 0:
                        self._refresh_token()
                        continue
                    else:
                        raise AlibabaAPIError(f"Authentication failed: {response.text}")
                elif response.status_code == 429:
                    # Rate limited
                    wait_time = 2 ** attempt
                    logger.warning(f"Rate limited, waiting {wait_time}s")
                    time.sleep(wait_time)
                    continue
                elif response.status_code >= 500:
                    # Server error, retry
                    wait_time = 0.5 * (2 ** attempt)
                    logger.warning(f"Server error {response.status_code}, retrying in {wait_time}s")
                    time.sleep(wait_time)
                    continue
                else:
                    raise AlibabaAPIError(f"API error {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                if attempt == max_retries - 1:
                    raise AlibabaAPIError(f"Request failed: {str(e)}")
                wait_time = 0.5 * (2 ** attempt)
                time.sleep(wait_time)
        
        raise AlibabaAPIError("Max retries exceeded")
    
    def _refresh_token(self) -> None:
        """Refresh access token using refresh token"""
        if not self.refresh_token:
            raise AlibabaAPIError("No refresh token available")
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": self.refresh_token,
            "client_id": self.cfg.client_id,
            "client_secret": self.cfg.client_secret
        }
        
        response = requests.post(
            self.cfg.token_url,
            data=data,
            timeout=30
        )
        
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data["access_token"]
            if "refresh_token" in token_data:
                self.refresh_token = token_data["refresh_token"]
            
            # Update session headers
            self.session.headers.update({
                "Authorization": f"Bearer {self.access_token}"
            })
            
            # Update database if available
            if self.cred and self.db:
                from crypto import encrypt_data
                from datetime import datetime, timedelta
                
                expires_at = None
                if "expires_in" in token_data:
                    expires_at = datetime.utcnow() + timedelta(seconds=int(token_data["expires_in"]))
                
                self.cred.access_token = encrypt_data(self.access_token)
                if "refresh_token" in token_data:
                    self.cred.refresh_token = encrypt_data(self.refresh_token)
                if expires_at:
                    self.cred.expires_at = expires_at
                
                self.db.commit()
            
            logger.info("Token refreshed successfully")
        else:
            raise AlibabaAPIError(f"Token refresh failed: {response.text}")
    
    def list_orders(self, updated_after: Optional[datetime] = None, 
                   page_token: Optional[str] = None) -> Tuple[List[AlibabaOrder], Optional[str]]:
        """List orders with pagination"""
        params = {}
        if updated_after:
            params["updated_after"] = updated_after.isoformat()
        if page_token:
            params["page_token"] = page_token
        
        response = self._make_request("GET", "/v1/orders", params=params)
        
        orders = []
        for order_data in response.get("orders", []):
            orders.append(AlibabaOrder(
                order_id=order_data["orderId"],
                status=order_data["status"],
                buyer_company=order_data.get("buyer", {}).get("company", ""),
                supplier_company=order_data.get("supplier", {}).get("name", ""),
                currency=order_data.get("currency", "USD"),
                total_amount=float(order_data.get("total", 0)),
                created_at=datetime.fromisoformat(order_data["createdAt"].replace("Z", "+00:00")),
                updated_at=datetime.fromisoformat(order_data["updatedAt"].replace("Z", "+00:00"))
            ))
        
        return orders, response.get("next_page_token")
    
    def get_order(self, order_id: str) -> AlibabaOrder:
        """Get specific order details"""
        response = self._make_request("GET", f"/v1/orders/{order_id}")
        
        order_data = response["order"]
        return AlibabaOrder(
            order_id=order_data["orderId"],
            status=order_data["status"],
            buyer_company=order_data.get("buyer", {}).get("company", ""),
            supplier_company=order_data.get("supplier", {}).get("name", ""),
            currency=order_data.get("currency", "USD"),
            total_amount=float(order_data.get("total", 0)),
            created_at=datetime.fromisoformat(order_data["createdAt"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(order_data["updatedAt"].replace("Z", "+00:00"))
        )
    
    def list_shipments(self, order_id: str) -> List[AlibabaShipment]:
        """List shipments for an order"""
        response = self._make_request("GET", f"/v1/orders/{order_id}/shipments")
        
        shipments = []
        for shipment_data in response.get("shipments", []):
            shipments.append(AlibabaShipment(
                order_id=shipment_data["orderId"],
                tracking_no=shipment_data["trackingNo"],
                carrier=shipment_data.get("carrier", ""),
                status=shipment_data["status"],
                last_event_at=datetime.fromisoformat(shipment_data["lastEventAt"].replace("Z", "+00:00")),
                eta=datetime.fromisoformat(shipment_data["eta"].replace("Z", "+00:00")) if shipment_data.get("eta") else None,
                events=shipment_data.get("events", [])
            ))
        
        return shipments
    
    def get_shipment(self, tracking_no: str) -> AlibabaShipment:
        """Get specific shipment details"""
        response = self._make_request("GET", f"/v1/shipments/{tracking_no}")
        
        shipment_data = response["shipment"]
        return AlibabaShipment(
            order_id=shipment_data["orderId"],
            tracking_no=shipment_data["trackingNo"],
            carrier=shipment_data.get("carrier", ""),
            status=shipment_data["status"],
            last_event_at=datetime.fromisoformat(shipment_data["lastEventAt"].replace("Z", "+00:00")),
            eta=datetime.fromisoformat(shipment_data["eta"].replace("Z", "+00:00")) if shipment_data.get("eta") else None,
            events=shipment_data.get("events", [])
        )
    
    def list_suppliers(self, page_token: Optional[str] = None) -> Tuple[List[AlibabaSupplier], Optional[str]]:
        """List suppliers with pagination"""
        params = {}
        if page_token:
            params["page_token"] = page_token
        
        response = self._make_request("GET", "/v1/suppliers", params=params)
        
        suppliers = []
        for supplier_data in response.get("suppliers", []):
            suppliers.append(AlibabaSupplier(
                supplier_id=supplier_data["supplierId"],
                name=supplier_data["name"],
                email=supplier_data.get("email"),
                phone=supplier_data.get("phone"),
                location=supplier_data.get("location"),
                rating=float(supplier_data["rating"]) if supplier_data.get("rating") else None
            ))
        
        return suppliers, response.get("next_page_token")
    
    def get_supplier(self, supplier_id: str) -> AlibabaSupplier:
        """Get specific supplier details"""
        response = self._make_request("GET", f"/v1/suppliers/{supplier_id}")
        
        supplier_data = response["supplier"]
        return AlibabaSupplier(
            supplier_id=supplier_data["supplierId"],
            name=supplier_data["name"],
            email=supplier_data.get("email"),
            phone=supplier_data.get("phone"),
            location=supplier_data.get("location"),
            rating=float(supplier_data["rating"]) if supplier_data.get("rating") else None
        )

# Mock client for testing
class MockAlibabaClient(AlibabaClient):
    """Mock Alibaba client for testing"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.mock_data = self._load_mock_data()
    
    def _load_mock_data(self) -> Dict:
        """Load mock data for testing"""
        return {
            "orders": [
                {
                    "orderId": "8237465123",
                    "status": "SHIPPED",
                    "buyer": {"company": "Acme Imports"},
                    "supplier": {"name": "Zhang Garments Ltd"},
                    "currency": "USD",
                    "total": 15420.75,
                    "createdAt": "2025-08-30T12:33:00Z",
                    "updatedAt": "2025-09-01T15:22:00Z"
                },
                {
                    "orderId": "8237465124",
                    "status": "DELIVERED",
                    "buyer": {"company": "Global Trade Co"},
                    "supplier": {"name": "Shenzhen Electronics"},
                    "currency": "USD",
                    "total": 8750.00,
                    "createdAt": "2025-08-25T09:15:00Z",
                    "updatedAt": "2025-09-05T14:30:00Z"
                }
            ],
            "shipments": [
                {
                    "orderId": "8237465123",
                    "trackingNo": "SF123456789CN",
                    "carrier": "SF Express",
                    "status": "IN_TRANSIT",
                    "lastEventAt": "2025-09-10T08:01:00Z",
                    "eta": "2025-09-18T00:00:00Z",
                    "events": [
                        {"timestamp": "2025-09-10T08:01:00Z", "status": "IN_TRANSIT", "location": "Shanghai, China"},
                        {"timestamp": "2025-09-08T14:30:00Z", "status": "PICKED_UP", "location": "Shenzhen, China"}
                    ]
                }
            ],
            "suppliers": [
                {
                    "supplierId": "SUP-99871",
                    "name": "Zhang Garments Ltd",
                    "email": "sales@zhanggarments.cn",
                    "phone": "+86-21-5555-1122",
                    "location": "Shanghai, China",
                    "rating": 4.6
                },
                {
                    "supplierId": "SUP-99872",
                    "name": "Shenzhen Electronics",
                    "email": "info@shenzhen-electronics.com",
                    "phone": "+86-755-8888-9999",
                    "location": "Shenzhen, China",
                    "rating": 4.8
                }
            ]
        }
    
    def _make_request(self, method: str, path: str, params: Dict = None, 
                     json_data: Dict = None, max_retries: int = 3) -> Dict:
        """Mock API responses"""
        if path == "/v1/orders":
            return {
                "orders": self.mock_data["orders"],
                "next_page_token": None
            }
        elif path.startswith("/v1/orders/") and "/shipments" in path:
            return {
                "shipments": self.mock_data["shipments"]
            }
        elif path == "/v1/suppliers":
            return {
                "suppliers": self.mock_data["suppliers"],
                "next_page_token": None
            }
        else:
            return {"error": "Not implemented in mock"}
