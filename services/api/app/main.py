from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))
load_dotenv()  # also load process/env and root .env if present

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.settings import settings
from .internal_index import init_index, internal_count, by_country
import logging

# Allow your dev UI origins. Add your deployed origin when you deploy.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5174",  # Add the new port
]

# Log API key status (masked for security)
masked = lambda v: (v[:4] + "…" + v[-3:]) if v and len(v) > 8 else ("set" if v else "missing")
logging.info("API keys: OPENAI=%s",
             masked(getattr(settings, 'OPENAI_API_KEY', None)))

app = FastAPI(title="SLA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + ["*"],  # keep "*" for dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    dp = os.getenv("SUPPLIERS_DATA") or getattr(settings, 'SUPPLIERS_DATA', None)
    if dp:
        init_index(dp)
        logging.info(f"Initialized internal index with {internal_count()} suppliers")
    else:
        logging.warning("SUPPLIERS_DATA not set, internal index will be empty")

# Health endpoints - dual mount
@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/v1/health")
def health_v1():
    return {"ok": True, "env": "dev"}

@app.get("/api/v1/health")
def health_api_v1():
    return {"ok": True, "env": "dev"}

@app.get("/v1/debug/internal-health")
def internal_health():
    from .internal_index import internal_count, by_country, data_path_info, index_meta
    return {
        "count": internal_count(),
        "by_country": by_country(),
        "data_path": data_path_info(),
        "index_meta": index_meta(),
    }

# Import and mount only the routes we need
from .routes import suppliers, integration, internal_debug, fulfillment, vision, supplier_details, search_clean, debug
from .routers import llm_search as llm_search_router
from .routers import debug_openai as debug_openai_router
from .routers import llm_fulfillment as llm_fulfillment_router

# Mount routes at /v1/...
app.include_router(suppliers.router)
app.include_router(integration.router)
app.include_router(internal_debug.router)
app.include_router(fulfillment.router)
app.include_router(vision.router)
app.include_router(supplier_details.router)
app.include_router(search_clean.router)
app.include_router(debug.router)
app.include_router(llm_search_router.router)
app.include_router(debug_openai_router.router)
app.include_router(llm_fulfillment_router.router)

# Also mount at /api/v1/... (dual path to avoid FE/Proxy mismatch)
app.include_router(suppliers.router, prefix="/api")
app.include_router(integration.router, prefix="/api")
app.include_router(internal_debug.router, prefix="/api")
app.include_router(fulfillment.router, prefix="/api")
app.include_router(vision.router, prefix="/api")
app.include_router(supplier_details.router, prefix="/api")
app.include_router(search_clean.router, prefix="/api")
app.include_router(debug.router, prefix="/api")
app.include_router(llm_search_router.router, prefix="/api")
app.include_router(debug_openai_router.router, prefix="/api")
app.include_router(llm_fulfillment_router.router, prefix="/api")