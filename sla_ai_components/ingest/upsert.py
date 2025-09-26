from __future__ import annotations
import pandas as pd
from typing import Dict, Any
import sqlite3
from pathlib import Path

def get_db_connection():
    """Get database connection to the main SQLite database"""
    project_root = Path(__file__).parent.parent.parent
    db_path = project_root / "sla.db"
    return sqlite3.connect(str(db_path))

def upsert_factories(df: pd.DataFrame):
    """Upsert factories to the database"""
    if df.empty:
        print("[UPSERT] No factories to upsert")
        return
    
    print(f"[UPSERT] Upserting {len(df)} factories")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        for _, row in df.iterrows():
            factory_name = row.get('factory_name', 'Unknown')
            country = row.get('country_iso2', row.get('country', 'Unknown'))
            city = row.get('city', '')
            certifications = row.get('certifications', '[]')
            moq = row.get('moq', 0)
            lead_time_days = row.get('lead_time_days', 0)
            rating = row.get('rating', 0.0)
            contact_email = row.get('contact_email', '')
            contact_phone = row.get('contact_phone', '')
            website = row.get('website', '')
            tenant_id = row.get('tenant_id', 'tenant_demo')
            source_upload_id = row.get('source_upload_id', 0)
            factory_vec = row.get('factory_vec', '')
            
            # Insert or update factory
            cursor.execute("""
                INSERT OR REPLACE INTO factories 
                (name, country, city, certifications, moq, lead_time_days, rating, 
                 contact_email, contact_phone, website, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """, (factory_name, country, city, certifications, moq, lead_time_days, rating,
                  contact_email, contact_phone, website))
            
        conn.commit()
        print(f"[UPSERT] Successfully upserted {len(df)} factories")
        
    except Exception as e:
        print(f"[UPSERT] Error upserting factories: {e}")
        conn.rollback()
    finally:
        conn.close()

def upsert_material_prices(df: pd.DataFrame):
    """Upsert material prices to the database"""
    print(f"[UPSERT] Would upsert {len(df)} material prices")
    for _, row in df.iterrows():
        print(f"[UPSERT] Material: {row.get('material_id', 'Unknown')} at ${row.get('price_usd_per_unit', 0)}")

def upsert_lanes(df: pd.DataFrame):
    """Upsert lanes to the database"""
    print(f"[UPSERT] Would upsert {len(df)} lanes")
    for _, row in df.iterrows():
        print(f"[UPSERT] Lane: {row.get('origin_port', 'Unknown')} -> {row.get('dest_port', 'Unknown')}")

def upsert_shipper_rates(df: pd.DataFrame):
    """Upsert shipper rates to the database"""
    print(f"[UPSERT] Would upsert {len(df)} shipper rates")
    for _, row in df.iterrows():
        print(f"[UPSERT] Rate: {row.get('carrier', 'Unknown')} on lane {row.get('lane_id', 'Unknown')}")
