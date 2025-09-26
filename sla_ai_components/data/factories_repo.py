from typing import Optional, Dict, Any, List
import re
from sla_ai_components.data.repos import get_db_connection

def _as_int(x):
    """Convert value to int, returning None for empty/invalid values."""
    if x is None: 
        return None
    if isinstance(x, (int, float)) and not isinstance(x, bool):
        return int(x)
    s = str(x).strip()
    if not s: 
        return None
    # Remove non-numeric characters and convert
    s = re.sub(r"[^\d]", "", s)
    return int(s) if s else None

def _split_list(x):
    """Split text into list, handling various separators."""
    if not x: 
        return []
    if isinstance(x, list): 
        return [str(i).strip() for i in x if str(i).strip()]
    s = str(x)
    # Split on common separators: semicolon, comma, slash, pipe
    parts = re.split(r"[;,/|]", s)
    return [p.strip() for p in parts if p.strip()]

def _sql_fetchone(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Execute SQL query and return first row as dict."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        if not row:
            return None
        
        # Get column names
        columns = [description[0] for description in cursor.description]
        return dict(zip(columns, row))
    except Exception as e:
        print(f"SQL query error: {e}")
        return None
    finally:
        try:
            conn.close()
        except:
            pass

def _sql_fetchall(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Execute SQL query and return all rows as list of dicts."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        if not rows:
            return []
        
        # Get column names
        columns = [description[0] for description in cursor.description]
        return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        print(f"SQL query error: {e}")
        return []
    finally:
        try:
            conn.close()
        except:
            pass

def get_factory_full(factory_id: str) -> Optional[Dict[str, Any]]:
    """
    Return a rich details dict for a factory.
    Maps columns from our ingested data with proper normalization.
    """
    # First try the factories table (current schema)
    core = _sql_fetchone("""
        SELECT
            id AS factory_id,
            name AS vendor_name,
            name AS site_name,
            city,
            country AS country_iso2,
            moq,
            lead_time_days,
            certifications,
            contact_email,
            contact_phone,
            website,
            rating
        FROM factories
        WHERE id = ?
        LIMIT 1
    """, (factory_id,))
    
    if not core:
        return None

    # Normalize numbers - don't coerce missing values to 0
    moq = _as_int(core.get("moq"))
    lead = _as_int(core.get("lead_time_days"))
    cap = None  # Not available in current schema

    # Parse certifications from JSON or text
    certs = []
    cert_text = core.get("certifications")
    if cert_text:
        try:
            import json
            certs = json.loads(cert_text) if cert_text else []
            if not isinstance(certs, list):
                certs = _split_list(cert_text)
        except:
            certs = _split_list(cert_text)

    # For now, capabilities and past_clients are empty (not in current schema)
    caps = []
    clnts = []

    # Images are not available in current schema
    images = []

    return {
        "id": str(core["factory_id"]),
        "vendor_name": core.get("vendor_name"),
        "site_name": core.get("site_name"),
        "city": core.get("city"),
        "country_iso2": core.get("country_iso2"),
        "moq": moq,
        "lead_time_days": lead,
        "capacity_units_month": cap,
        "capabilities": caps,
        "certifications": certs,
        "past_clients": clnts,
        "images": images,
        "contact_email": core.get("contact_email"),
        "contact_phone": core.get("contact_phone"),
        "website": core.get("website"),
        "rating": core.get("rating")
    }

def get_search_fallback(factory_id: str) -> Dict[str, Any]:
    """
    If some fields are missing, hydrate from the search index/cache.
    This provides fallback data from the search results.
    """
    # For now, return empty dict as we don't have a search index cache
    # In a full implementation, this would query the in-memory search index
    return {}

def get_factory_full_hydrated(factory_id: str) -> Optional[Dict[str, Any]]:
    """
    Get factory details with fallback hydration from search index.
    """
    base = get_factory_full(factory_id)
    if not base:
        return None
    
    # Fill blanks from search row (but do NOT overwrite non-empty values)
    fb = get_search_fallback(factory_id)
    for k, v in fb.items():
        if base.get(k) in (None, "", [], 0):
            base[k] = v
    
    return base
