"""
Seed script to create admin user and sample data for SLA admin dashboard.
"""
import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, init_db
from models import (
    User, Organization, DemoRequest, Quote, Factory, Job, FeatureFlag, 
    AuditLog, WebhookEvent, Role, DemoRequestStatus, QuoteStatus, 
    JobType, JobStatus
)
from auth import create_admin_user, get_password_hash

def create_sample_data():
    """Create sample data for the admin dashboard."""
    db = SessionLocal()
    
    try:
        # Create organizations
        org1 = Organization(
            name="Acme Manufacturing",
            plan="pro",
            region="North America",
            flags={"feature_x": True, "beta_access": True}
        )
        org2 = Organization(
            name="Global Textiles Ltd",
            plan="enterprise",
            region="Asia",
            flags={"feature_x": True, "beta_access": False}
        )
        org3 = Organization(
            name="Fashion Forward Inc",
            plan="free",
            region="Europe",
            flags={"feature_x": False, "beta_access": False}
        )
        
        db.add_all([org1, org2, org3])
        db.commit()
        db.refresh(org1)
        db.refresh(org2)
        db.refresh(org3)
        
        # Create admin users
        admin_user = create_admin_user(
            db=db,
            email="admin@socflow.ai",
            password="admin123",
            name="System Administrator",
            role=Role.superadmin
        )
        
        analyst_user = create_admin_user(
            db=db,
            email="analyst@socflow.ai",
            password="analyst123",
            name="Data Analyst",
            role=Role.analyst
        )
        
        support_user = create_admin_user(
            db=db,
            email="support@socflow.ai",
            password="support123",
            name="Support Agent",
            role=Role.support
        )
        
        # Create regular users
        regular_user1 = User(
            email="john@acme.com",
            name="John Smith",
            hashed_password=get_password_hash("password123"),
            role=Role.support,
            is_admin=False,
            org_id=org1.id
        )
        
        regular_user2 = User(
            email="sarah@globaltextiles.com",
            name="Sarah Johnson",
            hashed_password=get_password_hash("password123"),
            role=Role.support,
            is_admin=False,
            org_id=org2.id
        )
        
        db.add_all([regular_user1, regular_user2])
        db.commit()
        db.refresh(regular_user1)
        db.refresh(regular_user2)
        
        # Create demo requests
        demo_requests = [
            DemoRequest(
                org_id=org1.id,
                contact_name="Mike Chen",
                contact_email="mike@acme.com",
                contact_phone="+1-555-0123",
                company_name="Acme Manufacturing",
                note="Interested in denim manufacturing capabilities",
                status=DemoRequestStatus.new,
                assignee_id=support_user.id
            ),
            DemoRequest(
                org_id=org2.id,
                contact_name="Lisa Wang",
                contact_email="lisa@globaltextiles.com",
                contact_phone="+86-138-0013-8000",
                company_name="Global Textiles Ltd",
                note="Need help with sustainable textile sourcing",
                status=DemoRequestStatus.contacted,
                assignee_id=analyst_user.id
            ),
            DemoRequest(
                org_id=org3.id,
                contact_name="Emma Thompson",
                contact_email="emma@fashionforward.com",
                contact_phone="+44-20-7946-0958",
                company_name="Fashion Forward Inc",
                note="Looking for activewear manufacturers",
                status=DemoRequestStatus.scheduled,
                assignee_id=support_user.id
            ),
            DemoRequest(
                org_id=None,
                contact_name="David Rodriguez",
                contact_email="david@startup.com",
                contact_phone="+1-555-0456",
                company_name="Startup Co",
                note="New startup looking for manufacturing partners",
                status=DemoRequestStatus.done,
                assignee_id=analyst_user.id,
                resolved_at=datetime.utcnow() - timedelta(days=2)
            )
        ]
        
        db.add_all(demo_requests)
        db.commit()
        
        # Create factories
        factories = [
            Factory(
                name="Shanghai Textile Co",
                country="China",
                city="Shanghai",
                certifications=["ISO 9001", "OEKO-TEX"],
                moq=1000,
                lead_time_days=30,
                rating=4.5,
                contact_email="info@shanghaitextile.com",
                contact_phone="+86-21-1234-5678",
                website="https://shanghaitextile.com"
            ),
            Factory(
                name="Bangladesh Garments Ltd",
                country="Bangladesh",
                city="Dhaka",
                certifications=["WRAP", "BSCI"],
                moq=500,
                lead_time_days=45,
                rating=4.2,
                contact_email="orders@bdgarments.com",
                contact_phone="+880-2-1234-5678"
            ),
            Factory(
                name="Vietnam Manufacturing Hub",
                country="Vietnam",
                city="Ho Chi Minh City",
                certifications=["ISO 9001", "SA8000"],
                moq=2000,
                lead_time_days=35,
                rating=4.7,
                contact_email="sales@vmh.com",
                contact_phone="+84-28-1234-5678"
            )
        ]
        
        db.add_all(factories)
        db.commit()
        db.refresh(factories[0])
        db.refresh(factories[1])
        db.refresh(factories[2])
        
        # Create quotes
        quotes = [
            Quote(
                org_id=org1.id,
                sku="DENIM-001",
                factory_id=factories[0].id,
                qty=5000,
                incoterm="FOB",
                est_unit_cost=12.50,
                margin=0.25,
                status=QuoteStatus.calculated
            ),
            Quote(
                org_id=org2.id,
                sku="TEXTILE-002",
                factory_id=factories[1].id,
                qty=10000,
                incoterm="CIF",
                est_unit_cost=8.75,
                margin=0.30,
                status=QuoteStatus.sent
            ),
            Quote(
                org_id=org3.id,
                sku="ACTIVE-003",
                factory_id=factories[2].id,
                qty=3000,
                incoterm="EXW",
                est_unit_cost=15.00,
                margin=0.20,
                status=QuoteStatus.accepted
            )
        ]
        
        db.add_all(quotes)
        db.commit()
        
        # Create jobs
        jobs = [
            Job(
                type=JobType.index,
                payload={"source": "csv", "file": "factories.csv"},
                status=JobStatus.success,
                started_at=datetime.utcnow() - timedelta(hours=2),
                finished_at=datetime.utcnow() - timedelta(hours=1)
            ),
            Job(
                type=JobType.quote_calc,
                payload={"quote_id": 1, "formula": "standard"},
                status=JobStatus.running,
                started_at=datetime.utcnow() - timedelta(minutes=30)
            ),
            Job(
                type=JobType.webhook,
                payload={"provider": "stripe", "event": "payment.succeeded"},
                status=JobStatus.failed,
                started_at=datetime.utcnow() - timedelta(hours=1),
                finished_at=datetime.utcnow() - timedelta(minutes=30),
                error="Webhook endpoint timeout"
            )
        ]
        
        db.add_all(jobs)
        db.commit()
        
        # Create feature flags
        feature_flags = [
            FeatureFlag(
                key="new_dashboard",
                description="Enable new dashboard UI",
                enabled_global=False,
                enabled_orgs=[org1.id, org2.id]
            ),
            FeatureFlag(
                key="ai_recommendations",
                description="AI-powered factory recommendations",
                enabled_global=True,
                enabled_orgs=[]
            ),
            FeatureFlag(
                key="advanced_analytics",
                description="Advanced analytics features",
                enabled_global=False,
                enabled_orgs=[org2.id]
            )
        ]
        
        db.add_all(feature_flags)
        db.commit()
        
        # Create webhook events
        webhook_events = [
            WebhookEvent(
                provider="stripe",
                event_type="payment.succeeded",
                payload={"amount": 10000, "currency": "usd"},
                status="delivered"
            ),
            WebhookEvent(
                provider="alibaba",
                event_type="order.updated",
                payload={"order_id": "12345", "status": "shipped"},
                status="delivered"
            ),
            WebhookEvent(
                provider="stripe",
                event_type="payment.failed",
                payload={"amount": 5000, "currency": "usd"},
                status="failed",
                retry_count=3,
                last_retry_at=datetime.utcnow() - timedelta(hours=1)
            )
        ]
        
        db.add_all(webhook_events)
        db.commit()
        
        # Create audit logs
        audit_logs = [
            AuditLog(
                actor_user_id=admin_user.id,
                entity="user",
                entity_id=str(analyst_user.id),
                action="create",
                after={"email": analyst_user.email, "role": "analyst"},
                ip_address="127.0.0.1",
                user_agent="Mozilla/5.0 (Admin Tool)",
                at=datetime.utcnow() - timedelta(hours=1)
            ),
            AuditLog(
                actor_user_id=analyst_user.id,
                entity="demo_request",
                entity_id="1",
                action="update",
                before={"status": "new"},
                after={"status": "contacted"},
                ip_address="127.0.0.1",
                user_agent="Mozilla/5.0 (Admin Tool)",
                at=datetime.utcnow() - timedelta(minutes=30)
            )
        ]
        
        db.add_all(audit_logs)
        db.commit()
        
        print("✅ Sample data created successfully!")
        print(f"📧 Admin user: admin@socflow.ai / admin123")
        print(f"📧 Analyst user: analyst@socflow.ai / analyst123")
        print(f"📧 Support user: support@socflow.ai / support123")
        print(f"📊 Created {len(demo_requests)} demo requests")
        print(f"🏭 Created {len(factories)} factories")
        print(f"💰 Created {len(quotes)} quotes")
        print(f"⚙️ Created {len(jobs)} jobs")
        print(f"🚩 Created {len(feature_flags)} feature flags")
        print(f"🔗 Created {len(webhook_events)} webhook events")
        print(f"📝 Created {len(audit_logs)} audit logs")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding admin dashboard data...")
    init_db()
    create_sample_data()
    print("🎉 Seeding completed!")
