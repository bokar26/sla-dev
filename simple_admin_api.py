#!/usr/bin/env python3
"""
Simple Admin API for SLA Dashboard
Provides vendor/factory statistics without heavy dependencies
"""

from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sqlite3
import os
import jwt
import json
from datetime import datetime, timedelta
import secrets

app = FastAPI(title="SLA Admin API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DB_PATH = "sla.db"

# Admin authentication
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "admin@sla.ai,test@example.com").split(",")
ADMIN_DEV_PASSWORD = os.getenv("ADMIN_DEV_PASSWORD", "admin123")
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 12

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None

def create_admin_token(email: str) -> str:
    """Create JWT token for admin"""
    payload = {
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
        "type": "admin"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_admin_token(token: str) -> Optional[str]:
    """Verify admin JWT token and return email"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "admin":
            return None
        return payload.get("email")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_admin_from_token(request: Request) -> Optional[str]:
    """Get admin email from token in Authorization header or cookie"""
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        return verify_admin_token(token)
    
    # Check cookie
    token = request.cookies.get("sla_admin_token")
    if token:
        return verify_admin_token(token)
    
    return None

def require_admin(request: Request):
    """Dependency to require admin authentication"""
    admin_email = get_admin_from_token(request)
    if not admin_email:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    return admin_email

class CountryStats(BaseModel):
    country: str
    count: int

class IngestionStats(BaseModel):
    status: str
    count: int

class AdminMetrics(BaseModel):
    totals: Dict[str, int]
    byCountry: List[CountryStats]
    byIngestionStatus: List[IngestionStats]
    updatedAt: str

# SLA Search models
class SearchFilters(BaseModel):
    ingestedOnly: bool = True
    regions: Optional[List[str]] = None
    minMOQ: Optional[int] = None
    certs: Optional[List[str]] = None
    materials: Optional[List[str]] = None
    leadTimeDaysMax: Optional[int] = None

class SearchOptions(BaseModel):
    topK: int = 25
    filters: SearchFilters = SearchFilters()
    llm: Dict[str, Any] = {"enabled": True, "explanations": True, "maxTokens": 512}

class SearchResult(BaseModel):
    factoryId: str
    name: str
    region: str
    capabilities: List[str]
    certs: List[str]
    moq: int
    leadTimeDays: int
    score: float
    reasons: List[str]
    highlights: Dict[str, Any]
    explanation: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
    meta: Dict[str, Any]

def get_db_connection():
    """Get database connection"""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=500, detail="Database not found")
    return sqlite3.connect(DB_PATH)

def count_distinct_vendors() -> int:
    """Count distinct vendors using name column"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        SELECT COUNT(DISTINCT TRIM(LOWER(name))) as vendor_count
        FROM factories 
        WHERE COALESCE(NULLIF(TRIM(LOWER(name)), ''), '') <> ''
        """
        
        cursor.execute(query)
        result = cursor.fetchone()
        return int(result[0]) if result and result[0] is not None else 0
        
    except Exception as e:
        print(f"Error counting vendors: {e}")
        return 0
    finally:
        try:
            conn.close()
        except:
            pass

def count_total_factories() -> int:
    """Count total factory records"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT COUNT(*) as factory_count FROM factories"
        cursor.execute(query)
        result = cursor.fetchone()
        return int(result[0]) if result and result[0] is not None else 0
        
    except Exception as e:
        print(f"Error counting factories: {e}")
        return 0
    finally:
        try:
            conn.close()
        except:
            pass

def get_country_stats() -> List[CountryStats]:
    """Get factory counts by country"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        SELECT country, COUNT(*) as count 
        FROM factories 
        WHERE country IS NOT NULL 
        GROUP BY country 
        ORDER BY count DESC 
        LIMIT 10
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        return [CountryStats(country=row[0] or "Unknown", count=row[1]) for row in rows]
        
    except Exception as e:
        print(f"Error getting country stats: {e}")
        return []
    finally:
        try:
            conn.close()
        except:
            pass

def get_ingestion_stats() -> List[IngestionStats]:
    """Get factory counts by ingestion status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if ingestion_status column exists
        cursor.execute("PRAGMA table_info(factories)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'ingestion_status' in columns:
            query = """
            SELECT ingestion_status, COUNT(*) as count 
            FROM factories 
            WHERE ingestion_status IS NOT NULL 
            GROUP BY ingestion_status 
            ORDER BY count DESC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            return [IngestionStats(status=row[0] or "Unknown", count=row[1]) for row in rows]
        else:
            # Fallback: assume all are ready if no status column
            total = count_total_factories()
            return [IngestionStats(status="READY", count=total)]
        
    except Exception as e:
        print(f"Error getting ingestion stats: {e}")
        return []
    finally:
        try:
            conn.close()
        except:
            pass

def get_unique_countries() -> int:
    """Count unique countries"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT COUNT(DISTINCT country) FROM factories WHERE country IS NOT NULL"
        cursor.execute(query)
        result = cursor.fetchone()
        return int(result[0]) if result and result[0] is not None else 0
        
    except Exception as e:
        print(f"Error counting countries: {e}")
        return 0
    finally:
        try:
            conn.close()
        except:
            pass

@app.post("/api/auth/admin/login", response_model=LoginResponse)
def admin_login(login_data: LoginRequest):
    """Admin login endpoint"""
    # Check if email is in admin list
    if login_data.email not in ADMIN_EMAILS:
        return LoginResponse(
            success=False,
            message="Access denied. Email not authorized for admin access."
        )
    
    # Check password (in dev, use simple password check)
    if login_data.password != ADMIN_DEV_PASSWORD:
        return LoginResponse(
            success=False,
            message="Invalid password."
        )
    
    # Create token
    token = create_admin_token(login_data.email)
    
    response = JSONResponse(content={
        "success": True,
        "message": "Login successful",
        "token": token
    })
    
    # Set httpOnly cookie
    response.set_cookie(
        key="sla_admin_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=JWT_EXPIRATION_HOURS * 3600
    )
    
    return response

@app.post("/api/auth/admin/logout")
def admin_logout():
    """Admin logout endpoint"""
    response = JSONResponse(content={"success": True, "message": "Logged out successfully"})
    response.delete_cookie(key="sla_admin_token")
    return response

@app.get("/api/auth/admin/me")
def get_admin_info(admin_email: str = Depends(require_admin)):
    """Get current admin info"""
    return {"email": admin_email, "authenticated": True}

@app.get("/api/admin/stats")
def get_admin_stats(admin_email: str = Depends(require_admin)):
    """Get basic admin statistics (protected)"""
    try:
        vendors = count_distinct_vendors()
        total_factories = count_total_factories()
        countries = get_unique_countries()
        
        return {
            "vendor_count": vendors,
            "factory_count_total": total_factories,
            "countries": countries
        }
    except Exception as e:
        print(f"Error getting admin stats: {e}")
        return {
            "vendor_count": 0,
            "factory_count_total": 0,
            "countries": 0
        }

@app.get("/api/admin/metrics", response_model=AdminMetrics)
def get_admin_metrics(admin_email: str = Depends(require_admin)):
    """Get detailed admin metrics with charts data (protected)"""
    try:
        vendors = count_distinct_vendors()
        total_factories = count_total_factories()
        countries = get_unique_countries()
        
        by_country = get_country_stats()
        by_ingestion = get_ingestion_stats()
        
        return AdminMetrics(
            totals={
                "totalFactories": total_factories,
                "uniqueVendors": vendors,
                "countries": countries
            },
            byCountry=by_country,
            byIngestionStatus=by_ingestion,
            updatedAt=datetime.utcnow().isoformat() + "Z"
        )
        
    except Exception as e:
        print(f"Error getting admin metrics: {e}")
        return AdminMetrics(
            totals={"totalFactories": 0, "uniqueVendors": 0, "countries": 0},
            byCountry=[],
            byIngestionStatus=[],
            updatedAt=datetime.utcnow().isoformat() + "Z"
        )

@app.post("/api/sla/search", response_model=SearchResponse)
def sla_search(request: dict):
    """SLA Search endpoint - search factories with AI-powered ranking"""
    try:
        # Parse request body
        q = request.get('q', '')
        topK = request.get('topK', 25)
        filters = request.get('filters', {})
        llm = request.get('llm', {})
        
        if not q.strip():
            return SearchResponse(
                results=[],
                meta={"tookMs": 0, "retrievalK": 0, "reranked": False, "source": "empty_query"}
            )
        
        # Build SQL query with filters
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Base query - only get ingested factories
        base_query = """
        SELECT 
            id, name, country, city, 
            COALESCE(moq, 0) as moq,
            COALESCE(lead_time_days, 30) as lead_time_days,
            COALESCE(certifications, '[]') as certifications,
            COALESCE(rating, 0.5) as score
        FROM factories 
        WHERE name IS NOT NULL AND TRIM(name) != ''
        """
        
        # Add filters
        where_conditions = []
        params = []
        
        if filters.get('ingestedOnly', True):
            # Assume all factories are ingested for now
            pass
            
        if filters.get('regions'):
            regions = filters['regions']
            placeholders = ','.join(['?' for _ in regions])
            where_conditions.append(f"country IN ({placeholders})")
            params.extend(regions)
            
        if filters.get('minMOQ') is not None:
            where_conditions.append("COALESCE(moq, 0) >= ?")
            params.append(filters['minMOQ'])
            
        if filters.get('leadTimeDaysMax') is not None:
            where_conditions.append("COALESCE(lead_time_days, 30) <= ?")
            params.append(filters['leadTimeDaysMax'])
        
        if where_conditions:
            base_query += " AND " + " AND ".join(where_conditions)
        
        # Add ordering and limit
        base_query += f" ORDER BY score DESC, name ASC LIMIT {topK}"
        
        cursor.execute(base_query, params)
        rows = cursor.fetchall()
        
        # Convert to search results
        results = []
        for row in rows:
            factory_id, name, country, city, moq, lead_time, certs_json, score = row
            
            # Parse JSON certifications
            try:
                certs_list = json.loads(certs_json) if certs_json else []
            except:
                certs_list = []
            
            # Generate mock capabilities and materials based on query
            capabilities_list = []
            materials_list = []
            
            # Simple keyword matching for capabilities
            query_lower = q.lower()
            if any(word in query_lower for word in ['textile', 'fabric', 'clothing', 'apparel']):
                capabilities_list = ['Textile Manufacturing', 'Apparel Production']
            if any(word in query_lower for word in ['hoodie', 'sweatshirt', 'garment']):
                capabilities_list.extend(['Garment Manufacturing', 'Screen Printing'])
            if any(word in query_lower for word in ['cotton', 'polyester', 'fabric']):
                materials_list = ['Cotton', 'Polyester', 'Blended Fabrics']
            
            # Simple text matching for scoring (basic implementation)
            name_lower = name.lower()
            country_lower = country.lower() if country else ""
            
            # Calculate relevance score
            relevance_score = score
            if query_lower in name_lower:
                relevance_score += 0.2
            if query_lower in country_lower:
                relevance_score += 0.1
            if any(query_lower in cap.lower() for cap in capabilities_list):
                relevance_score += 0.1
            
            # Generate explanation
            explanation_parts = []
            if query_lower in name_lower:
                explanation_parts.append(f"Factory name matches '{q}'")
            if query_lower in country_lower:
                explanation_parts.append(f"Located in {country}")
            if capabilities_list:
                explanation_parts.append(f"Capabilities: {', '.join(capabilities_list[:3])}")
            
            explanation = ". ".join(explanation_parts) if explanation_parts else f"Factory in {country} with score {score:.2f}"
            
            result = SearchResult(
                factoryId=str(factory_id),
                name=name,
                region=f"{city}, {country}" if city else country,
                capabilities=capabilities_list,
                certs=certs_list,
                moq=moq,
                leadTimeDays=lead_time,
                score=min(relevance_score, 1.0),
                reasons=[f"Matches query: {q}"],
                highlights={
                    "materials": materials_list,
                    "certs": certs_list,
                    "region": [country]
                },
                explanation=explanation
            )
            results.append(result)
        
        # Sort by relevance score
        results.sort(key=lambda x: x.score, reverse=True)
        
        return SearchResponse(
            results=results,
            meta={
                "tookMs": 50,  # Simulated response time
                "retrievalK": len(results),
                "reranked": True,
                "source": "database"
            }
        )
        
    except Exception as e:
        print(f"Error in SLA search: {e}")
        return SearchResponse(
            results=[],
            meta={"tookMs": 0, "retrievalK": 0, "reranked": False, "source": "error"}
        )
    finally:
        try:
            conn.close()
        except:
            pass

@app.get("/api/vendors/saved")
def get_saved_vendors_list():
    """Get user's saved vendors"""
    try:
        # In production, this would query a proper database
        saved_vendors = getattr(save_vendor, '_saved_vendors', {})
        user_key = f"user_1"  # In real app, get from auth
        
        user_vendors = saved_vendors.get(user_key, {})
        
        # Convert to list format
        vendors_list = []
        for factory_id, vendor_data in user_vendors.items():
            vendors_list.append({
                "id": factory_id,
                "vendorId": factory_id,
                "name": vendor_data["name"],
                "country": vendor_data["country"],
                "vendor_type": vendor_data["vendor_type"],
                "source": vendor_data["source"],
                "saved_at": vendor_data["saved_at"]
            })
        
        return {
            "vendors": vendors_list,
            "total": len(vendors_list)
        }
        
    except Exception as e:
        print(f"Error getting saved vendors: {e}")
        return {"vendors": [], "total": 0}

@app.get("/api/vendors/quotes")
def get_saved_quotes():
    """Get user's saved quotes"""
    try:
        # In a real app, this would query the database for the user's org
        # For now, return mock data that matches the upload response format
        mock_quotes = [
            {
                "id": "quote_1",
                "vendorId": "vendor_1",
                "fileUrl": "/uploads/quotes/quote_1",
                "fileType": "pdf",
                "amount": 1500,
                "currency": "USD",
                "notes": "Sample quote from vendor",
                "createdAt": datetime.utcnow().isoformat()
            },
            {
                "id": "quote_2", 
                "vendorId": "vendor_2",
                "fileUrl": "/uploads/quotes/quote_2",
                "fileType": "png",
                "amount": 2000,
                "currency": "USD",
                "notes": "Another sample quote",
                "createdAt": datetime.utcnow().isoformat()
            }
        ]
        
        return {"items": mock_quotes}
        
    except Exception as e:
        print(f"Error getting saved quotes: {e}")
        return {"items": []}

@app.get("/api/vendors/{factory_id}")
def get_vendor_details(factory_id: str):
    """Get detailed factory information - alias for /api/factories/:id"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query factory details
        query = """
        SELECT 
            id, name, country, city, 
            COALESCE(moq, 0) as moq,
            COALESCE(lead_time_days, 30) as lead_time_days,
            COALESCE(certifications, '[]') as certifications,
            COALESCE(rating, 0.5) as score,
            COALESCE(contact_email, '') as contact_email,
            COALESCE(contact_phone, '') as contact_phone
        FROM factories 
        WHERE id = ? AND name IS NOT NULL AND TRIM(name) != ''
        """
        
        cursor.execute(query, (factory_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Factory not found")
        
        factory_id_db, name, country, city, moq, lead_time, certs_json, score, email, phone = row
        
        # Parse JSON certifications
        try:
            certs_list = json.loads(certs_json) if certs_json else []
        except:
            certs_list = []
        
        # Generate mock capabilities and materials based on factory name
        capabilities_list = []
        materials_list = []
        
        name_lower = name.lower()
        if any(word in name_lower for word in ['textile', 'fabric', 'clothing', 'apparel']):
            capabilities_list = ['Textile Manufacturing', 'Apparel Production']
        if any(word in name_lower for word in ['garment', 'clothing', 'wear']):
            capabilities_list.extend(['Garment Manufacturing', 'Screen Printing'])
        if any(word in name_lower for word in ['cotton', 'polyester', 'fabric']):
            materials_list = ['Cotton', 'Polyester', 'Blended Fabrics']
        
        # Build response
        response = {
            "factoryId": str(factory_id_db),
            "name": name,
            "region": f"{city}, {country}" if city else country,
            "city": city or "",
            "country": country or "",
            "capabilities": capabilities_list,
            "materials": materials_list,
            "certs": certs_list,
            "moq": moq,
            "leadTimeDays": lead_time,
            "score": score,
            "contactEmail": email,
            "contactPhone": phone,
            "ingestion_status": "READY"
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting vendor details: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        try:
            conn.close()
        except:
            pass

@app.post("/api/vendors/save")
def save_vendor(request: dict):
    """Save vendor to user's collection with type classification"""
    try:
        factory_id = request.get('factoryId')
        source = request.get('source', 'search')
        
        if not factory_id:
            raise HTTPException(status_code=400, detail="factoryId required")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1) Load canonical vendor/factory
        query = """
        SELECT 
            id, name, country, city, 
            COALESCE(moq, 0) as moq,
            COALESCE(lead_time_days, 30) as lead_time_days,
            COALESCE(certifications, '[]') as certifications,
            COALESCE(rating, 0.5) as score,
            COALESCE(contact_email, '') as contact_email,
            COALESCE(contact_phone, '') as contact_phone
        FROM factories 
        WHERE id = ? AND name IS NOT NULL AND TRIM(name) != ''
        """
        
        cursor.execute(query, (factory_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Factory not found")
        
        factory_id_db, name, country, city, moq, lead_time, certs_json, score, email, phone = row
        
        # Parse JSON certifications
        try:
            certs_list = json.loads(certs_json) if certs_json else []
        except:
            certs_list = []
        
        # 2) Determine vendor_type using heuristics
        vendor_type = "supplier"  # default
        
        # Check for manufacturing capabilities in name and certs
        name_lower = name.lower()
        certs_text = " ".join(certs_list).lower()
        
        # Manufacturing indicators
        manufacturing_terms = [
            'cut', 'sew', 'knit', 'dye', 'print', 'assembly', 'production', 
            'factory', 'manufactur', 'garment', 'textile', 'apparel'
        ]
        
        # Trading indicators  
        trading_terms = [
            'trading', 'agent', 'sourcing', 'broker', 'buying office', 
            'import', 'export', 'distributor'
        ]
        
        manuf_hit = any(term in name_lower or term in certs_text for term in manufacturing_terms)
        trade_hit = any(term in name_lower or term in certs_text for term in trading_terms)
        
        if manuf_hit and not trade_hit:
            vendor_type = "factory"
        elif not manuf_hit and trade_hit:
            vendor_type = "supplier"
        elif manuf_hit and trade_hit:
            vendor_type = "factory"  # prefer factory if both detected
        
        # 3) For now, we'll use a simple in-memory store
        # In production, this would be a proper database table
        # Check if already saved (idempotent)
        saved_vendors = getattr(save_vendor, '_saved_vendors', {})
        user_key = f"user_1"  # In real app, get from auth
        
        if factory_id in saved_vendors.get(user_key, {}):
            return {
                "saved": True,
                "vendorId": factory_id,
                "vendor_type": saved_vendors[user_key][factory_id]["vendor_type"],
                "alreadySaved": True
            }
        
        # Save the vendor
        if user_key not in saved_vendors:
            saved_vendors[user_key] = {}
            
        saved_vendors[user_key][factory_id] = {
            "vendorId": factory_id,
            "vendor_type": vendor_type,
            "name": name,
            "country": country,
            "source": source,
            "saved_at": datetime.utcnow().isoformat()
        }
        
        # Store in function attribute (in production, use database)
        save_vendor._saved_vendors = saved_vendors
        
        return {
            "saved": True,
            "vendorId": factory_id,
            "vendor_type": vendor_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving vendor: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        try:
            conn.close()
        except:
            pass

@app.post("/api/factories/save")
def save_factory_alias(request: dict):
    """Alias for /api/vendors/save - forwards to same logic"""
    return save_vendor(request)

@app.get("/api/vendors/saved")
def get_saved_vendors_list():
    """Get user's saved vendors"""
    try:
        # In production, this would query a proper database
        saved_vendors = getattr(save_vendor, '_saved_vendors', {})
        user_key = f"user_1"  # In real app, get from auth
        
        user_vendors = saved_vendors.get(user_key, {})
        
        # Convert to list format
        vendors_list = []
        for factory_id, vendor_data in user_vendors.items():
            vendors_list.append({
                "id": factory_id,
                "vendorId": factory_id,
                "name": vendor_data["name"],
                "country": vendor_data["country"],
                "vendor_type": vendor_data["vendor_type"],
                "source": vendor_data["source"],
                "saved_at": vendor_data["saved_at"]
            })
        
        return {
            "vendors": vendors_list,
            "total": len(vendors_list)
        }
        
    except Exception as e:
        print(f"Error getting saved vendors: {e}")
        return {"vendors": [], "total": 0}

@app.get("/api/metrics/supply_center")
def get_supply_center_metrics():
    """Stub endpoint for supply center metrics - stops 404 spam"""
    return {
        "timeSavedHours": 0,
        "costSavedUsd": 0,
        "updatedAt": datetime.utcnow().isoformat()
    }

@app.get("/api/vendors/saved/ids")
def get_saved_vendor_ids():
    """Get user's saved vendor IDs for cross-checking"""
    try:
        saved_vendors = getattr(save_vendor, '_saved_vendors', {})
        user_key = f"user_1"  # In real app, get from auth
        
        user_vendors = saved_vendors.get(user_key, {})
        ids = list(user_vendors.keys())
        
        return {"ids": ids}
        
    except Exception as e:
        print(f"Error getting saved vendor IDs: {e}")
        return {"ids": []}

@app.post("/api/uploads/vendors")
async def upload_vendors(request: Request):
    """Upload and ingest vendors from CSV/Excel files"""
    try:
        # Get form data
        form = await request.form()
        files = form.getlist("files")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # For now, return mock data - in production, implement CSV/Excel parsing
        # and vendor ingestion with deduplication and classification
        created_vendors = []
        deduped_count = 0
        
        # Mock response for development
        for i, file in enumerate(files[:3]):  # Limit to 3 for demo
            vendor_id = f"uploaded_{i+1}"
            created_vendors.append({
                "vendorId": vendor_id,
                "name": f"Uploaded Vendor {i+1}",
                "country": "China",
                "vendor_type": "factory",
                "source": "upload",
                "saved_at": datetime.utcnow().isoformat()
            })
        
        return {
            "created": created_vendors,
            "deduped": deduped_count,
            "message": f"Processed {len(files)} files"
        }
        
    except Exception as e:
        print(f"Error uploading vendors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/uploads/quotes")
async def upload_quotes(request: Request):
    """Upload quotes (PDF/PNG files)"""
    try:
        # Get form data
        form = await request.form()
        files = form.getlist("files")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # For now, return mock data - in production, implement file storage
        # and quote metadata extraction
        created_quotes = []
        
        # Mock response for development
        for i, file in enumerate(files):
            quote_id = f"quote_{i+1}"
            created_quotes.append({
                "id": quote_id,
                "fileUrl": f"/uploads/quotes/{quote_id}",
                "fileType": "pdf" if file.filename.endswith('.pdf') else "png",
                "vendorId": f"vendor_{i+1}",  # Would be determined by OCR/matching
                "amount": 1000 + (i * 500),
                "currency": "USD",
                "createdAt": datetime.utcnow().isoformat()
            })
        
        return {
            "created": created_quotes,
            "message": f"Uploaded {len(files)} quotes"
        }
        
    except Exception as e:
        print(f"Error uploading quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Aliases for backward compatibility
@app.get("/api/quotes/saved")
def alias_quotes_saved():
    """Alias for /api/vendors/quotes"""
    return get_saved_quotes()

@app.get("/api/saved/quotes")
def alias_saved_quotes():
    """Alias for /api/vendors/quotes"""
    return get_saved_quotes()

@app.get("/api/clients/saved")
def get_saved_clients():
    """Get user's saved clients"""
    try:
        # In a real app, this would query the database for the user's org
        # For now, return mock data
        mock_clients = [
            {
                "id": "client_1",
                "company": "Acme Corp",
                "name": "Acme Corporation",
                "contact": "John Smith",
                "email": "john@acme.com",
                "phone": "+1-555-0123",
                "country": "USA",
                "city": "New York",
                "tags": ["enterprise", "tech"],
                "notes": "Primary client for Q1",
                "createdAt": datetime.utcnow().isoformat()
            },
            {
                "id": "client_2",
                "company": "Global Industries",
                "name": "Global Industries Ltd",
                "contact": "Sarah Johnson",
                "email": "sarah@global.com",
                "phone": "+44-20-7946-0958",
                "country": "UK",
                "city": "London",
                "tags": ["manufacturing", "international"],
                "notes": "Long-term partnership",
                "createdAt": datetime.utcnow().isoformat()
            }
        ]
        
        return {"items": mock_clients}
        
    except Exception as e:
        print(f"Error getting saved clients: {e}")
        return {"items": []}

@app.post("/api/uploads/clients/sheet")
async def upload_clients_sheet(request: Request):
    """Upload and ingest clients from CSV/Excel files"""
    try:
        # Get form data
        form = await request.form()
        files = form.getlist("files")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # For now, return mock data - in production, implement CSV/Excel parsing
        # and client ingestion with deduplication
        created_clients = []
        deduped_count = 0
        
        # Mock response for development
        for i, file in enumerate(files[:3]):  # Limit to 3 for demo
            client_id = f"uploaded_client_{i+1}"
            created_clients.append({
                "id": client_id,
                "company": f"Uploaded Company {i+1}",
                "name": f"Uploaded Company {i+1}",
                "contact": f"Contact Person {i+1}",
                "email": f"contact{i+1}@uploaded.com",
                "phone": f"+1-555-{1000+i}",
                "country": "USA",
                "city": "San Francisco",
                "tags": ["uploaded", "spreadsheet"],
                "notes": f"Imported from {file.filename}",
                "createdAt": datetime.utcnow().isoformat()
            })
        
        return {
            "created": created_clients,
            "deduped": deduped_count,
            "message": f"Processed {len(files)} files"
        }
        
    except Exception as e:
        print(f"Error uploading client sheets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/uploads/clients/files")
async def upload_client_files(request: Request):
    """Upload client files (PDF/PNG/JPG)"""
    try:
        # Get form data
        form = await request.form()
        files = form.getlist("files")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # For now, return mock data - in production, implement file storage
        # and client metadata extraction
        created_clients = []
        
        # Mock response for development
        for i, file in enumerate(files):
            client_id = f"file_client_{i+1}"
            created_clients.append({
                "id": client_id,
                "company": f"File Company {i+1}",
                "name": f"File Company {i+1}",
                "contact": f"File Contact {i+1}",
                "email": f"file{i+1}@company.com",
                "phone": f"+1-555-{2000+i}",
                "country": "Canada",
                "city": "Toronto",
                "tags": ["uploaded", "files"],
                "notes": f"Extracted from {file.filename}",
                "createdAt": datetime.utcnow().isoformat()
            })
        
        return {
            "created": created_clients,
            "message": f"Uploaded {len(files)} files"
        }
        
    except Exception as e:
        print(f"Error uploading client files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clients")
async def create_client(request: Request):
    """Create a new client manually"""
    try:
        body = await request.json()
        
        # For now, return mock data - in production, implement client creation
        # with validation and deduplication
        client_id = f"manual_client_{int(datetime.utcnow().timestamp())}"
        
        client = {
            "id": client_id,
            "company": body.get("company", ""),
            "name": body.get("name", body.get("company", "")),
            "contact": body.get("contact", ""),
            "email": body.get("email", ""),
            "phone": body.get("phone", ""),
            "address": body.get("address", ""),
            "city": body.get("city", ""),
            "state": body.get("state", ""),
            "country": body.get("country", ""),
            "industry": body.get("industry", ""),
            "tags": body.get("tags", "").split(",") if body.get("tags") else [],
            "payment_terms": body.get("payment_terms", ""),
            "notes": body.get("notes", ""),
            "createdAt": datetime.utcnow().isoformat()
        }
        
        return {"client": client}
        
    except Exception as e:
        print(f"Error creating client: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Orders endpoints
@app.get("/api/orders")
def get_orders():
    """Get user's orders"""
    try:
        mock_orders = [
            {
                "id": "order_1",
                "orderNo": "PO-2024-001",
                "client": "TechCorp Inc.",
                "vendor": "Shenzhen Electronics Co.",
                "sku": "SC-001",
                "quantity": 1000,
                "unitPrice": 8.50,
                "currency": "USD",
                "incoterm": "FOB",
                "expectedShipDate": "2024-02-15",
                "status": "Open",
                "notes": "Smartphone cases order",
                "createdAt": datetime.utcnow().isoformat()
            },
            {
                "id": "order_2",
                "orderNo": "PO-2024-002", 
                "client": "Fashion Forward",
                "vendor": "Bangkok Textiles Ltd.",
                "sku": "TS-001",
                "quantity": 500,
                "unitPrice": 5.00,
                "currency": "USD",
                "incoterm": "CIF",
                "expectedShipDate": "2024-02-20",
                "status": "In Progress",
                "notes": "Cotton t-shirts order",
                "createdAt": datetime.utcnow().isoformat()
            }
        ]
        return {"items": mock_orders}
    except Exception as e:
        print(f"Error getting orders: {e}")
        return {"items": []}

@app.post("/api/uploads/orders/sheet")
async def upload_orders_sheet(request: Request):
    """Upload and ingest orders from CSV/Excel files"""
    try:
        form = await request.form()
        files = form.getlist("files")
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        created_orders = []
        for i, file in enumerate(files[:3]):
            order_id = f"uploaded_order_{i+1}"
            created_orders.append({
                "id": order_id,
                "orderNo": f"PO-2024-{100+i+1}",
                "client": f"Uploaded Client {i+1}",
                "vendor": f"Uploaded Vendor {i+1}",
                "sku": f"SKU-{i+1}",
                "quantity": 100 + i * 50,
                "unitPrice": 10.0 + i * 2.0,
                "currency": "USD",
                "incoterm": "FOB",
                "expectedShipDate": "2024-03-01",
                "status": "Open",
                "notes": f"Imported from {file.filename}",
                "createdAt": datetime.utcnow().isoformat()
            })
        return {
            "created": created_orders,
            "message": f"Processed {len(files)} files"
        }
    except Exception as e:
        print(f"Error uploading order sheets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/uploads/orders/files")
async def upload_order_files(request: Request):
    """Upload order files (PDF/PNG/JPG)"""
    try:
        form = await request.form()
        files = form.getlist("files")
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        created_orders = []
        for i, file in enumerate(files):
            order_id = f"file_order_{i+1}"
            created_orders.append({
                "id": order_id,
                "orderNo": f"PO-2024-{200+i+1}",
                "client": f"File Client {i+1}",
                "vendor": f"File Vendor {i+1}",
                "sku": f"FILE-{i+1}",
                "quantity": 200 + i * 100,
                "unitPrice": 15.0 + i * 3.0,
                "currency": "USD",
                "incoterm": "CIF",
                "expectedShipDate": "2024-03-15",
                "status": "Open",
                "notes": f"Extracted from {file.filename}",
                "createdAt": datetime.utcnow().isoformat()
            })
        return {
            "created": created_orders,
            "message": f"Uploaded {len(files)} files"
        }
    except Exception as e:
        print(f"Error uploading order files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orders")
async def create_order(request: Request):
    """Create a new order manually"""
    try:
        body = await request.json()
        order_id = f"manual_order_{int(datetime.utcnow().timestamp())}"
        order = {
            "id": order_id,
            "orderNo": body.get("orderNo", ""),
            "client": body.get("client", ""),
            "vendor": body.get("vendor", ""),
            "sku": body.get("sku", ""),
            "quantity": int(body.get("quantity", 0)) if body.get("quantity") else 0,
            "unitPrice": float(body.get("unitPrice", 0)) if body.get("unitPrice") else 0,
            "currency": body.get("currency", "USD"),
            "incoterm": body.get("incoterm", ""),
            "expectedShipDate": body.get("expectedShipDate", ""),
            "status": body.get("status", "Open"),
            "notes": body.get("notes", ""),
            "createdAt": datetime.utcnow().isoformat()
        }
        return {"order": order}
    except Exception as e:
        print(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Transactions endpoints
@app.get("/api/transactions")
def get_transactions():
    """Get user's transactions"""
    try:
        mock_transactions = [
            {
                "id": "tx_1",
                "date": "2024-01-15",
                "vendor": "Shenzhen Electronics Co.",
                "client": "TechCorp Inc.",
                "amount": 8500.00,
                "currency": "USD",
                "category": "COGS",
                "method": "Wire",
                "reference": "PO-2024-001",
                "notes": "Payment for smartphone cases order",
                "createdAt": datetime.utcnow().isoformat()
            },
            {
                "id": "tx_2",
                "date": "2024-01-20",
                "vendor": "Bangkok Textiles Ltd.",
                "client": "Fashion Forward",
                "amount": 2500.00,
                "currency": "USD",
                "category": "COGS",
                "method": "Wire",
                "reference": "PO-2024-002",
                "notes": "Payment for cotton t-shirts order",
                "createdAt": datetime.utcnow().isoformat()
            }
        ]
        return {"items": mock_transactions}
    except Exception as e:
        print(f"Error getting transactions: {e}")
        return {"items": []}

@app.post("/api/uploads/transactions/sheet")
async def upload_transactions_sheet(request: Request):
    """Upload and ingest transactions from CSV/Excel files"""
    try:
        form = await request.form()
        files = form.getlist("files")
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        created_transactions = []
        for i, file in enumerate(files[:3]):
            tx_id = f"uploaded_tx_{i+1}"
            created_transactions.append({
                "id": tx_id,
                "date": "2024-02-01",
                "vendor": f"Uploaded Vendor {i+1}",
                "client": f"Uploaded Client {i+1}",
                "amount": 1000.0 + i * 500.0,
                "currency": "USD",
                "category": "COGS",
                "method": "Wire",
                "reference": f"REF-{i+1}",
                "notes": f"Imported from {file.filename}",
                "createdAt": datetime.utcnow().isoformat()
            })
        return {
            "created": created_transactions,
            "message": f"Processed {len(files)} files"
        }
    except Exception as e:
        print(f"Error uploading transaction sheets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/uploads/transactions/files")
async def upload_transaction_files(request: Request):
    """Upload transaction files (PDF/PNG/JPG)"""
    try:
        form = await request.form()
        files = form.getlist("files")
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        created_transactions = []
        for i, file in enumerate(files):
            tx_id = f"file_tx_{i+1}"
            created_transactions.append({
                "id": tx_id,
                "date": "2024-02-15",
                "vendor": f"File Vendor {i+1}",
                "client": f"File Client {i+1}",
                "amount": 2000.0 + i * 1000.0,
                "currency": "USD",
                "category": "COGS",
                "method": "Wire",
                "reference": f"FILE-{i+1}",
                "notes": f"Extracted from {file.filename}",
                "createdAt": datetime.utcnow().isoformat()
            })
        return {
            "created": created_transactions,
            "message": f"Uploaded {len(files)} files"
        }
    except Exception as e:
        print(f"Error uploading transaction files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transactions")
async def create_transaction(request: Request):
    """Create a new transaction manually"""
    try:
        body = await request.json()
        tx_id = f"manual_tx_{int(datetime.utcnow().timestamp())}"
        transaction = {
            "id": tx_id,
            "date": body.get("date", ""),
            "vendor": body.get("vendor", ""),
            "client": body.get("client", ""),
            "amount": float(body.get("amount", 0)) if body.get("amount") else 0,
            "currency": body.get("currency", "USD"),
            "category": body.get("category", "COGS"),
            "method": body.get("method", "Wire"),
            "reference": body.get("reference", ""),
            "notes": body.get("notes", ""),
            "createdAt": datetime.utcnow().isoformat()
        }
        return {"transaction": transaction}
    except Exception as e:
        print(f"Error creating transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Fulfillment endpoints
@app.post("/api/fulfillment/plan-route")
async def plan_route(request: Request):
    """Plan shipping routes for fulfillment"""
    try:
        body = await request.json()
        mode = body.get("mode", "manual")
        shipment = body.get("shipment", {})
        
        # Mock route recommendations
        mock_routes = [
            {
                "id": "route_1",
                "carrier": "DHL Express",
                "service": "International Express",
                "cost": 450.0,
                "currency": "USD",
                "eta": 3,
                "reliability": 0.95,
                "emissions": 12.5,
                "legs": [
                    {
                        "from": "Shenzhen, China",
                        "to": "Los Angeles, USA",
                        "mode": "air",
                        "carrier": "DHL Express",
                        "cost": 450.0,
                        "eta": 3
                    }
                ],
                "explanation": "Fast air freight with high reliability"
            },
            {
                "id": "route_2",
                "carrier": "FedEx",
                "service": "International Priority",
                "cost": 380.0,
                "currency": "USD",
                "eta": 4,
                "reliability": 0.92,
                "emissions": 11.8,
                "legs": [
                    {
                        "from": "Shenzhen, China",
                        "to": "Los Angeles, USA",
                        "mode": "air",
                        "carrier": "FedEx",
                        "cost": 380.0,
                        "eta": 4
                    }
                ],
                "explanation": "Cost-effective air freight option"
            }
        ]
        
        return {
            "routes": mock_routes,
            "meta": {
                "tookMs": 150,
                "totalRoutes": len(mock_routes),
                "source": "mock_algorithm"
            }
        }
    except Exception as e:
        print(f"Error planning route: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoints
@app.delete("/api/admin/reset", summary="Factory reset current org")
def wipe_org_data(
    x_confirm: str | None = Header(default=None, alias="X-Confirm")
):
    """Wipe all org data - DANGER ZONE"""
    # Safety check
    if x_confirm != "CONFIRM-ORG-WIPE":
        raise HTTPException(status_code=400, detail="Missing X-Confirm: CONFIRM-ORG-WIPE")
    
    # For now, return a mock response since we don't have a real database
    # In a real implementation, you would:
    # 1. Get the current user's org_id from auth
    # 2. Delete all records scoped to that org_id
    # 3. Delete associated files from storage
    # 4. Return actual counts
    
    mock_deleted_counts = {
        "saved_vendors": 0,
        "vendors": 0,
        "factories": 0,
        "quotes": 0,
        "quote_files": 0,
        "clients": 0,
        "orders": 0,
        "order_items": 0,
        "transactions": 0,
        "shipments": 0,
        "fulfillment_routes": 0,
        "integration_accounts": 0,
        "saved_searches": 0,
        "metrics_cache": 0,
        "uploaded_files": 0
    }
    
    return {
        "ok": True,
        "org_id": "current_org",  # Would be real org_id from auth
        "deleted": mock_deleted_counts,
        "deleted_file_keys": 0,
        "timestamp": datetime.utcnow().isoformat()
    }

# Demo requests endpoint
@app.post("/api/demo-requests")
async def create_demo_request(request: Request):
    """Create a demo request"""
    try:
        body = await request.json()
        
        # Validate required fields
        if not body.get("email"):
            raise HTTPException(status_code=400, detail="Email is required")
        if not body.get("target"):
            raise HTTPException(status_code=400, detail="Target is required")
        
        # Validate target value
        valid_targets = ["shipping_savings", "orders_savings", "improve_esg", "speed_sourcing", "other"]
        if body.get("target") not in valid_targets:
            raise HTTPException(status_code=400, detail="Invalid target value")
        
        # If target is "other", target_other should be provided
        if body.get("target") == "other" and not body.get("target_other"):
            raise HTTPException(status_code=400, detail="target_other is required when target is 'other'")
        
        # Log the demo request (in a real app, save to database)
        print(f"Demo request received: {body}")
        
        return {
            "ok": True,
            "message": "Demo request submitted successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Error creating demo request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Quote estimate endpoint
@app.post("/api/quotes/estimate")
async def estimate_quote(request: Request):
    """Compute data-driven estimate using the SLA cost engine"""
    try:
        body = await request.json()
        
        # Validate required fields
        if not body.get("vendor_id"):
            raise HTTPException(status_code=400, detail="vendor_id is required")
        if not body.get("product"):
            raise HTTPException(status_code=400, detail="product is required")
        if not body.get("quantity"):
            raise HTTPException(status_code=400, detail="quantity is required")
        if not body.get("destination"):
            raise HTTPException(status_code=400, detail="destination is required")
        
        # Mock cost engine calculation (replace with real implementation)
        vendor_id = body["vendor_id"]
        product = body["product"]
        quantity = body["quantity"]
        destination = body["destination"]
        incoterm = body.get("incoterm", "FOB")
        freight_type = body.get("freight_type", "sea")
        speed = body.get("speed", "standard")
        
        # Simulate cost calculation based on inputs
        base_material_cost = 1.50  # Base cost per unit
        labor_multiplier = 1.2 if destination.get("country") == "US" else 1.0
        overhead_rate = 0.15
        duties_rate = 0.08 if destination.get("country") == "US" else 0.05
        
        # Calculate costs
        material_cost = base_material_cost * quantity
        labor_cost = material_cost * 0.3 * labor_multiplier
        overhead_cost = (material_cost + labor_cost) * overhead_rate
        duties_cost = (material_cost + labor_cost + overhead_cost) * duties_rate
        
        # Logistics cost (simplified)
        if freight_type == "air":
            logistics_cost = quantity * 0.5
        else:  # sea
            logistics_cost = quantity * 0.1
        
        total_cost = material_cost + labor_cost + overhead_cost + duties_cost + logistics_cost
        unit_cost = total_cost / quantity
        
        # Create breakdown
        breakdown = [
            {"label": "Materials", "amount": material_cost, "pct": material_cost / total_cost},
            {"label": "Labor", "amount": labor_cost, "pct": labor_cost / total_cost},
            {"label": "Overhead", "amount": overhead_cost, "pct": overhead_cost / total_cost},
            {"label": "Duties & Taxes", "amount": duties_cost, "pct": duties_cost / total_cost},
            {"label": "Logistics", "amount": logistics_cost, "pct": logistics_cost / total_cost}
        ]
        
        # Create assumptions
        assumptions = {
            "moq": 500,
            "lead_time_days": 21 if freight_type == "sea" else 7,
            "duties_rate": duties_rate,
            "route": f"CN→{destination.get('country', 'US')}",
            "weight_kg": quantity * 0.5,  # Assume 0.5kg per unit
            "dims": f"{quantity * 0.1} CBM"
        }
        
        # Create saved quote record
        quote_id = f"estimate_{int(datetime.utcnow().timestamp())}"
        
        # Mock response
        return {
            "quote_id": quote_id,
            "currency": "USD",
            "unit_cost": round(unit_cost, 2),
            "total_cost": round(total_cost, 2),
            "breakdown": breakdown,
            "assumptions": assumptions
        }
        
    except Exception as e:
        print(f"Error estimating quote: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Negotiation tips endpoint
@app.get("/api/quotes/{quote_id}/negotiation-tips")
def get_negotiation_tips(quote_id: str):
    """Get negotiation tips based on cost breakdown"""
    try:
        # Mock tips based on quote ID (in real app, fetch from database)
        tips = [
            "Materials represent 60% of total cost - consider alternative materials or bulk discounts",
            "Labor costs are moderate - negotiate payment terms or volume commitments",
            "Duties are 8% - explore free trade agreements or duty drawback programs",
            "Logistics costs are low - consider faster shipping for premium products",
            "MOQ is 500 units - negotiate tiered pricing for larger quantities"
        ]
        
        return {"tips": tips}
        
    except Exception as e:
        print(f"Error getting negotiation tips: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
