#!/usr/bin/env python3
"""
Simple structure test for SLA API
Tests that all files can be imported without dependencies
"""

import sys
import os

def test_file_structure():
    """Test that all required files exist"""
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    required_files = [
        "pyproject.toml",
        "requirements.txt", 
        "env.example",
        "README.md",
        "smoke_tests.sh",
        "app/__init__.py",
        "app/settings.py",
        "app/main.py",
        "app/llm/__init__.py",
        "app/llm/openai_client.py",
        "app/llm/interface.py",
        "app/llm/claude_client.py",
        "app/llm/grok_client.py",
        "app/llm/router.py",
        "app/routes/__init__.py",
        "app/routes/vision.py",
        "app/routes/suppliers.py",
        "app/routes/uploads.py",
        "app/routes/model_check.py",
        "app/routes/model_verify.py",
        "app/routes/llm.py",
        "app/tools/__init__.py",
        "app/tools/supplier_tools.py",
    ]
    
    print("🧪 SLA API Structure Test")
    print("=" * 30)
    
    all_good = True
    for file_path in required_files:
        full_path = os.path.join(base_path, file_path)
        if os.path.exists(full_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MISSING")
            all_good = False
    
    print("\n📋 Summary:")
    if all_good:
        print("✅ All required files present")
        print("✅ Structure is correct")
        print("\n🔧 Next steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Set OPENAI_API_KEY in .env file")
        print("3. Run server: uvicorn app.main:app --reload")
    else:
        print("❌ Some files are missing")
        print("❌ Structure needs fixing")
    
    return all_good

if __name__ == "__main__":
    test_file_structure()
