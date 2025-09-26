from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class ProductType(str, Enum):
    DENIM = "denim"
    KNITWEAR = "knitwear"
    WOVEN = "woven"
    ACTIVEWEAR = "activewear"
    LINGERIE = "lingerie"
    ACCESSORIES = "accessories"
    SWIMWEAR = "swimwear"
    FOOTWEAR = "footwear"
    OTHER = "other"

class MaterialType(str, Enum):
    COTTON = "cotton"
    POLYESTER = "polyester"
    DENIM = "denim"
    LEATHER = "leather"
    WOOL = "wool"
    SILK = "silk"
    SYNTHETIC = "synthetic"
    BLEND = "blend"

class CertificationType(str, Enum):
    GOTS = "GOTS"
    OEKO_TEX = "OEKO-TEX"
    ISO_9001 = "ISO 9001"
    WRAP = "WRAP"
    BSCI = "BSCI"
    SEDEX = "SEDEX"
    BLUESIGN = "BLUESIGN"
    C2C = "C2C"

class FactorySchema(BaseModel):
    """Schema for factory data validation and structure"""
    
    # Basic Information
    factory_name: str = Field(..., description="Name of the factory")
    country: str = Field(..., description="Country where factory is located")
    city: Optional[str] = Field(None, description="City where factory is located")
    
    # Product Information
    product_specialties: List[ProductType] = Field(default=[], description="Types of products the factory specializes in")
    materials_handled: List[MaterialType] = Field(default=[], description="Materials the factory can work with")
    
    # Capacity and Pricing
    min_order_quantity: Optional[int] = Field(None, description="Minimum order quantity")
    price_per_unit: Optional[Any] = Field(None, description="Price per unit (can be range or single value)")
    max_monthly_capacity: Optional[int] = Field(None, description="Maximum monthly production capacity")
    
    # Lead Times
    standard_lead_time: Optional[int] = Field(None, description="Standard production lead time in days")
    peak_season_lead_time: Optional[int] = Field(None, description="Lead time during peak season in days")
    sample_lead_time: Optional[int] = Field(None, description="Time required for samples in days")
    
    # Certifications and Quality
    certifications: List[CertificationType] = Field(default=[], description="Certifications held by the factory")
    quality_control_processes: Optional[str] = Field(None, description="Quality control processes")
    
    # Past Clients and Experience
    past_clients: List[str] = Field(default=[], description="Notable past clients")
    
    # Location and Logistics
    nearest_port: Optional[str] = Field(None, description="Nearest shipping port")
    
    # Labor and Operations
    labor_practices: Optional[str] = Field(None, description="Labor practices and standards")
    labor_cost: Optional[str] = Field(None, description="Labor cost information")
    number_of_workers: Optional[str] = Field(None, description="Number of workers")
    year_established: Optional[int] = Field(None, description="Year factory was established")
    factory_size: Optional[str] = Field(None, description="Factory size or capacity")
    
    # Communication and Customization
    languages_spoken: List[str] = Field(default=[], description="Languages the factory can communicate in")
    customization_capabilities: Optional[str] = Field(None, description="Customization capabilities")
    
    # Contact Information
    contact_name: Optional[str] = Field(None, description="Primary contact person")
    contact_email: Optional[str] = Field(None, description="Contact email")
    contact_phone: Optional[str] = Field(None, description="Contact phone number")
    
    # Additional Information
    notes: Optional[str] = Field(None, description="Additional notes or information")
    
    # Search and Matching Fields
    search_keywords: List[str] = Field(default=[], description="Keywords for search matching")
    product_aliases: Dict[str, List[str]] = Field(default={}, description="Product name aliases for matching")
    material_aliases: Dict[str, List[str]] = Field(default={}, description="Material name aliases for matching")
    
    class Config:
        use_enum_values = True

class SearchQuery(BaseModel):
    """Schema for search queries"""
    
    # Product Requirements
    product_types: List[ProductType] = Field(default=[], description="Types of products needed")
    materials: List[MaterialType] = Field(default=[], description="Materials required")
    
    # Location Preferences
    preferred_countries: List[str] = Field(default=[], description="Preferred manufacturing countries")
    excluded_countries: List[str] = Field(default=[], description="Countries to exclude")
    
    # Capacity and Budget
    min_quantity: Optional[int] = Field(None, description="Minimum quantity needed")
    max_quantity: Optional[int] = Field(None, description="Maximum quantity needed")
    budget_range: Optional[tuple] = Field(None, description="Budget range (min, max)")
    
    # Certifications
    required_certifications: List[CertificationType] = Field(default=[], description="Required certifications")
    preferred_certifications: List[CertificationType] = Field(default=[], description="Preferred certifications")
    
    # Timeline
    max_lead_time: Optional[int] = Field(None, description="Maximum acceptable lead time in days")
    
    # Past Experience
    preferred_clients: List[str] = Field(default=[], description="Preferred past clients (brands)")
    
    # Search Parameters
    search_text: str = Field(..., description="Raw search text from user")
    limit: int = Field(default=10, description="Maximum number of results to return")
    min_score: float = Field(default=0.7, description="Minimum matching score")

class SearchResult(BaseModel):
    """Schema for search results"""
    
    factory: Dict[str, Any] = Field(..., description="Factory information")
    score: float = Field(..., description="Matching score (0-1)")
    match_reasons: List[str] = Field(default=[], description="Reasons for the match")
    highlights: Dict[str, Any] = Field(default={}, description="Highlighted matching fields")

class SearchResponse(BaseModel):
    """Schema for search response"""
    
    results: List[SearchResult] = Field(default=[], description="Search results")
    total_found: int = Field(..., description="Total number of factories found")
    search_time: float = Field(..., description="Search execution time in seconds")
    query: SearchQuery = Field(..., description="Original search query")
