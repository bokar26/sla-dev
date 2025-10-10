# services/api/app/models/search_models.py
from typing import Optional, Literal, List, Dict, Any
from pydantic import BaseModel, Field

class UnifiedSearchRequest(BaseModel):
    q: str = Field(..., description="Free text query")
    country: Optional[str] = Field(None, description="Country name (exact match preferred)")
    product_type: Optional[str] = Field(None, description="Product type/category")
    quantity: Optional[int] = Field(None, description="Requested quantity")
    customization: Optional[Literal["any", "yes", "no"]] = Field("any")
    image_upload_id: Optional[str] = Field(None, description="Server file ID from image/doc upload")
    min_score: Optional[float] = Field(80, description="Minimum score threshold")

class UnifiedSearchResponse(BaseModel):
    items: List[Dict[str, Any]]
    meta: Optional[Dict[str, Any]] = None
