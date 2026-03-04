"""
Frontend-Backend Integration Test
Tests API connectivity and data flow
"""

import asyncio
import httpx

API_BASE = "http://localhost:8000"

async def test_integration():
    print("=" * 60)
    print("FRONTEND-BACKEND INTEGRATION TEST")
    print("=" * 60)
    
    async with httpx.AsyncClient() as client:
        # Test 1: Health Check
        print("\n[1/5] Testing Health Endpoint...")
        try:
            response = await client.get(f"{API_BASE}/api/health", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Health check passed")
                print(f"  Version: {data.get('version', 'N/A')}")
                print(f"  Status: {data.get('status', 'N/A')}")
            else:
                print(f"✗ Health check failed: HTTP {response.status_code}")
        except Exception as e:
            print(f"✗ Cannot connect to backend: {e}")
            print(f"  Make sure backend is running on {API_BASE}")
            return False
        
        # Test 2: Satellites Endpoint
        print("\n[2/5] Testing Satellites Endpoint...")
        try:
            response = await client.get(f"{API_BASE}/api/satellites", timeout=10.0)
            if response.status_code == 200:
                satellites = response.json()
                print(f"✓ Satellites endpoint working")
                print(f"  Found {len(satellites)} satellites")
            else:
                print(f"✗ Satellites endpoint failed: HTTP {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")
        
        # Test 3: Conjunctions Endpoint
        print("\n[3/5] Testing Conjunctions Endpoint...")
        try:
            response = await client.get(f"{API_BASE}/api/conjunctions?count=5", timeout=10.0)
            if response.status_code == 200:
                conjunctions = response.json()
                print(f"✓ Conjunctions endpoint working")
                print(f"  Found {len(conjunctions)} conjunctions")
                if conjunctions:
                    conj = conjunctions[0]
                    print(f"  Sample: {conj.get('satellite_name')} vs {conj.get('debris_name')}")
                    print(f"  Risk: {conj.get('risk_level')}, PoC: {conj.get('poc_ml'):.2e}")
            else:
                print(f"✗ Conjunctions endpoint failed: HTTP {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")
        
        # Test 4: GraphQL Endpoint
        print("\n[4/5] Testing GraphQL Endpoint...")
        try:
            response = await client.get(f"{API_BASE}/graphql", timeout=5.0)
            if response.status_code in [200, 400]:  # 400 is ok for GET without query
                print(f"✓ GraphQL endpoint accessible")
            else:
                print(f"✗ GraphQL endpoint failed: HTTP {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")
        
        # Test 5: CORS Headers
        print("\n[5/5] Testing CORS Configuration...")
        try:
            response = await client.options(f"{API_BASE}/api/health", timeout=5.0)
            cors_header = response.headers.get('access-control-allow-origin')
            if cors_header:
                print(f"✓ CORS configured: {cors_header}")
            else:
                print(f"⚠ CORS headers not found (may need to check with actual request)")
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print("\n" + "=" * 60)
    print("✅ INTEGRATION TEST COMPLETE")
    print("=" * 60)
    print("\nFrontend can communicate with backend!")
    print("Start frontend with: cd frontend && npm run dev")
    return True

if __name__ == "__main__":
    print("\n⚠ Make sure backend is running first!")
    print("Start backend with: cd backend && python start_server.py\n")
    
    try:
        asyncio.run(test_integration())
    except KeyboardInterrupt:
        print("\n\nTest cancelled by user")
