from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel
import json
import os
from datetime import datetime, timedelta
from rapidfuzz import process, fuzz
import ollama
import pandas as pd
import difflib
import re
from ingest import FactoryDataIngest
from portfolio import router as portfolio_router
# from alibaba_api import router as alibaba_router  # Temporarily disabled due to import issues
from routes.alibaba import router as alibaba_routes
from routes.algo_outputs import router as algo_outputs_router
from routes.integrations_alibaba import router as integrations_alibaba_router
# Removed goals_stub - using real goals API
from database import init_db
from admin_routers import admin_router
from auth_router import auth_router
from sla_ai_components.api.ranking import router as ranking_router
from sla_ai_components.api.cost import router as cost_router
from sla_ai_components.api.logistics import router as logistics_router
from sla_ai_components.api.regulations import router as regulations_router
from sla_ai_components.api.upload import router as ingest_upload_router
from sla_ai_components.api.preview import router as ingest_preview_router
from sla_ai_components.api.commit import router as ingest_commit_router
from sla_ai_components.api.rescan import router as ingest_rescan_router
from sla_ai_components.api.ai_search import router as ai_search_router
from sla_ai_components.api.ai_fulfillment import router as ai_fulfillment_router
from sla_ai_components.api.suggestions import router as suggestions_router
from sla_ai_components.api.admin_stats import router as admin_stats_router
from sla_ai_components.api.ingest_report import router as ingest_report_router
from sla_ai_components.api.suppliers_summary import router as suppliers_summary_router
from sla_ai_components.api.saved_quotes import router as saved_quotes_router
from sla_ai_components.api.factories import router as factories_router
from sla_ai_components.api.saved import router as saved_router
from sla_ai_components.api.quotes import router as quotes_router
from sla_ai_components.api.supply_metrics import router as supply_metrics_router
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import UserGoal, Factory
import math
from connectors.alibaba_client import dedup_and_merge, rerank_factories, search_suppliers, map_supplier
import uuid
import shutil
import tempfile
from threading import Thread
from sla_ai_components.ingest.daemon import bootstrap_scan, watch_loop
from sla_ai_components.suggestions.scheduler import start_scheduler
import base64
import time
import asyncio
import traceback

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv not installed, continue without it
    pass

# Single source of truth for API prefix
API_PREFIX = os.getenv("API_PREFIX", "/api")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SLA - Simple Logistics Assistant API", 
    version="1.0.0",
    redirect_slashes=True  # Handle /path <-> /path/ gracefully
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add trusted host middleware for production
if os.getenv("NODE_ENV") == "production":
    allowed_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS configuration for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CLIENT_ORIGIN", "")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "x-csrf-token"],
    max_age=86400
)

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # HSTS for production
    if os.getenv("NODE_ENV") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    return response

# Health check endpoints
@app.get("/healthz")
async def health_check():
    """Health check endpoint for load balancers"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/readyz")
async def readiness_check():
    """Readiness check endpoint for Kubernetes"""
    return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}

# Rate limiting for authentication endpoints
@app.post(f"{API_PREFIX}/auth/login")
@limiter.limit("10/minute")
async def login_with_rate_limit(request: Request):
    """Login endpoint with rate limiting"""
    # This will be handled by the actual login route
    pass

# Global exception handler
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    # Log full stack trace to server logs
    print(f"UNHANDLED ERROR: {repr(exc)}")
    traceback.print_exc()
    
    # Return normalized JSON error response
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc)[:500],  # Truncate to prevent huge responses
            "path": str(request.url),
            "method": request.method,
            "timestamp": datetime.now().isoformat()
        }
    )

# Import all the functions from your existing chatbot
RESPONSES_FILE = "responses.json"

# ==== HEALTH CHECK ENDPOINT ====

@app.get("/healthz")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"ok": True, "status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/health")
def api_health():
    """API health endpoint for frontend connectivity check"""
    return {"ok": True, "service": "api", "status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/healthz")
def api_healthz():
    """API healthz endpoint for frontend connectivity check (compatibility)"""
    return {"ok": True, "service": "api", "status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get(f"{API_PREFIX}/debug/routes")
def list_routes():
    """Debug endpoint to list all mounted routes"""
    result = []
    for r in app.router.routes:
        path = getattr(r, "path", None)
        methods = sorted(list(getattr(r, "methods", []) or []))
        if path:
            result.append({"path": path, "methods": methods})
    return result

# ==== GOALS CRUD + PROGRESS ====

class GoalBaseModel(BaseModel):
    category: str = "supply_center"
    metric: str
    unit: str
    direction: str = "decrease"
    target_amount: float
    baseline_amount: Optional[float] = None
    title: str
    weight: float = 0.30
    is_active: bool = True

class GoalCreateModel(GoalBaseModel):
    pass

class GoalUpdateModel(BaseModel):
    category: Optional[str] = None
    metric: Optional[str] = None
    unit: Optional[str] = None
    direction: Optional[str] = None
    target_amount: Optional[float] = None
    baseline_amount: Optional[float] = None
    title: Optional[str] = None
    weight: Optional[float] = None
    is_active: Optional[bool] = None

def _current_user_id() -> int:
    # TODO: integrate with real auth; for now return demo user
    return 1

@app.get(f"{API_PREFIX}/goals")
def goals_list(db: Session = Depends(get_db)):
    uid = _current_user_id()
    rows = db.query(UserGoal).filter(UserGoal.user_id == uid).order_by(UserGoal.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "category": r.category,
            "metric": r.metric,
            "unit": r.unit,
            "direction": r.direction,
            "target_amount": r.target_amount,
            "baseline_amount": r.baseline_amount,
            "title": r.title,
            "weight": r.weight,
            "is_active": r.is_active,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in rows
    ]

@app.post(f"{API_PREFIX}/goals")
def goals_create(body: GoalCreateModel, db: Session = Depends(get_db)):
    uid = _current_user_id()
    r = UserGoal(
        user_id=uid,
        category=body.category,
        metric=body.metric,
        unit=body.unit,
        direction=body.direction,
        target_amount=body.target_amount,
        baseline_amount=body.baseline_amount,
        title=body.title,
        weight=body.weight,
        is_active=body.is_active,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return {
        "id": r.id,
        "user_id": r.user_id,
        "category": r.category,
        "metric": r.metric,
        "unit": r.unit,
        "direction": r.direction,
        "target_amount": r.target_amount,
        "baseline_amount": r.baseline_amount,
        "title": r.title,
        "weight": r.weight,
        "is_active": r.is_active,
        "created_at": r.created_at,
        "updated_at": r.updated_at,
    }

@app.patch(f"{API_PREFIX}/goals/{{goal_id}}")
def goals_update(goal_id: int, body: GoalUpdateModel, db: Session = Depends(get_db)):
    uid = _current_user_id()
    r = db.query(UserGoal).filter(UserGoal.id == goal_id, UserGoal.user_id == uid).first()
    if not r:
        raise HTTPException(status_code=404, detail="Goal not found")
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return {
        "id": r.id,
        "user_id": r.user_id,
        "category": r.category,
        "metric": r.metric,
        "unit": r.unit,
        "direction": r.direction,
        "target_amount": r.target_amount,
        "baseline_amount": r.baseline_amount,
        "title": r.title,
        "weight": r.weight,
        "is_active": r.is_active,
        "created_at": r.created_at,
        "updated_at": r.updated_at,
    }

@app.delete(f"{API_PREFIX}/goals/{{goal_id}}")
def goals_delete(goal_id: int, db: Session = Depends(get_db)):
    uid = _current_user_id()
    n = db.query(UserGoal).filter(UserGoal.id == goal_id, UserGoal.user_id == uid).delete()
    db.commit()
    return {"deleted": n > 0}

@app.get(f"{API_PREFIX}/goals/progress")
def goals_progress(db: Session = Depends(get_db)):
    uid = _current_user_id()
    rows = db.query(UserGoal).filter(UserGoal.user_id == uid, UserGoal.is_active == True).all()
    out = []
    for r in rows:
        achieved = 0.0
        pct = 0.0
        target_val = float(getattr(r, 'target_amount', 0) or 0)
        if target_val > 0:
            pct = max(0.0, min(1.0, achieved / target_val))
        out.append({
            "goal": {
                "id": r.id,
                "user_id": r.user_id,
                "category": r.category,
                "metric": r.metric,
                "unit": r.unit,
                "direction": r.direction,
                "target_amount": r.target_amount,
                "baseline_amount": r.baseline_amount,
                "title": r.title,
                "weight": r.weight,
                "is_active": r.is_active,
            },
            "achieved_amount": achieved,
            "percent_complete": pct,
        })
    return out

# ==== CONFIG ENDPOINT ====

@app.get("/api/config")
async def get_config():
    """Get feature flags and configuration"""
    return {
        "featureAlibaba": os.getenv("FEATURE_ALIBABA", "0") == "1",
        "alibabaEnabled": bool(os.getenv("ALIBABA_B2B_CLIENT_ID") and os.getenv("ALIBABA_B2B_CLIENT_SECRET"))
    }

# ==== FACTORY SOURCING UTILITY FUNCTIONS ====

def load_responses():
    try:
        with open(RESPONSES_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def load_dataset():
    """Load the factory dataset from normalized JSON file"""
    try:
        from ingest import FactoryDataIngest
        ingest = FactoryDataIngest()
        
        # Try to load from normalized data first
        try:
            ingest.ingest_from_normalized()
            print(f"[DEBUG] Loaded {len(ingest.factories_data)} factories from normalized data", flush=True)
            return ingest.factories_data
        except FileNotFoundError:
            print("[WARNING] Normalized data not found, trying CSV fallback", flush=True)
            # Fallback to CSV if normalized data doesn't exist
            try:
                ingest.ingest_from_csv("main_factory_data_only.csv")
                print(f"[DEBUG] Loaded {len(ingest.factories_data)} factories from CSV dataset", flush=True)
                return ingest.factories_data
            except Exception as csv_error:
                print(f"[WARNING] CSV fallback also failed: {csv_error}", flush=True)
                return []
        except Exception as e:
            print(f"[WARNING] Error loading normalized data: {e}", flush=True)
            return []
    except Exception as e:
        print(f"[WARNING] Error initializing FactoryDataIngest: {e}", flush=True)
        return []

def clean_name(name):
    return re.sub(r'[^a-zA-Z0-9 ]', '', name).strip().lower()

def extract_product_keywords(text):
    """Extract product types and materials from user input"""
    input_lower = text.lower()
    products = []
    materials = []
    
    # Product types
    product_keywords = {
        'denim': ['denim', 'jeans', 'jacket'],
        'knitwear': ['knit', 'sweater', 'sweatshirt', 'hoodie', 't-shirt', 'tshirt'],
        'woven': ['woven', 'shirt', 'blouse', 'dress', 'pants', 'trousers'],
        'activewear': ['activewear', 'sportswear', 'athletic', 'gym', 'fitness'],
        'lingerie': ['lingerie', 'underwear', 'bra', 'panties'],
        'accessories': ['accessories', 'hat', 'cap', 'scarf', 'bag', 'belt'],
        'swimwear': ['swimwear', 'swimsuit', 'bikini', 'trunks']
    }
    
    for category, keywords in product_keywords.items():
        if any(keyword in input_lower for keyword in keywords):
            products.append(category)
    
    # Materials
    material_keywords = {
        'cotton': ['cotton'],
        'polyester': ['polyester', 'poly'],
        'denim': ['denim'],
        'leather': ['leather'],
        'wool': ['wool', 'cashmere'],
        'silk': ['silk'],
        'synthetic': ['synthetic', 'nylon', 'spandex', 'elastane']
    }
    
    for material, keywords in material_keywords.items():
        if any(keyword in input_lower for keyword in keywords):
            materials.append(material)
    
    return products, materials

def search_factories(user_input, history, threshold=80):
    """Search factories using unified search with Alibaba integration"""
    try:
        # Use the unified search endpoint internally
        search_request = {
            "query": user_input,
            "location": None,
            "industry": None,
            "size": None,
            "brand": None,
            "limit": 5,
            "include_sources": ["internal", "alibaba"] if os.getenv("FEATURE_ALIBABA", "0") == "1" else ["internal"]
        }
        
        # Call the unified search function
        results = search_factories_fast(
            query=search_request["query"],
            location=search_request["location"],
            industry=search_request["industry"],
            size=search_request["size"],
            brand=search_request["brand"],
            limit=search_request["limit"]
        )
        
        if not results or not results.get("results"):
            return None
        
        # Format results for chatbot response
        factories = results["results"][:3]  # Top 3 matches
        if not factories:
            return None
        
        response_parts = []
        for i, factory in enumerate(factories, 1):
            name = factory.get("name", "Unknown Factory")
            location = f"{factory.get('city', '')}, {factory.get('country', '')}".strip(", ")
            specialties = factory.get("specialties", "")
            source_tag = " (Alibaba)" if factory.get("source") == "alibaba" else ""
            
            response_parts.append(f"{i}. **{name}**{source_tag} - {location}")
            if specialties:
                response_parts.append(f"   Specialties: {specialties}")
        
        return "Here are some relevant factories I found:\n\n" + "\n".join(response_parts)
        
    except Exception as e:
        print(f"[DEBUG] Unified search failed, falling back to legacy search: {e}", flush=True)
        # Fallback to legacy search
        dataset = load_dataset()
        
        if not dataset:
            print("[DEBUG] No factory dataset loaded. Skipping factory search.", flush=True)
            return None
        
        # Extract product and material preferences
        products, materials = extract_product_keywords(user_input)
        print(f"[DEBUG] Extracted products: {products}, materials: {materials}", flush=True)
        
        # Search through factory entries
        best_matches = []
        
        for entry in dataset:
            score: int = 0
            
            # Check product specialties
            specialties = entry.get('Product Specialties', '').lower()
            if specialties:
                for product in products:
                    if product in specialties:
                        score += 30
                        break
            
            # Check materials handled
            materials_handled = entry.get('Materials Handled', '').lower()
            if materials_handled:
                for material in materials:
                    if material in materials_handled:
                        score += 20
                        break
            
            # Check certifications if mentioned
            if 'certification' in user_input.lower() or 'certified' in user_input.lower():
                certifications = entry.get('Certifications', '')
                if certifications and certifications.strip():
                    score += 15
            
            # Check location preferences
            if any(country in user_input.lower() for country in ['china', 'india', 'vietnam', 'bangladesh', 'turkey', 'sri lanka']):
                country = entry.get('Country', '').lower()
                if country in user_input.lower():
                    score += 25
            
            # Check past clients if brand names mentioned
            past_clients = entry.get('Past Clients', '')
            if past_clients:
                client_list = [c.strip() for c in re.split(r'[;,/|]', past_clients) if c.strip()]
                for client in client_list:
                    if client.lower() in user_input.lower():
                        score += 20
                        break
            
            if score >= threshold:
                best_matches.append((entry, score))
    
    # Sort by score and return top matches
    best_matches.sort(key=lambda x: x[1], reverse=True)
    
    if best_matches:
        response = create_factory_recommendation(best_matches[:3], user_input, products, materials)
        return response
    
    print(f"[DEBUG] No relevant factory matches found above threshold {threshold}", flush=True)
    return None

def create_factory_recommendation(matches, user_input, products, materials):
    """Create a factory recommendation response"""
    response_parts = []
    
    for i, (factory, score) in enumerate(matches, 1):
        factory_info = []
        
        # Factory name
        name = factory.get('Factory Name', '').strip()
        if name:
            factory_info.append(f"**{name}**")
        
        # Location
        country = factory.get('Country', '').strip()
        city = factory.get('City', '').strip()
        if country and city:
            factory_info.append(f"Location: {city}, {country}")
        elif country:
            factory_info.append(f"Location: {country}")
        
        # Product specialties
        specialties = factory.get('Product Specialties', '').strip()
        if specialties:
            factory_info.append(f"Specialties: {specialties}")
        
        # Materials
        materials_handled = factory.get('Materials Handled', '').strip()
        if materials_handled:
            factory_info.append(f"Materials: {materials_handled}")
        
        # Certifications
        certifications = factory.get('Certifications', '').strip()
        if certifications:
            factory_info.append(f"Certifications: {certifications}")
        
        # Past clients
        past_clients = factory.get('Past Clients', '').strip()
        if past_clients:
            factory_info.append(f"Past Clients: {past_clients}")
        
        # Contact info
        contact_email = factory.get('Contact Email', '').strip()
        contact_phone = factory.get('Contact Phone', '').strip()
        if contact_email or contact_phone:
            contact_info = []
            if contact_email:
                contact_info.append(f"Email: {contact_email}")
            if contact_phone:
                contact_info.append(f"Phone: {contact_phone}")
            factory_info.append(f"Contact: {', '.join(contact_info)}")
        
        response_parts.append(f"{i}. {' | '.join(factory_info)}")
    
    if response_parts:
        return f"Here are some factory recommendations based on your requirements:\n\n" + "\n\n".join(response_parts) + f"\n\n[Source: Factory Database | Match Score: {matches[0][1]}%]"
    
    return "No suitable factories found in our database. Would you like me to help you refine your search criteria?"

def get_best_static_match(user_input, history, threshold=95):
    """Get best static response for factory sourcing questions"""
    data = load_responses()

    if not data:
        print("[DEBUG] No responses loaded. Skipping static match.", flush=True)
        return None

    # Focus on factory sourcing related questions
    factory_keywords = ['factory', 'manufacturer', 'supplier', 'source', 'produce', 'make']
    if not any(keyword in user_input.lower() for keyword in factory_keywords):
        print("[DEBUG] Not a factory sourcing question - skipping static match", flush=True)
        return None

    questions = [item["question"] for item in data]
    result = process.extractOne(user_input, questions)

    if result is None:
        print("[DEBUG] No static match found.", flush=True)
        return None

    best_match, score, match_meta = result
    print(f"[DEBUG] Best static match: '{best_match}' with score {score}", flush=True)

    if score >= threshold:
        for item in data:
            if item["question"] == best_match:
                return item['answer']

    print(f"[DEBUG] Match score {score} below threshold {threshold}.", flush=True)
    return None

def call_ollama_factory_sourcing(message, history=None):
    """Call Ollama with factory sourcing focused prompt"""
    if history is None:
        history = []

    system_prompt = """You are SLA (Simple Logistics Assistant), a specialized factory sourcing expert. You help users find reliable manufacturers and suppliers for their products.

IMPORTANT GUIDELINES:
- Focus ONLY on factory sourcing, manufacturing, and supplier recommendations
- Keep responses concise and actionable
- Ask clarifying questions about product type, quantity, budget, and location preferences
- Provide specific factory recommendations when possible
- If no specific factory data is available, give general sourcing advice
- Avoid discussing other logistics topics like shipping, customs, or general business advice
- When mentioning factories from Alibaba, clearly indicate they are sourced from Alibaba.com
- Prefer verified and high-response-rate Alibaba suppliers when available

When users ask about factories, always ask for:
1. What product they want to manufacture
2. Approximate quantity needed
3. Budget range
4. Preferred location/country
5. Any specific certifications required

DATA SOURCES:
- Internal factory database with verified manufacturers
- Alibaba.com B2B platform (when enabled) - clearly tag these as "(Alibaba)" in responses"""

    messages = [{"role": "system", "content": system_prompt}]
    for user_msg, bot_msg in history:
        messages.append({"role": "user", "content": user_msg})
        messages.append({"role": "assistant", "content": bot_msg})
    messages.append({"role": "user", "content": message})

    print("[DEBUG] Calling Ollama for factory sourcing advice:", flush=True)

    try:
        response = ollama.chat(model="mistral", messages=messages)
        return response.message.content
    except Exception as e:
        print("[ERROR] Ollama failed:", e, flush=True)
        # Provide helpful fallback response instead of error message
        return """I can help you with factory sourcing! Based on your query, here are some general guidelines:

**For Manufacturing Success:**
• Start with clear product specifications and requirements
• Consider minimum order quantities (MOQs) - typically 500-1000 units for apparel
• Factor in lead times: 4-8 weeks for production + shipping
• Research certifications needed for your target market
• Get samples before committing to large orders

**Next Steps:**
1. Define your product specifications clearly
2. Set your budget and timeline
3. Research potential suppliers in your target regions
4. Request quotes and samples from multiple factories

Would you like me to help you refine your product requirements or provide more specific guidance for your manufacturing needs?"""

def detect_factory_intent(user_input):
    """Detect if the user is asking about factory sourcing"""
    input_lower = user_input.lower().strip()
    
    # Factory sourcing keywords
    factory_keywords = [
        'factory', 'manufacturer', 'supplier', 'source', 'produce', 'make', 
        'manufacturing', 'production', 'sourcing', 'find factory', 'looking for factory',
        'need factory', 'want to manufacture', 'production partner'
    ]
    
    # Product keywords that indicate manufacturing needs
    product_keywords = [
        'denim', 'jeans', 'shirt', 'dress', 'pants', 'sweater', 'hoodie', 't-shirt',
        'apparel', 'clothing', 'garment', 'textile', 'fabric', 'knitwear', 'woven'
    ]
    
    if any(keyword in input_lower for keyword in factory_keywords):
        return "factory_sourcing"
    
    if any(keyword in input_lower for keyword in product_keywords):
        return "factory_sourcing"
    
    # Greetings and general questions
    if any(word in input_lower for word in ["hello", "hi", "hey", "how are you"]):
        return "greeting"
    
    return "other"

# ==== API MODELS ====

class ChatRequest(BaseModel):
    message: str
    history: list = []

class ChatResponse(BaseModel):
    reply: str
    source: str

class FactorySearchRequest(BaseModel):
    query: str = ""
    location: str | None = None
    industry: str | None = None
    size: str | None = None
    brand: str | None = None
    limit: int = 10
    include_sources: List[str] = ["internal", "alibaba"]

class FactorySearchResponse(BaseModel):
    results: list
    total_found: int
    search_time: float

class ReverseImageSearchResponse(BaseModel):
    results: list
    total_found: int
    search_time: float
    extracted_attributes: Dict[str, Any]

# ==== API ENDPOINTS ====

@app.get("/")
async def root():
    return {"message": "SLA - Factory Sourcing Assistant API is running!"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint focused on factory sourcing"""
    
    # Convert history format if needed
    history = []
    if request.history:
        for msg in request.history:
            if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                if msg['role'] == 'user':
                    history.append((msg['content'], ''))
                elif msg['role'] == 'assistant':
                    if history:
                        history[-1] = (history[-1][0], msg['content'])
    
    print(f"[DEBUG] Processing factory sourcing request: {request.message}", flush=True)
    
    # Step 1: Detect intent
    intent = detect_factory_intent(request.message)
    print(f"[DEBUG] Detected intent: {intent}", flush=True)
    
    # Step 2: Handle greetings
    if intent == "greeting":
        response = "Hi! I'm SLA, your factory sourcing assistant. I can help you find reliable manufacturers for your products. What are you looking to manufacture?"
        return ChatResponse(reply=response, source="greeting")
    
    # Step 3: Try static responses for common factory questions
    if intent == "factory_sourcing":
        static_match = get_best_static_match(request.message, history)
        if static_match:
            print("[DEBUG] Using static factory response", flush=True)
            return ChatResponse(reply=static_match, source="static_factory")
    
    # Step 4: Search factory database
    if intent == "factory_sourcing":
        factory_match = search_factories(request.message, history)
        if factory_match:
            print("[DEBUG] Using factory database match", flush=True)
            return ChatResponse(reply=factory_match or "", source="factory_database")
    
    # Step 5: Fallback to LLM for factory sourcing advice
    if intent == "factory_sourcing":
        response = call_ollama_factory_sourcing(request.message, history)
        return ChatResponse(reply=response or "", source="llm_factory")
    
    # Step 6: Default response for non-factory questions
    response = "I'm specialized in factory sourcing and manufacturing. I can help you find reliable manufacturers for your products. What would you like to manufacture?"
    return ChatResponse(reply=response, source="redirect_to_factory")

def search_factories_fast(query: str, location: str | None = None, industry: str | None = None, size: str | None = None, brand: str | None = None, limit: int = 10):
    """Fast factory search with scoring and ranking"""
    import time
    start_time = time.time()
    
    dataset = load_dataset()
    if not dataset:
        return {"results": [], "total_found": 0, "search_time": 0.0}
    
    
    scored = []
    query_lower = query.lower() if query else ""
    
    
    for idx, factory in enumerate(dataset):
        score = 0.0
        
        # Text similarity scoring (70% weight)
        # Handle both normalized and CSV formats
        factory_name = factory.get('factory_name', factory.get('Factory Name', ''))
        specialties = factory.get('product_specialties', factory.get('Product Specialties', ''))
        materials = factory.get('materials_handled', factory.get('Materials Handled', ''))
        country = factory.get('country', factory.get('Country', ''))
        city = factory.get('city', factory.get('City', ''))
        past_clients = factory.get('past_clients', factory.get('Past Clients', ''))
        
        # Convert lists to strings for text matching
        if isinstance(specialties, list):
            specialties = ' '.join(specialties)
        if isinstance(materials, list):
            materials = ' '.join(materials)
        if isinstance(past_clients, list):
            past_clients = ' '.join(past_clients)
        elif isinstance(past_clients, str):
            # Handle comma-separated past clients
            past_clients = past_clients.replace(',', ' ').replace(';', ' ').replace('|', ' ')
            
        factory_text = f"{factory_name} {specialties} {materials} {country} {city} {past_clients}"
        factory_text = factory_text.lower()
        
        if query_lower:
            # Use fuzzy matching for text similarity
            text_score = fuzz.token_set_ratio(query_lower, factory_text) / 100.0
            score += 0.7 * text_score
        else:
            # If no query, give a base score for brand-only searches
            if brand:
                score += 0.2  # Higher base score for brand-only searches
        
        # Filter scoring (30% weight)
        filter_score = 0.0
        
        # Location filter
        if location:
            location_lower = location.lower()
            if location_lower in country.lower() or location_lower in city.lower():
                filter_score += 0.3
        
        # Industry filter
        if industry:
            industry_lower = industry.lower()
            if industry_lower in specialties.lower():
                filter_score += 0.3
        
        # Size filter (based on monthly capacity)
        if size:
            capacity = factory.get('max_monthly_capacity', factory.get('Max Monthly Capacity', 0))
            if capacity and isinstance(capacity, (int, float)):
                if size == "small" and capacity < 10000:
                    filter_score += 0.4
                elif size == "medium" and 10000 <= capacity < 100000:
                    filter_score += 0.4
                elif size == "large" and 100000 <= capacity < 1000000:
                    filter_score += 0.4
                elif size == "enterprise" and capacity >= 1000000:
                    filter_score += 0.4
        
        # Brand filter (check if factory has worked with the specified brand)
        if brand:
            brand_lower = brand.lower()
            
            # Handle both list and string formats for past_clients
            if isinstance(past_clients, list):
                past_clients_lower = [client.lower() for client in past_clients]
                if brand_lower in past_clients_lower:
                    filter_score += 0.5  # Higher weight for brand match
            elif isinstance(past_clients, str):
                past_clients_lower = past_clients.lower()
                if brand_lower in past_clients_lower:
                    filter_score += 0.5  # Higher weight for brand match
        
        score += filter_score
        
        
        # Only include factories with some relevance (lowered threshold for brand search)
        # For brand-only searches, include if brand matches regardless of other scores
        if score > 0.05 or (brand and filter_score >= 0.5):
            # Use the index as factory_id since the dataset doesn't have explicit IDs
            factory_id = str(idx + 1)  # Use 1-based indexing to match database IDs
            
            result = {
                "id": factory_name,  # Keep for backward compatibility
                "factory_id": factory_id,  # Use index-based ID
                "name": factory_name,
                "status": "Active",  # Default status
                "country": country,
                "city": city,
                "lat": factory.get('latitude', factory.get('Latitude', 0)),
                "lng": factory.get('longitude', factory.get('Longitude', 0)),
                "score": round(score, 3),
                "specialties": specialties,
                "materials": materials,
                "certifications": factory.get('certifications', factory.get('Certifications', '')),
                "contact_email": factory.get('contact_email', factory.get('Contact Email', '')),
                "contact_phone": factory.get('contact_phone', factory.get('Contact Phone', ''))
            }
            scored.append(result)
    
    # Sort by score (descending) and limit results
    scored.sort(key=lambda x: x["score"], reverse=True)
    results = scored[:limit]
    
    search_time = time.time() - start_time
    
    return {
        "results": results,
        "total_found": len(scored),
        "search_time": round(search_time, 3)
    }

@app.post("/api/factories/search", response_model=FactorySearchResponse)
async def factories_search(request: FactorySearchRequest):
    """Unified factory search endpoint with Alibaba integration"""
    try:
        print(f"[DEBUG] Factory search request: {request.query}, location: {request.location}, industry: {request.industry}, size: {request.size}, brand: {request.brand}, sources: {request.include_sources}", flush=True)
        
        all_results = []
        
        # Get internal results if requested
        if "internal" in request.include_sources:
            internal_results = search_factories_fast(
                query=request.query,
                location=request.location,
                industry=request.industry,
                size=request.size,
                brand=request.brand,
                limit=request.limit
            )
            # Add source tag to internal results
            for result in internal_results.get("results", []):
                result["source"] = "internal"
                result["tags"] = result.get("tags", []) + ["internal"]
            all_results.extend(internal_results.get("results", []))
        
        # Get Alibaba results if enabled and requested
        if "alibaba" in request.include_sources and os.getenv("FEATURE_ALIBABA", "0") == "1":
            try:
                # For now, use a mock access token - in production, get from user's stored credentials
                # TODO: Integrate with existing Alibaba credential system
                mock_token = "mock_token_for_development"
                
                # Search Alibaba suppliers
                alibaba_items = await search_suppliers(
                    mock_token,
                    request.query,
                    {
                        "location": request.location,
                        "industry": request.industry,
                        "size": request.size,
                        "brand": request.brand
                    }
                )
                alibaba_results = [map_supplier(x) for x in alibaba_items]
                all_results.extend(alibaba_results)
                
            except Exception as e:
                print(f"[DEBUG] Alibaba search failed: {str(e)}", flush=True)
        
        # Merge and deduplicate results
        if all_results:
            merged_results = dedup_and_merge(all_results)
            ranked_results = rerank_factories(request.query, merged_results)

            # Goal-aware reranking and impact attachment
            try:
                from os import getenv
                DEFAULT_GOAL_WEIGHT = float(getenv("GOAL_DEFAULT_WEIGHT", "0.30"))
            except Exception:
                DEFAULT_GOAL_WEIGHT = 0.30

            # Load active goals from DB
            db = None
            try:
                from sqlalchemy.orm import Session
                from database import SessionLocal
                from models import UserGoal
                db = SessionLocal()
                goals = db.query(UserGoal).filter(UserGoal.user_id == 1, UserGoal.is_active == True).all()
                goals_dicts = [
                    {
                        "id": g.id,
                        "metric": g.metric,
                        "unit": g.unit,
                        "direction": g.direction,
                        "target_amount": float(getattr(g, 'target_amount', 0) or 0),
                        "baseline_amount": float(getattr(g, 'baseline_amount', 0) or 0) if getattr(g, 'baseline_amount', None) is not None else None,
                        "weight": float(getattr(g, 'weight', DEFAULT_GOAL_WEIGHT) or DEFAULT_GOAL_WEIGHT),
                    }
                    for g in goals
                ]
            except Exception:
                goals_dicts = []
            finally:
                if db:
                    try:
                        db.close()
                    except Exception:
                        pass

            def _goal_gain_fraction(item: Dict[str, Any], goals: List[Dict[str, Any]]) -> float:
                if not goals:
                    return 0.0
                total_w = 0.0
                acc = 0.0
                for g in goals:
                    w = float(g.get("weight") or DEFAULT_GOAL_WEIGHT)
                    total_w += w
                    metric = g.get("metric")
                    direction = g.get("direction")
                    target = float(g.get("target_amount") or 0)
                    baseline = g.get("baseline_amount")
                    if target <= 0:
                        continue
                    if metric == "cost":
                        item_cost = float(item.get("total_cost") or item.get("unit_cost") or 0.0)
                        ref = baseline if baseline is not None else float(item.get("avg_cost_benchmark") or 0.0)
                        delta = (ref - item_cost) if direction == "decrease" else (item_cost - ref)
                    elif metric == "time":
                        item_days = float(item.get("total_days") or item.get("transit_days") or 0.0)
                        ref = baseline if baseline is not None else float(item.get("avg_days_benchmark") or 0.0)
                        delta = (ref - item_days) if direction == "decrease" else (item_days - ref)
                    else:
                        key = f"custom_value::{g.get('unit','custom')}"
                        item_val = float(item.get(key) or 0.0)
                        ref = float(baseline or 0.0)
                        delta = (ref - item_val) if direction == "decrease" else (item_val - ref)
                    improve = max(0.0, float(delta))
                    frac = max(0.0, min(1.0, improve / target))
                    acc += w * frac
                return (acc / total_w) if total_w > 0 else 0.0

            if goals_dicts:
                for it in merged_results:
                    gg = _goal_gain_fraction(it, goals_dicts)
                    base = float(it.get("score") or it.get("base_score") or 0.0)
                    it["goal_gain_fraction"] = gg
                    it["final_score"] = base * (1.0 + DEFAULT_GOAL_WEIGHT * gg)
                    # Attach per-goal impacts for UI
                    it.setdefault("goal_impacts", [])
                    for g in goals_dicts:
                        if g["metric"] == "cost":
                            cost = float(it.get("total_cost") or it.get("unit_cost") or 0.0)
                            ref = g.get("baseline_amount") or float(it.get("avg_cost_benchmark") or 0.0)
                            delta = max(0.0, ref - cost) if g["direction"] == "decrease" else max(0.0, cost - ref)
                        elif g["metric"] == "time":
                            days = float(it.get("total_days") or it.get("transit_days") or 0.0)
                            ref = g.get("baseline_amount") or float(it.get("avg_days_benchmark") or 0.0)
                            delta = max(0.0, ref - days) if g["direction"] == "decrease" else max(0.0, days - ref)
                        else:
                            key = f"custom_value::{g.get('unit','custom')}"
                            val = float(it.get(key) or 0.0)
                            ref = float(g.get("baseline_amount") or 0.0)
                            delta = max(0.0, ref - val) if g["direction"] == "decrease" else max(0.0, val - ref)
                        pct = min(1.0, (delta / float(g["target_amount"])) if g["target_amount"] else 0.0)
                        it["goal_impacts"].append({
                            "goal_id": g["id"],
                            "metric": g["metric"],
                            "unit": g["unit"],
                            "direction": g["direction"],
                            "delta": round(float(delta), 3),
                            "target": float(g["target_amount"]),
                            "pct_to_goal": pct,
                        })
                # sort by final_score when goals present
                merged_results.sort(key=lambda x: float(x.get("final_score") or x.get("score") or 0.0), reverse=True)
                ranked_results = merged_results
        else:
            merged_results = []
            ranked_results = []
        
        # Limit results
        final_results = ranked_results[:request.limit]
        
        return FactorySearchResponse(
            results=final_results,
            total_found=len(ranked_results),
            search_time=0.0  # Will be calculated from internal search if available
        )
    except Exception as e:
        print(f"[ERROR] Search endpoint error: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# ==== REVERSE IMAGE SEARCH ENDPOINT ====

# Mock Mistral Vision API for development
async def analyze_image_with_mistral(image_path: str, hints: str = "") -> Dict[str, Any]:
    """Mock Mistral Vision API call - replace with actual API integration"""
    # In production, this would call Mistral's Pixtral API
    # For now, return mock data based on common garment types
    
    mock_attributes = {
        "product_category": "hoodie",
        "primary_materials": ["cotton", "polyester"],
        "blend_ratio_guess": {"cotton": 80, "polyester": 20},
        "fabric_characteristics": ["fleece", "loop-knit"],
        "key_features": ["kangaroo pocket", "drawcord hood", "raglan sleeves"],
        "construction_notes": ["overlock seams", "coverstitch hems"],
        "finishing": ["enzyme wash"],
        "accessories_trims": ["elastic waistband"],
        "printing_techniques": ["screenprint"],
        "estimated_moq_band": "mid(200-1000)",
        "region_hints": ["tiruppur", "guangdong"],
        "style_tags": ["streetwear", "athletic"],
        "brand_ip_risk": "none",
        "confidence": 0.85
    }
    
    # Simulate processing time
    await asyncio.sleep(2)
    
    return mock_attributes

def merge_image_attributes(attributes_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge attributes from multiple images using majority vote and union operations"""
    if not attributes_list:
        return {}
    
    if len(attributes_list) == 1:
        return attributes_list[0]
    
    merged = {}
    
    # Categorical fields - majority vote
    categorical_fields = ["product_category", "estimated_moq_band", "brand_ip_risk"]
    for field in categorical_fields:
        values = [attr.get(field) for attr in attributes_list if attr.get(field)]
        if values:
            # Simple majority vote (in production, use more sophisticated voting)
            merged[field] = max(set(values), key=values.count)
    
    # List fields - union
    list_fields = ["primary_materials", "fabric_characteristics", "key_features", 
                   "construction_notes", "finishing", "accessories_trims", 
                   "printing_techniques", "region_hints", "style_tags"]
    for field in list_fields:
        all_values = []
        for attr in attributes_list:
            if attr.get(field):
                all_values.extend(attr[field])
        merged[field] = list(set(all_values))  # Remove duplicates
    
    # Numeric fields - average
    numeric_fields = ["confidence"]
    for field in numeric_fields:
        values = [attr.get(field, 0) for attr in attributes_list if attr.get(field)]
        if values:
            merged[field] = sum(values) / len(values)
    
    # Blend ratio - average
    blend_ratios = [attr.get("blend_ratio_guess", {}) for attr in attributes_list]
    if blend_ratios:
        all_materials = set()
        for ratio in blend_ratios:
            all_materials.update(ratio.keys())
        
        merged_blend = {}
        for material in all_materials:
            values = [ratio.get(material, 0) for ratio in blend_ratios]
            merged_blend[material] = sum(values) / len(values)
        merged["blend_ratio_guess"] = merged_blend
    
    return merged

def match_factories_by_attributes(attributes: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
    """Match factories based on extracted attributes"""
    # Load factory data
    try:
        df = pd.read_csv("data/main_factory_data_only.csv")
    except FileNotFoundError:
        return []
    
    # Convert to list of dicts
    factories = df.to_dict('records')
    
    # Score factories based on attribute matching
    scored_factories = []
    
    for factory in factories:
        score = 0.0
        matched_attributes = []
        
        # Category matching
        if attributes.get("product_category"):
            factory_categories = str(factory.get("categories", "")).lower()
            if attributes["product_category"] in factory_categories:
                score += 0.3
                matched_attributes.append("category")
        
        # Material matching
        if attributes.get("primary_materials"):
            factory_materials = str(factory.get("materials", "")).lower()
            for material in attributes["primary_materials"]:
                if material in factory_materials:
                    score += 0.2
                    matched_attributes.append(f"material_{material}")
                    break
        
        # Capability matching
        if attributes.get("key_features"):
            factory_capabilities = str(factory.get("capabilities", "")).lower()
            for feature in attributes["key_features"]:
                if feature in factory_capabilities:
                    score += 0.1
                    matched_attributes.append(f"feature_{feature}")
        
        # Region boost
        if attributes.get("region_hints"):
            factory_region = str(factory.get("region", "")).lower()
            for region in attributes["region_hints"]:
                if region in factory_region:
                    score += 0.1
                    matched_attributes.append(f"region_{region}")
                    break
        
        if score > 0:
            factory["score"] = score
            factory["matched_attributes"] = matched_attributes
            scored_factories.append(factory)
    
    # Sort by score and return top results
    scored_factories.sort(key=lambda x: x["score"], reverse=True)
    return scored_factories[:limit]

async def text_only_factory_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Text-only factory search using existing search logic"""
    try:
        # Use existing factory search logic
        from ingest import FactoryDataIngest
        
        # Initialize the factory data ingest
        factory_ingest = FactoryDataIngest()
        
        # Search factories using the existing search method
        search_response = factory_ingest.search_factories(
            query=query,
            limit=limit
        )
        
        # Extract results from the response
        results = search_response.get("results", [])
        
        # Format results to match expected structure
        formatted_results = []
        for result in results:
            formatted_result = {
                "id": result.get("id", f"factory_{len(formatted_results) + 1}"),
                "name": result.get("name", "Unknown Factory"),
                "region": result.get("region", "Unknown"),
                "country": result.get("country", "Unknown"),
                "score": result.get("score", 0.5),
                "specialties": result.get("specialties", []),
                "source": "internal"
            }
            formatted_results.append(formatted_result)
        
        return formatted_results
        
    except Exception as e:
        print(f"[ERROR] Text search error: {str(e)}")
        # Fallback to mock data
        return [
            {
                "id": "text_search_1",
                "name": "Text Search Factory",
                "region": "Search Region",
                "country": "Search Country",
                "score": 0.75,
                "specialties": ["text search", "query matching"],
                "source": "internal"
            }
        ]

# ==== UNIFIED SEARCH ENDPOINT ====

class UnifiedSearchResponse(BaseModel):
    mode: str  # "text", "image", "image+text"
    results: list
    total_found: int
    search_time: float
    extracted_attributes: Optional[Dict[str, Any]] = None

# Text-only search endpoint
class TextSearchRequest(BaseModel):
    q: str = ""
    topK: int = 10

@app.post("/api/search/unified", response_model=UnifiedSearchResponse)
async def unified_text_search(request: TextSearchRequest):
    """
    Unified search endpoint for text-only searches
    """
    try:
        start_time = time.time()
        text_query = request.q.strip()
        k = request.topK
        
        if not text_query:
            raise HTTPException(status_code=400, detail="Provide a text query.")
        
        # Text-only search
        print(f"[DEBUG] Running text-only search: '{text_query}'")
        results = await text_only_factory_search(text_query, k)
        
        search_time = time.time() - start_time
        
        return UnifiedSearchResponse(
            mode="text",
            results=results,
            total_found=len(results),
            search_time=round(search_time, 3)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unified text search error: {str(e)}", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Text search failed: {str(e)}")

# SLA Search endpoint with LLM query parsing and reranking
class SLASearchRequest(BaseModel):
    q: str
    topK: int = 25
    filters: Dict[str, Any] = {}
    user: Dict[str, str] = {}
    llm: Dict[str, Any] = {}

class SLASearchResult(BaseModel):
    factoryId: str
    name: str
    region: str
    capabilities: List[str]
    certs: List[str]
    moq: int
    leadTimeDays: int
    score: float
    reasons: List[str]
    highlights: Dict[str, List[str]]
    explanation: Optional[str] = None

class SLASearchResponse(BaseModel):
    results: List[SLASearchResult]
    meta: Dict[str, Any]

@app.get("/api/vendors/{factory_id}")
async def get_vendor_details(factory_id: str, db: Session = Depends(get_db)):
    """
    Get detailed vendor information by factory ID
    """
    try:
        # Log the request for debugging
        print(f"[GET /vendors/:id] factoryId: {factory_id}", flush=True)
        
        # Find the factory by ID
        factory = db.query(Factory).filter(Factory.id == factory_id).first()
        
        if not factory:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        # Build detailed vendor response
        vendor_details = {
            "factoryId": str(factory.id),
            "name": factory.name or "Unknown",
            "region": f"{factory.city or 'Unknown'}, {factory.country or 'Unknown'}",
            "city": factory.city or "Unknown",
            "countriesServed": ["US", "UK", "EU", "AU"],  # TODO: Get from actual data
            "capabilities": factory.capabilities or [],
            "materials": factory.materials or [],
            "certs": factory.certifications or [],
            "compliance": {
                "iso9001": "ISO9001" in (factory.certifications or []),
                "wrap": "WRAP" in (factory.certifications or []),
                "sedex": "SEDEX" in (factory.certifications or [])
            },
            "moq": factory.moq or 0,
            "leadTimeDays": factory.lead_time_days or 0,
            "onTimeRate": 0.94,  # TODO: Get from actual performance data
            "defectRate": 0.012,  # TODO: Get from actual quality data
            "avgQuoteUsd": 5.8,  # TODO: Get from actual pricing data
            "recentBuyers": ["Brand A", "Brand B", "Fashion Co."],  # TODO: Get from actual data
            "images": factory.images or [],
            "contacts": [
                {
                    "name": "Sales Contact",
                    "email": factory.email or "sales@factory.com",
                    "phone": factory.phone or "+1-555-0123"
                }
            ],
            "notes": factory.notes or "No additional notes available",
            "ingestion_status": "READY"
        }
        
        return vendor_details
        
    except Exception as e:
        print(f"[ERROR] Vendor details error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch vendor details: {str(e)}")

@app.post("/api/saved/factories")
async def save_factory(factory_data: dict, db: Session = Depends(get_db)):
    """
    Save a factory to user's collection
    """
    try:
        factory_id = factory_data.get("factory_id")
        
        if not factory_id:
            raise HTTPException(status_code=400, detail="factory_id is required")
        
        # Check if factory exists
        factory = db.query(Factory).filter(Factory.id == factory_id).first()
        if not factory:
            raise HTTPException(status_code=404, detail="Factory not found")
        
        # TODO: Implement actual saving to user's collection
        # For now, just return success
        return {"saved": True, "factory_id": factory_id}
        
    except Exception as e:
        print(f"[ERROR] Save factory error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Failed to save factory: {str(e)}")

@app.post("/api/quotes/create")
async def create_quote(quote_data: dict, db: Session = Depends(get_db)):
    """
    Create a new quote with vendor pre-selection
    """
    try:
        factory_id = quote_data.get("factory_id")
        
        if not factory_id:
            raise HTTPException(status_code=400, detail="factory_id is required")
        
        # Check if factory exists
        factory = db.query(Factory).filter(Factory.id == factory_id).first()
        if not factory:
            raise HTTPException(status_code=404, detail="Factory not found")
        
        # TODO: Implement actual quote creation
        # For now, generate a mock quote ID
        import time
        quote_id = f"quote_{int(time.time())}"
        quote_ref = f"Q-{quote_id[-6:].upper()}"
        
        return {
            "id": quote_id,
            "ref": quote_ref,
            "factory_id": factory_id,
            "status": "created"
        }
        
    except Exception as e:
        print(f"[ERROR] Create quote error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Failed to create quote: {str(e)}")

@app.post("/api/sla/search", response_model=SLASearchResponse)
async def sla_search(request: SLASearchRequest, db: Session = Depends(get_db)):
    """
    SLA Search endpoint with LLM query parsing, retrieval, and reranking
    Only returns factories with ingestion_status = 'READY'
    """
    try:
        start_time = time.time()
        
        # Step A: Query understanding (LLM) - parse query to structured need_profile
        need_profile = await parse_query_with_llm(request.q)
        
        # Step B: Retrieval (INGESTED ONLY) - get factories where ingestion_status = 'READY'
        # For now, we'll use the existing factory search but filter for ingested factories
        # TODO: Implement proper ingestion_status filtering when the field is available
        factories = db.query(Factory).filter(
            Factory.name.ilike(f"%{request.q}%")
        ).limit(request.topK * 2).all()  # Get more for reranking
        
        # Step C: Scoring/rerank - weighted blend of factors
        scored_factories = []
        for factory in factories:
            score = calculate_factory_score(factory, need_profile, request.q)
            if score > 0.1:  # Only include factories with reasonable scores
                scored_factories.append({
                    'factory': factory,
                    'score': score,
                    'reasons': generate_reasons(factory, need_profile),
                    'highlights': generate_highlights(factory, need_profile)
                })
        
        # Sort by score and take topK
        scored_factories.sort(key=lambda x: x['score'], reverse=True)
        top_factories = scored_factories[:request.topK]
        
        # Step D: Explanations (LLM, optional) - generate "why this" explanations
        results = []
        for i, item in enumerate(top_factories):
            factory = item['factory']
            explanation = None
            
            if request.llm.get('explanations', True) and i < 5:  # Only explain top 5
                try:
                    explanation = await generate_explanation(factory, need_profile, request.q)
                except Exception as e:
                    print(f"[DEBUG] Explanation generation failed: {e}")
                    explanation = None
            
            results.append(SLASearchResult(
                factoryId=str(factory.id),
                name=factory.name,
                region=f"{factory.city}, {factory.country}" if factory.city else factory.country or "Unknown",
                capabilities=extract_capabilities(factory),
                certs=factory.certifications or [],
                moq=factory.moq or 0,
                leadTimeDays=factory.lead_time_days or 0,
                score=item['score'],
                reasons=item['reasons'],
                highlights=item['highlights'],
                explanation=explanation
            ))
        
        search_time = time.time() - start_time
        
        return SLASearchResponse(
            results=results,
            meta={
                "tookMs": round(search_time * 1000, 2),
                "retrievalK": len(factories),
                "reranked": True,
                "source": "vector+fts"
            }
        )
        
    except Exception as e:
        print(f"[ERROR] SLA search error: {str(e)}", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"SLA search failed: {str(e)}")

# Helper functions for SLA search
async def parse_query_with_llm(query: str) -> Dict[str, Any]:
    """Parse user query into structured need profile using LLM"""
    try:
        # TODO: Implement real LLM query parsing
        # For now, return a basic structure
        return {
            "category": "general",
            "materials": [],
            "regionPrefs": [],
            "certs": [],
            "moq": None,
            "leadTimeDaysMax": None,
            "targetPriceUsd": None,
            "notes": query
        }
    except Exception as e:
        print(f"[DEBUG] LLM query parsing failed: {e}")
        return {"category": "general", "materials": [], "regionPrefs": [], "certs": [], "moq": None, "leadTimeDaysMax": None, "targetPriceUsd": None, "notes": query}

def calculate_factory_score(factory: Factory, need_profile: Dict[str, Any], query: str) -> float:
    """Calculate weighted score for factory based on need profile"""
    score = 0.0
    
    # Capability/material match (0.35)
    if factory.name and query.lower() in factory.name.lower():
        score += 0.35
    
    # Region/geo fit (0.15)
    if need_profile.get("regionPrefs"):
        for region in need_profile["regionPrefs"]:
            if region.lower() in (factory.country or "").lower():
                score += 0.15
                break
    
    # Certifications/compliance (0.15)
    if need_profile.get("certs") and factory.certifications:
        for cert in need_profile["certs"]:
            if cert in factory.certifications:
                score += 0.15
                break
    
    # MOQ fit (0.10)
    if need_profile.get("moq") and factory.moq:
        if factory.moq <= need_profile["moq"]:
            score += 0.10
    
    # Lead time fit (0.10)
    if need_profile.get("leadTimeDaysMax") and factory.lead_time_days:
        if factory.lead_time_days <= need_profile["leadTimeDaysMax"]:
            score += 0.10
    
    # Historic quality/on-time (0.10)
    if factory.rating and factory.rating > 3.0:
        score += 0.10
    
    # Price fit if available (0.05)
    # TODO: Implement price matching when available
    
    return min(score, 1.0)  # Cap at 1.0

def generate_reasons(factory: Factory, need_profile: Dict[str, Any]) -> List[str]:
    """Generate reasons why this factory matches"""
    reasons = []
    
    if factory.rating and factory.rating > 4.0:
        reasons.append("high quality rating")
    
    if factory.certifications:
        reasons.append("has certifications")
    
    if factory.moq and factory.moq < 1000:
        reasons.append("low MOQ")
    
    if factory.lead_time_days and factory.lead_time_days < 30:
        reasons.append("fast lead time")
    
    return reasons

def generate_highlights(factory: Factory, need_profile: Dict[str, Any]) -> Dict[str, List[str]]:
    """Generate highlights for the factory"""
    highlights = {}
    
    if factory.certifications:
        highlights["certs"] = factory.certifications
    
    if factory.country:
        highlights["region"] = [factory.country]
    
    return highlights

def extract_capabilities(factory: Factory) -> List[str]:
    """Extract capabilities from factory data"""
    capabilities = []
    
    if factory.name:
        # Simple capability extraction based on name
        name_lower = factory.name.lower()
        if any(word in name_lower for word in ["textile", "garment", "clothing"]):
            capabilities.append("textiles")
        if any(word in name_lower for word in ["manufacturing", "production"]):
            capabilities.append("manufacturing")
        if any(word in name_lower for word in ["cut", "sew"]):
            capabilities.append("cut & sew")
    
    return capabilities

async def generate_explanation(factory: Factory, need_profile: Dict[str, Any], query: str) -> str:
    """Generate LLM explanation for why this factory matches"""
    try:
        # TODO: Implement real LLM explanation generation
        # For now, return a simple explanation
        return f"Best match for {query} based on capabilities and location."
    except Exception as e:
        print(f"[DEBUG] Explanation generation failed: {e}")
        return None

# Image + text search endpoint
@app.post("/api/search/unified/multipart", response_model=UnifiedSearchResponse)
async def unified_multipart_search(
    q: Optional[str] = Form(""),
    topK: Optional[int] = Form(10),
    files: List[UploadFile] = File(...)
):
    """
    Unified search endpoint for image + text searches
    """
    try:
        start_time = time.time()
        text_query = (q or "").strip()
        k = int(topK or 10)
        
        if len(files) == 0:
            raise HTTPException(status_code=400, detail="At least one image is required for multipart search.")

        # Determine search mode and execute
        if files and len(files) > 0:
            # Image search (with optional text boost)
            print(f"[DEBUG] Running image search with {len(files)} files, text: '{text_query}'")
            
            # Validate files
            for file in files:
                if not file.content_type or not file.content_type.startswith('image/'):
                    raise HTTPException(status_code=400, detail=f"File {file.filename} is not an image")
                
                # Check file size (12MB limit)
                file.file.seek(0, 2)
                file_size = file.file.tell()
                file.file.seek(0)
                
                if file_size > 12 * 1024 * 1024:  # 12MB
                    raise HTTPException(status_code=413, detail=f"File {file.filename} is too large (max 12MB)")

            # Create temporary directory for processing
            temp_dir = tempfile.mkdtemp(prefix="unified_search_")
            
            try:
                # Save uploaded files
                image_paths = []
                for file in files:
                    file_extension = os.path.splitext(file.filename or '')[1] or '.jpg'
                    temp_filename = f"{uuid.uuid4()}{file_extension}"
                    temp_path = os.path.join(temp_dir, temp_filename)
                    
                    with open(temp_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                    
                    image_paths.append(temp_path)
                
                # Analyze images with Mistral
                print(f"[DEBUG] Analyzing {len(image_paths)} images with Mistral...")
                attributes_list = []
                
                for i, image_path in enumerate(image_paths):
                    print(f"[DEBUG] Analyzing image {i+1}/{len(image_paths)}")
                    try:
                        attributes = await analyze_image_with_mistral(image_path, text_query)
                        attributes_list.append(attributes)
                    except Exception as e:
                        print(f"[ERROR] Failed to analyze image {i+1}: {str(e)}")
                        continue
                
                if not attributes_list:
                    raise HTTPException(status_code=500, detail="Failed to analyze any images")
                
                # Merge attributes from all images
                merged_attributes = merge_image_attributes(attributes_list)
                print(f"[DEBUG] Merged attributes: {merged_attributes}")
                
                # Match factories based on attributes
                print(f"[DEBUG] Matching factories...")
                matched_factories = match_factories_by_attributes(merged_attributes, k)
                
                search_time = time.time() - start_time
                mode = "image+text" if text_query else "image"
                
                return UnifiedSearchResponse(
                    mode=mode,
                    results=matched_factories,
                    total_found=len(matched_factories),
                    search_time=round(search_time, 3),
                    extracted_attributes=merged_attributes
                )
                
            finally:
                # Clean up temporary files
                shutil.rmtree(temp_dir, ignore_errors=True)
        else:
            # Text-only search
            print(f"[DEBUG] Running text-only search: '{text_query}'")
            
            # Use existing text search logic
            results = await text_only_factory_search(text_query, k)
            
            search_time = time.time() - start_time
            
            return UnifiedSearchResponse(
                mode="text",
                results=results,
                total_found=len(results),
                search_time=round(search_time, 3)
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unified search error: {str(e)}", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unified search failed: {str(e)}")

# ==== LEGACY ENDPOINTS (410 Gone) ====

@app.post("/api/search/reverse-image")
async def legacy_reverse_image_search():
    """Legacy endpoint - use /api/search/unified instead"""
    raise HTTPException(status_code=410, detail="Use /api/search/unified instead")

@app.post("/api/search")
async def legacy_search():
    """Legacy endpoint - use /api/search/unified instead"""
    raise HTTPException(status_code=410, detail="Use /api/search/unified instead")

# ==== QUOTE API ENDPOINT ====

class QuoteRequest(BaseModel):
    form: Dict[str, Any]
    factory: Dict[str, Any]

class GenerateQuoteRequest(BaseModel):
    factoryId: str
    payload: Dict[str, Any]

class QuoteResponse(BaseModel):
    productName: str
    description: str
    specifications: str
    quantity: int
    unitPrice: float
    subtotal: float
    tax: float
    shipping: float
    total: float
    deliveryTime: str
    terms: str
    validity: str
    invoiceNumber: str
    date: str
    dueDate: str
    notes: str | None = None

async def callLLMToComputeQuote(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Compute quote using LLM or deterministic fallback"""
    form = payload.get('form', {})
    factory = payload.get('factory', {})
    
    # Minimal validation
    quantity = max(1, int(form.get('quantity', 0) or 0))
    
    # Example deterministic calc (can be replaced with Mistral's output)
    target_price = float(form.get('targetPrice', 0) or 0)
    base_unit = target_price if target_price > 0 else 9.75  # fallback baseline
    
    # Add some factory-specific pricing logic
    factory_rating = float(factory.get('rating', 4.5))
    rating_multiplier = 0.8 + (factory_rating - 4.0) * 0.1  # 0.8 to 1.1 range
    
    unit_price = base_unit * rating_multiplier
    unit_price = round(unit_price, 2)
    
    subtotal = unit_price * quantity
    tax = round(subtotal * 0.1, 2)  # 10%
    
    # Shipping will be handled separately in fulfillment
    shipping = 0  # No shipping in quote calculation
    
    total = round(subtotal + tax, 2)
    
    today = datetime.now()
    due_date = datetime(today.year, today.month + 1, today.day) if today.month < 12 else datetime(today.year + 1, 1, today.day)
    
    # Handle specifications - convert object to string if needed
    specs = form.get('specifications', 'Technical specifications')
    if isinstance(specs, dict):
        if specs:  # If dict is not empty
            specs = ', '.join([f"{k}: {v}" for k, v in specs.items()])
        else:  # If dict is empty
            specs = 'Technical specifications'
    
    return {
        "productName": form.get('productName', 'Custom Product'),
        "description": form.get('description', 'Product description'),
        "specifications": specs,
        "quantity": quantity,
        "unitPrice": unit_price,
        "subtotal": round(subtotal, 2),
        "tax": tax,
        "shipping": shipping,
        "total": total,
        "deliveryTime": factory.get('avgDeliveryTime') or '20-25 days',
        "terms": "30% advance, 70% on delivery",
        "validity": "30 days",
        "invoiceNumber": f"INV-{int(datetime.now().timestamp()) % 1000000:06d}",
        "date": today.strftime("%m/%d/%Y"),
        "dueDate": due_date.strftime("%m/%d/%Y"),
        "notes": "Price includes basic packaging. Custom packaging available at additional cost."
    }


# ==== LOGISTICS API ENDPOINT ====

class LogisticsRequest(BaseModel):
    factory: Dict[str, Any]
    destination: str
    quote: Dict[str, Any] | None = None

class RouteSuggestion(BaseModel):
    id: int
    route: str
    carrier: str
    estimatedTime: str
    cost: float
    reliability: int
    description: str
    transportType: str
    recommended: bool

class LogisticsResponse(BaseModel):
    suggestions: List[RouteSuggestion]
    totalOptions: int
    bestOption: RouteSuggestion

async def generateLogisticsSuggestions(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generate AI-powered logistics route suggestions"""
    factory = payload.get('factory', {})
    destination = payload.get('destination', '')
    quote = payload.get('quote', {})
    
    # Extract factory location
    factory_location = factory.get('location', 'Unknown')
    
    # Mock AI-powered route suggestions based on factory location and destination
    suggestions = []
    
    # Air Freight (always available, fastest)
    air_cost = 1200 if 'China' in factory_location else 1000
    suggestions.append({
        "id": 1,
        "route": "Air Freight",
        "carrier": "DHL Express" if 'China' in factory_location else "FedEx International",
        "estimatedTime": "3-5 days",
        "cost": air_cost,
        "reliability": 95,
        "description": "Fastest option with premium service and real-time tracking",
        "transportType": "air",
        "recommended": True
    })
    
    # Sea Freight (most cost-effective for large shipments)
    sea_cost = 400 if 'China' in factory_location else 500
    suggestions.append({
        "id": 2,
        "route": "Sea Freight",
        "carrier": "Maersk Line" if 'China' in factory_location else "CMA CGM",
        "estimatedTime": "15-20 days",
        "cost": sea_cost,
        "reliability": 90,
        "description": "Most cost-effective for large shipments with container tracking",
        "transportType": "sea",
        "recommended": False
    })
    
    # Rail + Truck (balanced option)
    rail_cost = 650 if 'China' in factory_location else 750
    suggestions.append({
        "id": 3,
        "route": "Rail + Truck",
        "carrier": "China Railway Express" if 'China' in factory_location else "DB Schenker",
        "estimatedTime": "8-12 days",
        "cost": rail_cost,
        "reliability": 85,
        "description": "Balanced option for speed and cost with multimodal tracking",
        "transportType": "rail",
        "recommended": False
    })
    
    # Road Freight (direct delivery)
    road_cost = 700 if 'China' in factory_location else 800
    suggestions.append({
        "id": 4,
        "route": "Road Freight",
        "carrier": "FedEx Ground" if 'China' in factory_location else "UPS Freight",
        "estimatedTime": "10-15 days",
        "cost": road_cost,
        "reliability": 88,
        "description": "Direct delivery with comprehensive tracking and insurance",
        "transportType": "road",
        "recommended": False
    })
    
    # Adjust costs based on quote if provided
    if quote and quote.get('quantity', 0) > 1000:
        # Volume discount for large shipments
        for suggestion in suggestions:
            suggestion['cost'] = suggestion['cost'] * 0.8
            suggestion['description'] += " (Volume discount applied)"
    
    # Find best option (lowest cost per day)
    best_option = min(suggestions, key=lambda x: x['cost'] / int(x['estimatedTime'].split('-')[0]))
    best_option['recommended'] = True
    
    return {
        "suggestions": suggestions,
        "totalOptions": len(suggestions),
        "bestOption": best_option
    }

@app.post("/api/logistics/suggestions", response_model=LogisticsResponse)
async def get_logistics_suggestions(request: LogisticsRequest):
    """Get AI-powered logistics route suggestions"""
    try:
        print(f"[DEBUG] Received logistics request: factory={request.factory}, destination={request.destination}", flush=True)
        result = await generateLogisticsSuggestions(request.model_dump())
        print(f"[DEBUG] Generated {len(result['suggestions'])} route suggestions", flush=True)
        return LogisticsResponse(**result)
    except Exception as e:
        print(f"[ERROR] Logistics suggestions failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to generate logistics suggestions")

# ==== QUOTES API ENDPOINTS ====

class QuoteInput(BaseModel):
    productName: str
    description: str = ""
    quantity: int
    specifications: Dict[str, Any] = {}
    materials: List[Dict[str, Any]] = []
    targetUnitCost: float = 0.0
    incoterm: str = "FOB"
    shipFrom: str = ""
    shipTo: str = ""
    desiredLeadTimeDays: int = 30
    packaging: str = ""
    sizes: List[Dict[str, Any]] = []
    notes: str = ""
    region: str = "APAC"
    targetPrice: float = 0.0

class QuoteCalc(BaseModel):
    unitCost: float
    toolingCost: float = 0.0
    freightEstimate: float = 0.0
    tariffEstimate: float = 0.0
    moqAdjustment: float = 0.0
    marginEstimate: float = 0.0
    currency: str = "USD"
    breakdown: List[Dict[str, Any]] = []
    subtotal: float
    tax: float
    total: float
    deliveryTime: str
    terms: str
    validity: str
    invoiceNumber: str
    date: str
    dueDate: str
    notes: str = ""

class SaveQuoteRequest(BaseModel):
    factoryId: str
    factoryName: str
    status: str
    input: QuoteInput
    calc: Optional[QuoteCalc] = None
    source: Optional[str] = "internal"
    sourceId: Optional[str] = None
    storefrontUrl: Optional[str] = None

class Quote(BaseModel):
    id: str
    factoryId: str
    factoryName: str
    status: str
    input: QuoteInput
    calc: Optional[QuoteCalc] = None
    createdAt: str
    updatedAt: str
    source: Optional[str] = "internal"
    sourceId: Optional[str] = None
    storefrontUrl: Optional[str] = None

# In-memory storage for quotes (in production, use a database)
quotes_storage = []

# In-memory storage for shipping routes and invoices
shipping_routes_storage = [
    {
        "id": "ROUTE-001",
        "name": "Standard Sea Freight",
        "from": "Shenzhen, China",
        "to": "Los Angeles, USA",
        "carrier": "COSCO Shipping",
        "estimatedDays": 18,
        "cost": 450,
        "currency": "USD",
        "serviceType": "standard"
    },
    {
        "id": "ROUTE-002", 
        "name": "Express Air Freight",
        "from": "Guangzhou, China",
        "to": "New York, USA",
        "carrier": "DHL Express",
        "estimatedDays": 5,
        "cost": 1200,
        "currency": "USD",
        "serviceType": "express"
    },
    {
        "id": "ROUTE-003",
        "name": "Economy Sea Freight", 
        "from": "Shanghai, China",
        "to": "Miami, USA",
        "carrier": "Maersk",
        "estimatedDays": 22,
        "cost": 380,
        "currency": "USD",
        "serviceType": "standard"
    }
]

invoices_storage = []

@app.post("/api/quote", response_model=QuoteCalc)
async def generate_quote(request: GenerateQuoteRequest):
    """Generate a deterministic quote based on form and factory data"""
    try:
        # Convert the request format to match what callLLMToComputeQuote expects
        # We need to get factory data and format the request properly
        factory_data = {"id": request.factoryId, "name": "Factory", "country": "Unknown"}  # Basic factory data
        formatted_request = {
            "form": request.payload,
            "factory": factory_data
        }
        result = await callLLMToComputeQuote(formatted_request)
        
        # Convert QuoteResponse to QuoteCalc format
        quote_calc = {
            "unitCost": result.get("unitPrice", 0.0),
            "toolingCost": 0.0,
            "freightEstimate": 0.0,
            "tariffEstimate": 0.0,
            "moqAdjustment": 0.0,
            "marginEstimate": 0.0,
            "currency": "USD",
            "breakdown": [],
            "subtotal": result.get("subtotal", 0.0),
            "tax": result.get("tax", 0.0),
            "total": result.get("total", 0.0),
            "deliveryTime": result.get("deliveryTime", "20-25 days"),
            "terms": result.get("terms", "30% advance, 70% on delivery"),
            "validity": result.get("validity", "30 days"),
            "invoiceNumber": result.get("invoiceNumber", ""),
            "date": result.get("date", ""),
            "dueDate": result.get("dueDate", ""),
            "notes": result.get("notes", "")
        }
        return QuoteCalc(**quote_calc)
    except Exception as e:
        print(f"[ERROR] Quote generation failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to compute quote")

@app.post("/api/quotes/generate", response_model=QuoteCalc)
async def generate_quote_endpoint(request: QuoteRequest):
    """Generate a quote calculation"""
    try:
        result = await callLLMToComputeQuote(request.model_dump())
        return QuoteCalc(**result)
    except Exception as e:
        print(f"[ERROR] Quote generation failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to generate quote")

@app.post("/api/quotes", response_model=Quote)
async def create_quote(request: SaveQuoteRequest):
    """Create a new quote"""
    try:
        quote_id = f"QUOTE-{int(datetime.now().timestamp()) % 1000000:06d}"
        quote = {
            "id": quote_id,
            "factoryId": request.factoryId,
            "factoryName": request.factoryName,
            "status": request.status,
            "input": request.input.model_dump(),
            "calc": request.calc.model_dump() if request.calc else None,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "source": request.source or "internal",
            "sourceId": request.sourceId,
            "storefrontUrl": request.storefrontUrl
        }
        quotes_storage.append(quote)
        print(f"[DEBUG] Created quote: {quote_id}", flush=True)
        return Quote(**quote)
    except Exception as e:
        print(f"[ERROR] Quote creation failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to create quote")

# ==== SHIPPING ROUTES API ====

@app.get("/api/shipping-routes")
async def get_shipping_routes():
    """Get available shipping routes"""
    return {"routes": shipping_routes_storage}

# ==== INVOICES API ====

class InvoiceRequest(BaseModel):
    quoteId: str
    shippingRouteId: str
    billTo: Dict[str, Any]
    shipTo: Dict[str, Any]
    notes: Optional[str] = ""

class InvoiceResponse(BaseModel):
    id: str
    quoteId: str
    invoiceNumber: str
    date: str
    dueDate: str
    billTo: Dict[str, Any]
    shipTo: Dict[str, Any]
    items: List[Dict[str, Any]]
    subtotal: float
    tax: float
    shipping: float
    total: float
    currency: str
    terms: str
    notes: Optional[str] = ""
    status: str
    createdAt: str
    updatedAt: str

@app.post("/api/invoices", response_model=InvoiceResponse)
async def create_invoice(request: InvoiceRequest):
    """Create a new invoice from a quote and shipping route"""
    try:
        # Find the quote
        quote = None
        for q in quotes_storage:
            if q["id"] == request.quoteId:
                quote = q
                break
        
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Find the shipping route
        route = None
        for r in shipping_routes_storage:
            if r["id"] == request.shippingRouteId:
                route = r
                break
        
        if not route:
            raise HTTPException(status_code=404, detail="Shipping route not found")
        
        # Generate invoice
        invoice_id = f"INV-{int(datetime.now().timestamp()) % 1000000:06d}"
        invoice_number = f"INV-{int(datetime.now().timestamp()) % 1000000:06d}"
        
        # Calculate totals
        quote_calc = quote.get("calc", {})
        subtotal = quote_calc.get("subtotal", 0)
        tax = quote_calc.get("tax", 0)
        shipping_cost = route.get("cost", 0)
        total = subtotal + tax + shipping_cost
        
        # Create invoice items
        items = [{
            "id": f"ITEM-{invoice_id}",
            "description": quote["input"].get("productName", "Product"),
            "quantity": quote["input"].get("quantity", 1),
            "unitPrice": quote_calc.get("unitCost", 0),
            "total": subtotal,
            "currency": quote_calc.get("currency", "USD")
        }]
        
        invoice = {
            "id": invoice_id,
            "quoteId": request.quoteId,
            "invoiceNumber": invoice_number,
            "date": datetime.now().isoformat().split('T')[0],
            "dueDate": (datetime.now() + timedelta(days=30)).isoformat().split('T')[0],
            "billTo": request.billTo,
            "shipTo": request.shipTo,
            "items": items,
            "subtotal": subtotal,
            "tax": tax,
            "shipping": shipping_cost,
            "total": total,
            "currency": quote_calc.get("currency", "USD"),
            "terms": "Net 30 days",
            "notes": request.notes,
            "status": "draft",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        invoices_storage.append(invoice)
        print(f"[DEBUG] Created invoice: {invoice_id}", flush=True)
        
        return InvoiceResponse(**invoice)
        
    except Exception as e:
        print(f"[ERROR] Invoice creation failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to create invoice")

@app.get("/api/invoices")
async def get_invoices():
    """Get all invoices"""
    return {"invoices": invoices_storage}

@app.get("/api/invoices/{invoice_id}")
async def get_invoice(invoice_id: str) -> Dict[str, Any]:
    """Get a specific invoice"""
    for invoice in invoices_storage:
        if invoice["id"] == invoice_id:
            return invoice
    raise HTTPException(status_code=404, detail="Invoice not found")

@app.get("/api/quotes", response_model=List[Quote])
async def list_quotes(
    search: str | None = None,
    status: str | None = None,
    factoryId: str | None = None,
    limit: int = 50,
    offset: int = 0
):
    """List quotes with optional filtering"""
    try:
        filtered_quotes = quotes_storage.copy()
        
        if search:
            filtered_quotes = [
                q for q in filtered_quotes 
                if search.lower() in q["factoryName"].lower() or 
                   search.lower() in q["input"]["productName"].lower()
            ]
        
        if status:
            filtered_quotes = [q for q in filtered_quotes if q["status"] == status]
        
        if factoryId:
            filtered_quotes = [q for q in filtered_quotes if q["factoryId"] == factoryId]
        
        # Sort by creation date (newest first)
        filtered_quotes.sort(key=lambda x: x["createdAt"], reverse=True)
        
        # Apply pagination
        paginated_quotes = filtered_quotes[offset:offset + limit]
        
        return [Quote(**quote) for quote in paginated_quotes]
    except Exception as e:
        print(f"[ERROR] Failed to list quotes: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to list quotes")

@app.get("/api/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str):
    """Get a specific quote by ID"""
    try:
        quote = next((q for q in quotes_storage if q["id"] == quote_id), None)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        return Quote(**quote)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to get quote: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to get quote")

@app.patch("/api/quotes/{quote_id}", response_model=Quote)
async def update_quote(quote_id: str, patch: Dict[str, Any]):
    """Update a quote"""
    try:
        quote_index = next((i for i, q in enumerate(quotes_storage) if q["id"] == quote_id), None)
        if quote_index is None:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Update the quote
        quotes_storage[quote_index].update(patch)
        quotes_storage[quote_index]["updatedAt"] = datetime.now().isoformat()
        
        print(f"[DEBUG] Updated quote: {quote_id}", flush=True)
        return Quote(**quotes_storage[quote_index])
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to update quote: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to update quote")

@app.delete("/api/quotes/{quote_id}")
async def delete_quote(quote_id: str):
    """Delete a quote"""
    try:
        quote_index = next((i for i, q in enumerate(quotes_storage) if q["id"] == quote_id), None)
        if quote_index is None:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        del quotes_storage[quote_index]
        print(f"[DEBUG] Deleted quote: {quote_id}", flush=True)
        return {"message": "Quote deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to delete quote: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to delete quote")

# ==== ORDERS API ENDPOINT ====

class OrderRequest(BaseModel):
    orderNumber: str
    customer: str
    factory: str
    product: str
    quantity: int
    unitPrice: float
    total: float
    status: str
    orderDate: str
    deliveryDate: str
    priority: str
    notes: str = ""

class OrderResponse(BaseModel):
    id: str
    orderNumber: str
    customer: str
    factory: str
    product: str
    quantity: int
    unitPrice: float
    total: float
    status: str
    orderDate: str
    deliveryDate: str
    priority: str
    notes: str

@app.post("/api/orders", response_model=OrderResponse)
async def create_order(request: OrderRequest):
    """Create a new order"""
    try:
        order_id = f"ORD-{int(datetime.now().timestamp()) % 1000000:06d}"
        order = {
            "id": order_id,
            "orderNumber": request.orderNumber,
            "customer": request.customer,
            "factory": request.factory,
            "product": request.product,
            "quantity": request.quantity,
            "unitPrice": request.unitPrice,
            "total": request.total,
            "status": request.status,
            "orderDate": request.orderDate,
            "deliveryDate": request.deliveryDate,
            "priority": request.priority,
            "notes": request.notes
        }
        print(f"[DEBUG] Created order: {order_id}", flush=True)
        return OrderResponse(**order)
    except Exception as e:
        print(f"[ERROR] Order creation failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to create order")

@app.get("/api/orders", response_model=List[OrderResponse])
async def get_orders():
    """Get all orders"""
    try:
        # Return mock orders for now
        mock_orders = [
            {
                "id": "ORD-001",
                "orderNumber": "PO-2024-001",
                "customer": "TechCorp Inc.",
                "factory": "Shenzhen Electronics Co.",
                "product": "Smartphone Cases",
                "quantity": 1000,
                "unitPrice": 8.50,
                "total": 8500,
                "status": "fulfilled",
                "orderDate": "2024-01-15",
                "deliveryDate": "2024-02-15",
                "priority": "high",
                "notes": "Rush order for product launch"
            }
        ]
        return [OrderResponse(**order) for order in mock_orders]
    except Exception as e:
        print(f"[ERROR] Failed to get orders: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to get orders")

# ==== CONTACTS API ENDPOINT ====

class ContactRequest(BaseModel):
    factoryName: str
    contactName: str
    position: str
    phone: str
    whatsapp: str
    email: str
    address: str
    website: str
    specialties: List[str]
    rating: float
    status: str
    notes: str = ""

class ContactResponse(BaseModel):
    id: str
    factoryName: str
    contactName: str
    position: str
    phone: str
    whatsapp: str
    email: str
    address: str
    website: str
    specialties: List[str]
    rating: float
    lastContact: str
    status: str
    notes: str

@app.post("/api/contacts", response_model=ContactResponse)
async def create_contact(request: ContactRequest):
    """Create a new factory contact"""
    try:
        contact_id = f"CONT-{int(datetime.now().timestamp()) % 1000000:06d}"
        contact = {
            "id": contact_id,
            "factoryName": request.factoryName,
            "contactName": request.contactName,
            "position": request.position,
            "phone": request.phone,
            "whatsapp": request.whatsapp,
            "email": request.email,
            "address": request.address,
            "website": request.website,
            "specialties": request.specialties,
            "rating": request.rating,
            "lastContact": datetime.now().strftime("%Y-%m-%d"),
            "status": request.status,
            "notes": request.notes
        }
        print(f"[DEBUG] Created contact: {contact_id}", flush=True)
        return ContactResponse(**contact)
    except Exception as e:
        print(f"[ERROR] Contact creation failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to create contact")

@app.get("/api/contacts", response_model=List[ContactResponse])
async def get_contacts():
    """Get all factory contacts"""
    try:
        # Return mock contacts for now
        mock_contacts = [
            {
                "id": "CONT-001",
                "factoryName": "Shenzhen Electronics Co.",
                "contactName": "Li Wei",
                "position": "Sales Manager",
                "phone": "+86 138 0013 8000",
                "whatsapp": "+86 138 0013 8000",
                "email": "li.wei@shenzhen-electronics.com",
                "address": "Shenzhen, Guangdong, China",
                "website": "www.shenzhen-electronics.com",
                "specialties": ["Electronics", "Consumer Goods", "Smart Devices"],
                "rating": 4.8,
                "lastContact": "2024-01-15",
                "status": "active",
                "notes": "Excellent communication, fast response times"
            }
        ]
        return [ContactResponse(**contact) for contact in mock_contacts]
    except Exception as e:
        print(f"[ERROR] Failed to get contacts: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to get contacts")

# ==== FINANCES API ENDPOINT ====

class TransactionRequest(BaseModel):
    date: str
    description: str
    category: str
    subcategory: str
    amount: float
    type: str
    status: str
    reference: str

class TransactionResponse(BaseModel):
    id: str
    date: str
    description: str
    category: str
    subcategory: str
    amount: float
    type: str
    status: str
    reference: str

@app.post("/api/finances/transactions", response_model=TransactionResponse)
async def create_transaction(request: TransactionRequest):
    """Create a new financial transaction"""
    try:
        transaction_id = f"TXN-{int(datetime.now().timestamp()) % 1000000:06d}"
        transaction = {
            "id": transaction_id,
            "date": request.date,
            "description": request.description,
            "category": request.category,
            "subcategory": request.subcategory,
            "amount": request.amount,
            "type": request.type,
            "status": request.status,
            "reference": request.reference
        }
        print(f"[DEBUG] Created transaction: {transaction_id}", flush=True)
        return TransactionResponse(**transaction)
    except Exception as e:
        print(f"[ERROR] Transaction creation failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to create transaction")

@app.get("/api/finances/transactions", response_model=List[TransactionResponse])
async def get_transactions():
    """Get all financial transactions"""
    try:
        # Return mock transactions for now
        mock_transactions = [
            {
                "id": "TXN-001",
                "date": "2024-01-15",
                "description": "Payment from TechCorp Inc.",
                "category": "Revenue",
                "subcategory": "Product Sales",
                "amount": 8500,
                "type": "income",
                "status": "completed",
                "reference": "PO-2024-001"
            }
        ]
        return [TransactionResponse(**transaction) for transaction in mock_transactions]
    except Exception as e:
        print(f"[ERROR] Failed to get transactions: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to get transactions")

# ==== INTEGRATIONS API ENDPOINTS ====

class IntegrationRequest(BaseModel):
    service: str
    credentials: Optional[Dict[str, Any]] = None

class IntegrationResponse(BaseModel):
    service: str
    connected: bool
    status: str
    lastSync: Optional[str] = None
    businessName: Optional[str] = None
    accountId: Optional[str] = None

@app.post("/api/integrations/connect")
async def connect_integration(request: IntegrationRequest):
    """Connect to an external service (WhatsApp, Stripe, Alibaba)"""
    try:
        # Simulate connection process
        service = request.service.lower()
        
        if service == "whatsapp":
            # Simulate WhatsApp Business API connection
            return IntegrationResponse(
                service="whatsapp",
                connected=True,
                status="connected",
                lastSync=datetime.now().isoformat(),
                businessName="My Business",
                accountId="whatsapp_business_123"
            )
        elif service == "stripe":
            # Simulate Stripe API connection
            return IntegrationResponse(
                service="stripe",
                connected=True,
                status="connected",
                lastSync=datetime.now().isoformat(),
                businessName="Stripe Account",
                accountId="acct_stripe_123"
            )
        elif service == "alibaba":
            # Simulate Alibaba API connection
            return IntegrationResponse(
                service="alibaba",
                connected=True,
                status="connected",
                lastSync=datetime.now().isoformat(),
                businessName="Alibaba Account",
                accountId="alibaba_123"
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported service")
            
    except Exception as e:
        print(f"[ERROR] Failed to connect integration: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to connect integration")

@app.post("/api/integrations/sync")
async def sync_integration(request: IntegrationRequest):
    """Sync data from an external service"""
    try:
        service = request.service.lower()
        
        # Simulate sync process
        if service in ["whatsapp", "stripe", "alibaba"]:
            return {
                "service": service,
                "status": "synced",
                "lastSync": datetime.now().isoformat(),
                "recordsUpdated": 15,
                "message": f"Successfully synced {service} data"
            }
        else:
            raise HTTPException(status_code=400, detail="Unsupported service")
            
    except Exception as e:
        print(f"[ERROR] Failed to sync integration: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to sync integration")

@app.post("/api/integrations/disconnect")
async def disconnect_integration(request: IntegrationRequest):
    """Disconnect from an external service"""
    try:
        service = request.service.lower()
        
        # Simulate disconnection
        return {
            "service": service,
            "connected": False,
            "status": "disconnected",
            "message": f"Successfully disconnected from {service}"
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to disconnect integration: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to disconnect integration")

@app.get("/api/integrations/status")
async def get_integration_status():
    """Get status of all integrations"""
    try:
        # Return mock status for all integrations
        return {
            "integrations": {
                "whatsapp": {
                    "connected": False,
                    "status": "disconnected",
                    "lastSync": None
                },
                "stripe": {
                    "connected": False,
                    "status": "disconnected",
                    "lastSync": None
                },
                "alibaba": {
                    "connected": False,
                    "status": "disconnected",
                    "lastSync": None
                }
            }
        }
    except Exception as e:
        print(f"[ERROR] Failed to get integration status: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to get integration status")

# Include routers
app.include_router(portfolio_router)
# app.include_router(alibaba_router)  # Temporarily disabled due to import issues
app.include_router(alibaba_routes)
app.include_router(algo_outputs_router, prefix=API_PREFIX, tags=["algo-outputs"])
app.include_router(integrations_alibaba_router, prefix=API_PREFIX, tags=["integrations:alibaba"])
# Removed goals_router - using real goals API
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(admin_router, prefix="/api", tags=["admin"])
app.include_router(ranking_router, prefix="/api/rank", tags=["ranking"])
app.include_router(cost_router, prefix="/api", tags=["cost"])
app.include_router(logistics_router, prefix="/api", tags=["logistics"])
app.include_router(regulations_router, prefix="/api", tags=["logistics"])
app.include_router(ingest_upload_router, prefix="/api", tags=["ingest"])
app.include_router(ingest_preview_router, prefix="/api", tags=["ingest"])
app.include_router(ingest_commit_router, prefix="/api", tags=["ingest"])
app.include_router(ingest_rescan_router, prefix="/api", tags=["ingest"])
app.include_router(ai_search_router, prefix="/api", tags=["ai"])
app.include_router(ai_fulfillment_router, prefix="/api", tags=["ai"])
app.include_router(suggestions_router, prefix="/api", tags=["ai"])
app.include_router(admin_stats_router, tags=["admin"])
app.include_router(ingest_report_router, tags=["ingest"])
app.include_router(suppliers_summary_router)
app.include_router(saved_quotes_router)
app.include_router(factories_router)
app.include_router(saved_router)
app.include_router(quotes_router)
app.include_router(supply_metrics_router)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    
    # Start auto-ingestion daemon
    def _start_ingest_daemon():
        try:
            print("[STARTUP] 🚀 Starting auto-ingestion daemon...")
            # One-time scan at boot
            def _bootstrap():
                try:
                    bootstrap_scan()
                except Exception as e:
                    print(f"[STARTUP] ❌ Bootstrap scan failed: {e}")
            Thread(target=_bootstrap, daemon=True).start()

            # Long-running watcher (polling)
            def _watch():
                try:
                    watch_loop()
                except Exception as e:
                    print(f"[STARTUP] ❌ File watcher failed: {e}")
            Thread(target=_watch, daemon=True).start()
            
            print("[STARTUP] ✅ Auto-ingestion daemon started successfully")
        except Exception as e:
            print(f"[STARTUP] ❌ Failed to start auto-ingestion daemon: {e}")
        
        Thread(target=_start_ingest_daemon, daemon=True).start()
        
        # Start suggestions scheduler
        def _start_suggestions():
            try:
                print("[STARTUP] 🚀 Starting SLA suggestions scheduler...")
                start_scheduler()
                print("[STARTUP] ✅ SLA suggestions scheduler started successfully")
            except Exception as e:
                print(f"[STARTUP] ❌ Failed to start suggestions scheduler: {e}")
        
        Thread(target=_start_suggestions, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 