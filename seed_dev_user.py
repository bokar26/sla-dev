#!/usr/bin/env python3
"""
Dev-only user seeder for SLA app.
Creates/updates the test user sla@test.com with password 1234567
"""
import os
import sys
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User, Role
from auth import get_password_hash

log = logging.getLogger("seed_dev_user")

DEV_EMAIL = "sla@test.com"
DEV_PASSWORD = "1234567"

def seed_dev_user():
    """Create or update the dev test user."""
    if os.getenv("ENV") != "dev":
        log.info("⚠️  Skipping dev user seeding - ENV is not 'dev'")
        return
    
    log.info("🌱 Starting dev user seeding...")
    
    db = SessionLocal()
    try:
        # Check if user exists (case-insensitive)
        existing_user = db.query(User).filter(func.lower(User.email) == DEV_EMAIL.lower()).first()
        
        if existing_user:
            log.info("🔄 Updating existing dev user: %s", DEV_EMAIL)
            existing_user.hashed_password = get_password_hash(DEV_PASSWORD)
            existing_user.role = Role.superadmin
            existing_user.is_admin = True
            existing_user.is_active = True
            db.commit()
            log.info("✅ Dev user updated: %s (role: %s, active: %s)", 
                    DEV_EMAIL, existing_user.role, existing_user.is_active)
        else:
            log.info("🆕 Creating new dev user: %s", DEV_EMAIL)
            dev_user = User(
                email=DEV_EMAIL,
                name="SLA Test User",
                hashed_password=get_password_hash(DEV_PASSWORD),
                role=Role.superadmin,
                is_admin=True,
                is_active=True,
                org_id=None
            )
            db.add(dev_user)
            db.commit()
            log.info("✅ Dev user created: %s (role: %s, active: %s)", 
                    DEV_EMAIL, dev_user.role, dev_user.is_active)
            
        # Verify the user was created/updated correctly
        verify_user = db.query(User).filter(func.lower(User.email) == DEV_EMAIL.lower()).first()
        if verify_user:
            log.info("🔍 Verification: User %s exists with role %s, active: %s", 
                    verify_user.email, verify_user.role, verify_user.is_active)
        else:
            log.error("❌ Verification failed: User not found after seeding")
            
    except Exception as e:
        log.error("❌ Error seeding dev user: %s", e)
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    log.info("🌱 Seeding dev user...")
    seed_dev_user()
    log.info("🎉 Dev user seeding completed!")
