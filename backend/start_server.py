#!/usr/bin/env python3
"""
Orbital Guard AI - Quick Start Script
Starts backend server with proper configuration
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def check_dependencies():
    """Check if all required packages are installed"""
    required = [
        'fastapi', 'uvicorn', 'pydantic', 'numpy', 'pandas',
        'torch', 'sgp4', 'skyfield', 'sqlalchemy', 'strawberry'
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print(f"Install with: pip install {' '.join(missing)}")
        return False
    
    print("✓ All dependencies installed")
    return True

def main():
    print("=" * 60)
    print("🛰️  ORBITAL GUARD AI - Backend Server")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Load environment
    try:
        from dotenv import load_dotenv
        env_path = backend_dir.parent / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            print(f"✓ Loaded environment from {env_path}")
        else:
            print("⚠ No .env file found, using defaults")
    except ImportError:
        print("⚠ python-dotenv not installed, skipping .env")
    
    # Start server
    print("\n🚀 Starting FastAPI server...")
    print("📖 API Docs: http://localhost:8000/docs")
    print("🎮 GraphQL: http://localhost:8000/graphql")
    print("\nPress Ctrl+C to stop\n")
    
    import uvicorn
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
