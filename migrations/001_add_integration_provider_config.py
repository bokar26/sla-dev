"""
Migration to add IntegrationProviderConfig table for BYOA support.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from models import Base
import os

def run_migration():
    """Run the migration to add IntegrationProviderConfig table"""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./sla.db")
    engine = create_engine(database_url)
    
    # Create all tables (SQLite will skip existing ones)
    Base.metadata.create_all(engine)
    
    print("✅ Migration completed: IntegrationProviderConfig table created")

if __name__ == "__main__":
    run_migration()
