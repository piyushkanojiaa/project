"""
Simplified Backend Server - No Database Dependencies
For quick testing and frontend development
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import random

app = FastAPI(
    title="Orbital Guard AI - Simple Backend",
    description="Simplified backend for testing",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "Orbital Guard AI - Simple Backend",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "features": {
            "satellites": True,
            "conjunctions": True,
            "simplified": True
        }
    }

@app.get("/api/satellites")
async def get_satellites():
    """Return sample satellite data"""
    return [
        {
            "id": "25544",
            "name": "ISS (ZARYA)",
            "type": "active",
            "tle1": "1 25544U 98067A   24016.52652778  .00016717  00000+0  30000-3 0  9991",
            "tle2": "2 25544  51.6416 290.4112 0005705  30.8562  80.7772 15.49825361434768",
            "altitude": 408.0,
            "inclination": 51.64
        },
        {
            "id": "20580",
            "name": "HUBBLE SPACE TELESCOPE",
            "type": "active",
            "tle1": "1 20580U 90037B   24016.52652778  .00001234  00000+0  12345-3 0  9991",
            "tle2": "2 20580  28.4700 123.4567 0002345  45.6789  90.1234 15.09876543210987",
            "altitude": 540.0,
            "inclination": 28.47
        },
        {
            "id": "DEBRIS-001",
            "name": "DEBRIS FRAGMENT 1",
            "type": "debris",
            "tle1": "1 99999U 99999A   24016.52652778  .00001234  00000+0  12345-3 0  9991",
            "tle2": "2 99999  45.0000 180.0000 0010000  90.0000 270.0000 15.50000000123456",
            "altitude": 450.0,
            "inclination": 45.0
        }
    ]

@app.get("/api/conjunctions")
async def get_conjunctions(count: int = 15):
    """Return sample conjunction data"""
    conjunctions = []
    risk_levels = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    
    for i in range(min(count, 20)):
        risk = random.choice(risk_levels)
        poc = random.uniform(1e-7, 1e-3) if risk in ["CRITICAL", "HIGH"] else random.uniform(1e-9, 1e-7)
        
        conjunctions.append({
            "conjunction_id": f"CONJ-{i+1:04d}",
            "satellite_id": "25544",
            "satellite_name": "ISS (ZARYA)",
            "debris_id": f"DEBRIS-{i+1:03d}",
            "debris_name": f"DEBRIS FRAGMENT {i+1}",
            "time_to_tca": random.uniform(3600, 86400),
            "tca_timestamp": datetime.now().timestamp() + random.uniform(3600, 86400),
            "miss_distance": random.uniform(0.5, 10.0),
            "relative_velocity": random.uniform(5.0, 15.0),
            "poc_analytic": poc * random.uniform(0.8, 1.2),
            "poc_ml": poc,
            "risk_level": risk,
            "maneuver_required": risk in ["CRITICAL", "HIGH"]
        })
    
    return sorted(conjunctions, key=lambda x: x["poc_ml"], reverse=True)

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🛰️  ORBITAL GUARD AI - Simplified Backend")
    print("=" * 60)
    print("\n✓ Starting server...")
    print("📖 API Docs: http://localhost:8000/docs")
    print("🔗 Frontend: http://localhost:3000")
    print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
