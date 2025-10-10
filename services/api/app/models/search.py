from pydantic import BaseModel
from typing import Optional, Literal

class SearchRequest(BaseModel):
    q: Optional[str] = None
    country: Optional[str] = None
    product_type: Optional[str] = None
    quantity: Optional[int] = None
    customization: Optional[Literal["any","yes","no"]] = "any"
    min_score: Optional[int] = 80
    image_id: Optional[str] = None  # uploaded file handle if present
