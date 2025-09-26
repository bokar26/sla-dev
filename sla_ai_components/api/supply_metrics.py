from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from sla_ai_components.data.repos import get_db_connection

router = APIRouter(prefix="/api", tags=["metrics"])

class SupplyMetrics(BaseModel):
    total_revenue_cents: int                # last 30 days (or all-time if you prefer)
    commission_cents: int                   # SLA commission earned (same period)
    open_orders: int                        # current open orders
    time_saved_minutes: int                 # SLA-estimated time saved (last 30 days)
    time_baseline_minutes: int              # estimated minutes without SLA for same tasks/period
    cost_saved_cents: int                   # money saved with SLA
    cost_baseline_cents: int                # estimated cost without SLA for same period (savings + actual)

def _repo_total_revenue_cents_last_30d() -> Optional[int]:
    """Calculate total revenue from quotes/orders in last 30 days."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if quotes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'")
        if not cursor.fetchone():
            return 0
        
        # Calculate revenue from quotes (est_unit_cost * qty)
        cursor.execute("""
            SELECT SUM(est_unit_cost * qty) as total_revenue
            FROM quotes
            WHERE created_at >= datetime('now', '-30 days')
        """)
        row = cursor.fetchone()
        total_revenue = row[0] if row and row[0] else 0
        
        # Convert to cents (assuming est_unit_cost is in dollars)
        return int(total_revenue * 100)
        
    except Exception as e:
        print(f"Error calculating revenue: {e}")
        return 0
    finally:
        try:
            conn.close()
        except:
            pass

def _repo_total_commission_cents_last_30d() -> Optional[int]:
    """Calculate SLA commission from quotes in last 30 days."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if quotes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'")
        if not cursor.fetchone():
            return 0
        
        # Calculate commission (total_revenue * margin)
        cursor.execute("""
            SELECT SUM(est_unit_cost * qty * margin) as total_commission
            FROM quotes
            WHERE created_at >= datetime('now', '-30 days')
        """)
        row = cursor.fetchone()
        total_commission = row[0] if row and row[0] else 0
        
        # Convert to cents
        return int(total_commission * 100)
        
    except Exception as e:
        print(f"Error calculating commission: {e}")
        return 0
    finally:
        try:
            conn.close()
        except:
            pass

def _repo_open_orders_count() -> Optional[int]:
    """Count current open orders."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if quotes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'")
        if not cursor.fetchone():
            return 0
        
        # Count quotes with status 'calculated' or 'pending'
        cursor.execute("""
            SELECT COUNT(*) as open_count
            FROM quotes
            WHERE status IN ('calculated', 'pending', 'in_progress')
        """)
        row = cursor.fetchone()
        return row[0] if row else 0
        
    except Exception as e:
        print(f"Error counting open orders: {e}")
        return 0
    finally:
        try:
            conn.close()
        except:
            pass

def _repo_time_saved_minutes_last_30d() -> Optional[int]:
    """Estimate time saved by SLA in last 30 days."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if quotes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'")
        if not cursor.fetchone():
            return 0
        
        # Estimate time saved: 2 hours per quote (120 minutes)
        cursor.execute("""
            SELECT COUNT(*) * 120 as time_saved
            FROM quotes
            WHERE created_at >= datetime('now', '-30 days')
        """)
        row = cursor.fetchone()
        return row[0] if row else 0
        
    except Exception as e:
        print(f"Error calculating time saved: {e}")
        return 0
    finally:
        try:
            conn.close()
        except:
            pass

def _repo_time_baseline_minutes_last_30d() -> Optional[int]:
    """Estimate baseline time without SLA for same period."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if quotes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'")
        if not cursor.fetchone():
            return 1  # avoid division by zero
        
        # Estimate baseline: 6 hours per quote without SLA (360 minutes)
        cursor.execute("""
            SELECT COUNT(*) * 360 as time_baseline
            FROM quotes
            WHERE created_at >= datetime('now', '-30 days')
        """)
        row = cursor.fetchone()
        return max(1, row[0] if row else 1)  # ensure at least 1 to avoid division by zero
        
    except Exception as e:
        print(f"Error calculating time baseline: {e}")
        return 1
    finally:
        try:
            conn.close()
        except:
            pass

def _repo_cost_saved_cents_last_30d() -> Optional[int]:
    """Calculate cost saved with SLA in last 30 days."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if quotes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'")
        if not cursor.fetchone():
            return 0
        
        # Estimate cost saved: 15% savings on total revenue
        cursor.execute("""
            SELECT SUM(est_unit_cost * qty) * 0.15 as cost_saved
            FROM quotes
            WHERE created_at >= datetime('now', '-30 days')
        """)
        row = cursor.fetchone()
        total_saved = row[0] if row and row[0] else 0
        
        # Convert to cents
        return int(total_saved * 100)
        
    except Exception as e:
        print(f"Error calculating cost saved: {e}")
        return 0
    finally:
        try:
            conn.close()
        except:
            pass

def _repo_cost_baseline_cents_last_30d() -> Optional[int]:
    """Calculate baseline cost without SLA for same period."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if quotes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'")
        if not cursor.fetchone():
            return 1  # avoid division by zero
        
        # Calculate baseline: total revenue + cost saved (what would've been spent without SLA)
        cursor.execute("""
            SELECT SUM(est_unit_cost * qty) * 1.15 as cost_baseline
            FROM quotes
            WHERE created_at >= datetime('now', '-30 days')
        """)
        row = cursor.fetchone()
        total_baseline = row[0] if row and row[0] else 0
        
        # Convert to cents and ensure at least 1
        return max(1, int(total_baseline * 100))
        
    except Exception as e:
        print(f"Error calculating cost baseline: {e}")
        return 1
    finally:
        try:
            conn.close()
        except:
            pass

@router.get("/metrics/supply_center", response_model=SupplyMetrics)
def supply_center_metrics():
    """
    Get supply center metrics including revenue, commission, open orders, time saved, and baselines.
    """
    # Calculate metrics from database
    total_revenue_cents = _repo_total_revenue_cents_last_30d() or 0
    commission_cents    = _repo_total_commission_cents_last_30d() or 0
    open_orders         = _repo_open_orders_count() or 0
    time_saved_minutes  = _repo_time_saved_minutes_last_30d() or 0
    time_baseline_minutes = _repo_time_baseline_minutes_last_30d() or 1
    cost_saved_cents    = _repo_cost_saved_cents_last_30d() or 0
    cost_baseline_cents = _repo_cost_baseline_cents_last_30d() or 1
    
    return {
        "total_revenue_cents": int(total_revenue_cents),
        "commission_cents": int(commission_cents),
        "open_orders": int(open_orders),
        "time_saved_minutes": int(time_saved_minutes),
        "time_baseline_minutes": int(time_baseline_minutes),
        "cost_saved_cents": int(cost_saved_cents),
        "cost_baseline_cents": int(cost_baseline_cents),
    }
