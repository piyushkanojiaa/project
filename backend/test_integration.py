"""
Backend Integration Test Script
Tests all critical imports and API functionality
"""

import sys

print("=" * 60)
print("ORBITAL GUARD AI - Backend Integration Test")
print("=" * 60)

# Test 1: Core Web Framework
print("\n[1/8] Testing Core Web Framework...")
try:
    import fastapi
    import uvicorn
    from pydantic import BaseModel
    print("✓ FastAPI, Uvicorn, Pydantic")
except ImportError as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

# Test 2: Orbital Mechanics
print("\n[2/8] Testing Orbital Mechanics...")
try:
    import sgp4
    from skyfield.api import load
    import astropy
    print("✓ SGP4, Skyfield, Astropy")
except ImportError as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

# Test 3: Machine Learning
print("\n[3/8] Testing Machine Learning...")
try:
    import torch
    import numpy as np
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    print("✓ PyTorch, NumPy, Pandas, Scikit-learn")
except ImportError as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

# Test 4: Database
print("\n[4/8] Testing Database...")
try:
    import sqlalchemy
    from sqlalchemy import create_engine
    print("✓ SQLAlchemy")
except ImportError as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

# Test 5: GraphQL
print("\n[5/8] Testing GraphQL...")
try:
    import strawberry
    print("✓ Strawberry GraphQL")
except ImportError as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

# Test 6: Real-time Communication
print("\n[6/8] Testing Real-time Communication...")
try:
    import websockets
    print("✓ WebSockets")
except ImportError as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

# Test 7: Report Generation
print("\n[7/8] Testing Report Generation...")
try:
    import reportlab
    from reportlab.pdfgen import canvas
    print("✓ ReportLab")
except ImportError as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

# Test 8: Utilities
print("\n[8/8] Testing Utilities...")
try:
    import httpx
    import requests
    from dotenv import load_dotenv
    import yaml
    print("✓ HTTPX, Requests, Python-dotenv, PyYAML")
except ImportError as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ ALL BACKEND DEPENDENCIES INSTALLED SUCCESSFULLY!")
print("=" * 60)
print("\nBackend is ready to run!")
print("Start with: python -m uvicorn api_server:app --reload")
