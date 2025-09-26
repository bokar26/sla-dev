#!/usr/bin/env python3
"""
Import verification script for sla_ai_components package.
This script verifies that all imports referenced in api_server.py work correctly.
"""

import importlib
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def test_imports():
    """Test all imports referenced in api_server.py"""
    
    # API modules that should export 'router'
    api_modules = [
        "sla_ai_components.api.ranking",
        "sla_ai_components.api.cost", 
        "sla_ai_components.api.logistics",
        "sla_ai_components.api.regulations",
        "sla_ai_components.api.upload",
        "sla_ai_components.api.preview",
        "sla_ai_components.api.commit",
        "sla_ai_components.api.rescan",
        "sla_ai_components.api.ai_search",
        "sla_ai_components.api.ai_fulfillment",
        "sla_ai_components.api.suggestions",
    ]
    
    # Non-API modules that should export specific functions
    other_modules = [
        ("sla_ai_components.ingest.daemon", ["bootstrap_scan", "watch_loop"]),
        ("sla_ai_components.suggestions.scheduler", ["start_scheduler"]),
    ]
    
    print("🔍 Testing API module imports...")
    failed_imports = []
    
    for module_name in api_modules:
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, 'router'):
                print(f"✅ {module_name} - router found")
            else:
                print(f"❌ {module_name} - router not found")
                failed_imports.append(module_name)
        except ImportError as e:
            print(f"❌ {module_name} - Import failed: {e}")
            failed_imports.append(module_name)
        except Exception as e:
            print(f"❌ {module_name} - Error: {e}")
            failed_imports.append(module_name)
    
    print("\n🔍 Testing non-API module imports...")
    for module_name, expected_functions in other_modules:
        try:
            module = importlib.import_module(module_name)
            missing_functions = []
            for func_name in expected_functions:
                if hasattr(module, func_name):
                    print(f"✅ {module_name}.{func_name} - found")
                else:
                    print(f"❌ {module_name}.{func_name} - not found")
                    missing_functions.append(func_name)
            
            if missing_functions:
                failed_imports.append(f"{module_name} (missing: {', '.join(missing_functions)})")
                
        except ImportError as e:
            print(f"❌ {module_name} - Import failed: {e}")
            failed_imports.append(module_name)
        except Exception as e:
            print(f"❌ {module_name} - Error: {e}")
            failed_imports.append(module_name)
    
    print("\n" + "="*50)
    if failed_imports:
        print(f"❌ {len(failed_imports)} imports failed:")
        for failed in failed_imports:
            print(f"  - {failed}")
        return False
    else:
        print("✅ All imports resolved successfully!")
        return True

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
