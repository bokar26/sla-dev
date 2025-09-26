from __future__ import annotations
from typing import Dict, Any, List
import sqlite3
from pathlib import Path

# Simple data access layer - replace with proper ORM later
def get_db_connection():
    """Get database connection to the main SQLite database"""
    # Get the project root directory (3 levels up from this file: data -> sla_ai_components -> project_root)
    project_root = Path(__file__).parent.parent.parent
    db_path = project_root / "sla.db"
    return sqlite3.connect(str(db_path))

def fetch_factories_for_spec(spec: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Fetch factories that match the spec criteria.
    For now, return a simple subset based on category and origin hints.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Simple query - can be enhanced with more sophisticated matching
        query = "SELECT id, name, country, city FROM factories LIMIT 20"
        cursor.execute(query)
        
        factories = []
        for row in cursor.fetchall():
            factories.append({
                "factory_id": f"F{row[0]:03d}",  # Convert to F001 format
                "factory_name": row[1], 
                "country_iso2": row[2],
                "city": row[3]
            })
        
        return factories
    finally:
        conn.close()

def fetch_lane_candidates(spec: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Fetch shipping lanes that match the spec criteria.
    For now, return a simple subset based on origin/destination hints.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if lanes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='lanes'")
        if not cursor.fetchone():
            # Return mock lanes if table doesn't exist
            return [
                {"lane_id": "IN-US-001", "origin_port": "Mumbai", "dest_port": "Los Angeles", "mode": "ocean", "rate": 150.0, "transit_days_p50": 20.0, "on_time_rate": 0.95, "congestion_index": 0.1},
                {"lane_id": "CN-US-001", "origin_port": "Shanghai", "dest_port": "Long Beach", "mode": "ocean", "rate": 140.0, "transit_days_p50": 18.0, "on_time_rate": 0.92, "congestion_index": 0.15},
                {"lane_id": "VN-US-001", "origin_port": "Ho Chi Minh", "dest_port": "New York", "mode": "ocean", "rate": 160.0, "transit_days_p50": 22.0, "on_time_rate": 0.88, "congestion_index": 0.2},
                {"lane_id": "IN-US-AIR-001", "origin_port": "Mumbai", "dest_port": "Los Angeles", "mode": "air", "rate": 5.0, "transit_days_p50": 3.0, "on_time_rate": 0.98, "congestion_index": 0.05},
                {"lane_id": "CN-US-AIR-001", "origin_port": "Shanghai", "dest_port": "Long Beach", "mode": "air", "rate": 4.5, "transit_days_p50": 2.5, "on_time_rate": 0.96, "congestion_index": 0.08},
                {"lane_id": "VN-US-AIR-001", "origin_port": "Ho Chi Minh", "dest_port": "New York", "mode": "air", "rate": 5.5, "transit_days_p50": 4.0, "on_time_rate": 0.94, "congestion_index": 0.12}
            ]
        
        # Simple query - can be enhanced with more sophisticated matching
        query = "SELECT lane_id, origin_port, dest_port, mode FROM lanes LIMIT 20"
        cursor.execute(query)
        
        lanes = []
        for row in cursor.fetchall():
            lanes.append({
                "lane_id": row[0],
                "origin_port": row[1],
                "dest_port": row[2], 
                "mode": row[3]
            })
        
        return lanes
    finally:
        conn.close()

def fetch_material_index_map():
    """Fetch material index mapping for ranking"""
    # Mock implementation - replace with real data
    return {
        "cotton": 0.8,
        "polyester": 0.6,
        "wool": 0.9,
        "nylon": 0.5
    }

def fetch_factory_embeddings():
    """Fetch factory embeddings for ranking"""
    # Mock implementation - replace with real data
    return {}

def fetch_lane_embeddings():
    """Fetch lane embeddings for ranking"""
    # Mock implementation - replace with real data
    return {}

def count_distinct_vendors() -> int:
    """
    Return count of distinct vendors using vendor_name (preferred) else factory_name.
    This dedupes across all ingested sheets. Must return int and never raise.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if factories table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='factories'")
        if not cursor.fetchone():
            return 0
        
        # Count distinct vendors using the name column
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
    """
    Return total count of all factory records in the database.
    This includes all factory locations, even if they belong to the same vendor.
    Must return int and never raise.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if factories table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='factories'")
        if not cursor.fetchone():
            return 0
        
        # Count all factory records
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

def fetch_suppliers_summary(limit: int = 5) -> Dict[str, Any]:
    """
    Fetch a summary of suppliers for the Supply Center snapshot.
    Returns total count and limited list of suppliers with key details.
    Must return dict and never raise.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if factories table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='factories'")
        if not cursor.fetchone():
            return {"total": 0, "items": []}

        # Get total count
        cursor.execute("SELECT COUNT(*) FROM factories")
        total_result = cursor.fetchone()
        total = int(total_result[0]) if total_result and total_result[0] is not None else 0

        # Get limited list of suppliers with key details
        query = """
        SELECT
            id,
            name,
            country,
            city,
            updated_at
        FROM factories
        WHERE COALESCE(NULLIF(TRIM(name), ''), '') <> ''
        ORDER BY updated_at DESC, name ASC
        LIMIT ?
        """

        cursor.execute(query, (limit,))
        rows = cursor.fetchall()

        items = []
        for row in rows:
            items.append({
                "id": f"sup_{row[0]}",
                "vendor_name": row[1] or "Unnamed Supplier",
                "country_iso2": row[2],
                "city": row[3],
                "category": None,  # No category column in factories table
                "updated_at": row[4]
            })

        return {"total": total, "items": items}

    except Exception as e:
        print(f"Error fetching suppliers summary: {e}")
        return {"total": 0, "items": []}
    finally:
        try:
            conn.close()
        except:
            pass

def fetch_saved_quotes(limit: int = 100) -> List[Dict[str, Any]]:
    """
    Fetch saved quotes for the Fulfillment page.
    Returns list of quotes with origin information from factories.
    Must return list and never raise.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if quotes and factories tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'")
        if not cursor.fetchone():
            return []

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='factories'")
        if not cursor.fetchone():
            return []

        # Join quotes with factories to get origin information
        query = """
        SELECT 
            q.id,
            q.sku,
            q.qty,
            q.incoterm,
            q.est_unit_cost,
            q.status,
            q.created_at,
            f.name as vendor_name,
            f.country as origin_country_iso2,
            f.city as origin_city
        FROM quotes q
        LEFT JOIN factories f ON q.factory_id = f.id
        WHERE q.status IN ('sent', 'accepted', 'calculated')
        ORDER BY q.created_at DESC
        LIMIT ?
        """

        cursor.execute(query, (limit,))
        rows = cursor.fetchall()

        items = []
        for row in rows:
            # Generate a reference number
            ref = f"Q-2025-{row[0]:04d}"
            
            items.append({
                "id": f"q_{row[0]}",
                "ref": ref,
                "product": row[1],  # sku
                "vendor_name": row[7] or "Unknown Vendor",
                "origin_city": row[9],  # city
                "origin_country_iso2": row[8],  # country
                "origin_port_code": None,  # Not available in current schema
                "incoterm": row[3],
                "weight_kg": None,  # Not available in current schema
                "volume_cbm": None,  # Not available in current schema
                "ready_date": None,  # Not available in current schema
                "qty": row[2],
                "unit_cost": row[4],
                "status": row[5],
                "created_at": row[6]
            })

        return items

    except Exception as e:
        print(f"Error fetching saved quotes: {e}")
        return []
    finally:
        try:
            conn.close()
        except:
            pass

def get_factory_details(factory_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed information for a specific factory.
    Returns factory details or None if not found.
    Must return dict or None and never raise.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if factories table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='factories'")
        if not cursor.fetchone():
            return None

        # Get factory details by ID
        query = """
        SELECT 
            id,
            name,
            country,
            city,
            certifications,
            moq,
            lead_time_days,
            rating,
            contact_email,
            contact_phone,
            website
        FROM factories
        WHERE id = ?
        """

        cursor.execute(query, (factory_id,))
        row = cursor.fetchone()

        if not row:
            return None

        # Parse certifications JSON if it exists
        certifications = []
        if row[4]:  # certifications column
            try:
                import json
                certifications = json.loads(row[4]) if row[4] else []
            except:
                certifications = []

        return {
            "id": str(row[0]),
            "vendor_name": row[1] or "Unknown Factory",
            "site_name": row[1],  # Use same as vendor_name for now
            "country_iso2": row[2],
            "city": row[3],
            "capabilities": [],  # Not available in current schema
            "certifications": certifications,
            "past_clients": [],  # Not available in current schema
            "moq": row[5],
            "lead_time_days": row[6],
            "images": []  # Not available in current schema
        }

    except Exception as e:
        print(f"Error fetching factory details: {e}")
        return None
    finally:
        try:
            conn.close()
        except:
            pass

def save_factory_to_saved(factory_id: str) -> None:
    """
    Save a factory to the saved factories list.
    Idempotent operation - can be called multiple times safely.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Create saved_factories table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS saved_factories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                factory_id TEXT NOT NULL UNIQUE,
                saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Insert or ignore (idempotent)
        cursor.execute("""
            INSERT OR IGNORE INTO saved_factories (factory_id)
            VALUES (?)
        """, (factory_id,))

        conn.commit()

    except Exception as e:
        print(f"Error saving factory: {e}")
        try:
            conn.rollback()
        except:
            pass
    finally:
        try:
            conn.close()
        except:
            pass

def create_quote_in_db(quote_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Create a new quote in the database.
    Returns the created quote ID and reference number.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert the quote
        cursor.execute("""
            INSERT INTO quotes (
                org_id, sku, factory_id, qty, incoterm, 
                est_unit_cost, margin, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            1,  # Default org_id
            quote_data.get('product_type', 'Custom'),
            quote_data.get('factory_id'),
            quote_data.get('quantity', 1000),
            'FOB',  # Default incoterm
            10.0,  # Default unit cost
            0.25,  # Default margin
            'calculated'
        ))

        quote_id = cursor.lastrowid
        ref = f"Q-2025-{quote_id:04d}"

        conn.commit()

        return {
            "id": f"q_{quote_id}",
            "ref": ref
        }

    except Exception as e:
        print(f"Error creating quote: {e}")
        try:
            conn.rollback()
        except:
            pass
        raise e
    finally:
        try:
            conn.close()
        except:
            pass