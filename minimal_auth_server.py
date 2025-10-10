#!/usr/bin/env python3
"""
Minimal API server with just auth router
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth_router import auth_router
from suppliers_router import router as suppliers_router
from database import init_db

# Create minimal app
app = FastAPI(title="SLA Auth API", version="1.0.0")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:3000",
        "https://*.app",  # Lovable preview domains
        "https://*.vercel.app",  # Vercel preview domains
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "x-csrf-token"],
    max_age=86400
)

# Include auth router
app.include_router(auth_router, prefix="/api", tags=["auth"])

# Include suppliers router
app.include_router(suppliers_router, prefix="/api", tags=["suppliers"])

# Health endpoint
@app.get("/api/v1/health")
def health():
    return {"ok": True, "service": "sla-api"}

@app.on_event("startup")
async def startup_event():
    """Initialize database and seed dev user."""
    import logging
    log = logging.getLogger("startup")
    
    # Log environment and database info
    env = os.getenv("ENV", "unknown")
    db_url = os.getenv("DATABASE_URL", "sqlite:///./sla.db")
    log.info("🚀 SLA Auth Server starting...")
    log.info("ENV=%s DATABASE_URL=%s", env, db_url)
    
    init_db()
    log.info("✅ Database initialized successfully")
    
    # Seed dev user if in dev environment
    if env == "dev":
        try:
            from seed_dev_user import seed_dev_user
            log.info("🌱 Seeding dev user...")
            seed_dev_user()
            log.info("✅ Dev user seeded successfully")
        except Exception as e:
            log.error("⚠️  Failed to seed dev user: %s", e)
    else:
        log.info("⏭️  Skipping dev user seeding (ENV != dev)")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
