"""
Orbital Guard AI - FastAPI Backend Server
REST API + WebSocket for Real-Time Collision Prediction

Endpoints:
- GET /api/satellites - List all tracked satellites
- POST /api/predict - Predict collision probability
- POST /api/conjunctions - Analyze all current conjunctions
- WebSocket /ws/realtime - Real-time updates

Author: Orbital Guard AI Team
Version: 1.0.0
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import asyncio
import json
from datetime import datetime

# GraphQL imports
import strawberry
from strawberry.fastapi import GraphQLRouter

# Import our ML model
from collision_ml_model import CollisionPredictor, ModelConfig, FeatureExtractor
from tle_data import get_all_tle_data, get_satellite_by_id
from synthetic_conjunctions import get_synthetic_conjunctions
from live_tle_fetcher import LiveTLEFetcher, fetch_live_tle_data
from websocket_manager import websocket_endpoint, manager as ws_manager
from pdf_generator import generate_conjunction_pdf
from database import (
    init_database,
    get_db,
    get_db_session,
    ConjunctionCRUD,
    AnalyticsCRUD,
    ConjunctionHistory
)
from examples import (
    parse_tle_to_state,
    find_tca,
    compute_poc_foster_3d,
    generate_realistic_covariance,
    plan_optimal_maneuver,
    propagate_state
)

# GraphQL schema and resolvers
from graphql_resolvers import Query, Mutation
from graphql_subscriptions import Subscription

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Orbital Guard AI API",
    description="Space Debris Detection & Collision Avoidance AI",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GraphQL Router with WebSocket subscriptions
from graphql_server import graphql_app
app.include_router(graphql_app, prefix="/graphql")

print("✓ GraphQL API v2 initialized with WebSocket subscriptions")
print("  - GraphQL Playground: http://localhost:8000/graphql")
print("  - WebSocket endpoint: ws://localhost:8000/graphql")

# ============================================================================
# DATA MODELS
# ============================================================================

class SatelliteInfo(BaseModel):
    id: str
    name: str
    tle1: str
    tle2: str
    type: str
    altitude: Optional[float] = None
    inclination: Optional[float] = None

class ConjunctionRequest(BaseModel):
    satellite_id: str
    debris_id: str
    time_horizon: float = 86400  # 24 hours

class ConjunctionAnalysis(BaseModel):
    conjunction_id: str
    satellite_id: str
    satellite_name: str
    debris_id: str
    debris_name: str
    time_to_tca: float
    tca_timestamp: str
    miss_distance: float
    relative_velocity: float
    poc_analytic: float
    poc_ml: float
    risk_level: str
    maneuver_required: bool

class PredictionResponse(BaseModel):
    probability_of_collision: float
    risk_level: str
    confidence: float
    features_used: List[float]

# ============================================================================
# GLOBAL INSTANCES
# ============================================================================

# Initialize ML model (lazy loading)
ml_predictor: Optional[CollisionPredictor] = None

def get_ml_predictor():
    """Lazy load the ML predictor"""
    global ml_predictor
    if ml_predictor is None:
        config = ModelConfig()
        try:
            ml_predictor = CollisionPredictor(
                'best_model.pth',
                'feature_extractor.pkl',
                config
            )
            print("✓ ML Model loaded successfully")
        except FileNotFoundError:
            print("⚠ ML Model not found - using fallback analytic method")
            ml_predictor = None
    return ml_predictor

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# ============================================================================
# API ENDPOINTS
# ============================================================================

# ============================================================================
# WEBSOCKET ENDPOINTS
# ============================================================================

@app.websocket("/ws/conjunctions")
async def websocket_conjunctions_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time conjunction updates
    
    Usage from frontend:
        const ws = new WebSocket('ws://localhost:8000/ws/conjunctions');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'conjunction') {
                // Handle new conjunction
            } else if (data.type === 'alert') {
                // Show alert notification
            }
        };
    """
    await websocket_endpoint(websocket)


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "features": {
            "live_tle": True,
            "websockets": True,
            "synthetic_data": True,
            "ml_predictions": True
        }
    }

@app.get("/")
async def root():
    """API health check"""
    return {
        "service": "Orbital Guard AI",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/satellites", response_model=List[SatelliteInfo])
async def get_satellites():
    """Get all tracked satellites and debris"""
    tle_data = get_all_tle_data()
    
    satellites = []
    for obj in tle_data:
        try:
            # Handle TLE format - may be [line1, line2] or [name, line1, line2]
            tle_array = obj['tle']
            if len(tle_array) == 3:
                # Format: [name, line1, line2]
                tle1 = tle_array[1]
                tle2 = tle_array[2]
            elif len(tle_array) == 2:
                # Format: [line1, line2]
                tle1 = tle_array[0]
                tle2 = tle_array[1]
            else:
                continue  # Invalid format
            
            # Parse TLE to extract orbital parameters
            # TLE line 2 format: 2 NNNNN III.IIII RRR.RRRR E.EEEEE
            # Inclination is at positions 8-16
            try:
                inclination = float(tle2[8:16].strip())
                # Mean motion is at positions 52-63
                mean_motion = float(tle2[52:63].strip())
            except (ValueError, IndexError):
                # Fallback values if parsing fails
                inclination = 0.0
                mean_motion = 15.0  # Default LEO
            
            # Estimate altitude from mean motion
            n = mean_motion * 2 * np.pi / 86400  # rad/s
            a = (398600.4418 / n**2) ** (1/3)  # km
            altitude = max(0, a - 6371)  # Earth radius
            
            satellites.append(SatelliteInfo(
                id=obj['id'],
                name=obj['name'],
                tle1=tle1,
                tle2=tle2,
                type=obj['type'],
                altitude=altitude,
                inclination=inclination
            ))
        except Exception as e:
            # Skip problematic entries
            continue
    
    return satellites

@app.post("/api/conjunctions/resolve") # Changed from GET to POST and path to avoid conflict
async def resolve_conjunction(conjunction_id: str, notes: Optional[str] = None):
    """Mark a conjunction as resolved"""
    with get_db_session() as db:
        record = ConjunctionCRUD.update_status(db, conjunction_id, 'RESOLVED', notes)
        if record:
            return {"success": True, "conjunction": record.to_dict()}
        return {"success": False, "error": "Conjunction not found"}


@app.get("/api/conjunctions/{conjunction_id}/report")
async def download_conjunction_report(conjunction_id: str):
    """
    Generate and download PDF report for a conjunction event
    
    Args:
        conjunction_id: Unique conjunction identifier
    
    Returns:
        PDF file download
    """
    try:
        # Get conjunction data from database
        with get_db_session() as db:
            conjunction = ConjunctionCRUD.get_by_id(db, conjunction_id)
            
            if not conjunction:
                raise HTTPException(status_code=404, detail="Conjunction not found")
            
            # Convert to dict for PDF generator
            conjunction_data = conjunction.to_dict()
            
            # Generate PDF
            pdf_path = generate_conjunction_pdf(conjunction_id, conjunction_data)
            
            # Return as file download
            return FileResponse(
                pdf_path,
                media_type='application/pdf',
                filename=f"Conjunction_Report_{conjunction_id}.pdf"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@app.get("/api/conjunctions", response_model=List[ConjunctionAnalysis])
async def get_conjunctions(count: int = 15):
    """
    Get all current conjunction events (using synthetic data for demo)
    
    Args:
        count: Number of conjunction events to generate (default: 15)
    
    Returns:
        List of conjunction analyses sorted by risk level
    """
    try:
        conjunctions = get_synthetic_conjunctions(count)
        return [ConjunctionAnalysis(**conj) for conj in conjunctions]
    except Exception as e:
        print(f"Error generating conjunctions: {e}")
        return []

@app.get("/api/conjunctions/history")
async def get_conjunction_history(time_range_hours: int = 24, min_risk_level: str = "LOW"):
    """
    Get historical conjunction events for heatmap visualization
    
    Args:
        time_range_hours: Time range in hours (default: 24)
        min_risk_level: Minimum risk level to include (LOW, MEDIUM, HIGH, CRITICAL)
    
    Returns:
        List of historical conjunctions with timestamps
    """
    try:
        # Generate synthetic historical data
        conjunctions = get_synthetic_conjunctions(50)
        
        # Add timestamps within the time range
        import time
        current_time = time.time()
        for conj in conjunctions:
            # Random time within range
            time_offset = np.random.uniform(0, time_range_hours * 3600)
            conj['tca_timestamp'] = current_time - time_offset
        
        # Filter by risk level
        risk_order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        min_index = risk_order.index(min_risk_level)
        filtered = [c for c in conjunctions if risk_order.index(c['risk_level']) >= min_index]
        
        return filtered
    except Exception as e:
        print(f"Error fetching conjunction history: {e}")
        return []

@app.get("/api/conjunctions/density")
async def get_conjunction_density(grid_resolution: int = 50, altitude_band: str = "ALL"):
    """
    Get pre-aggregated conjunction density map
    
    Args:
        grid_resolution: Grid cell size in km (default: 50)
        altitude_band: Altitude filter (ALL, LEO, MEO, GEO)
    
    Returns:
        Density map with grid cells and density values
    """
    try:
        conjunctions = get_synthetic_conjunctions(100)
        
        # Simple density aggregation (simplified version)
        density_map = {}
        for conj in conjunctions:
            # Use satellite position as key (simplified)
            cell_key = f"{int(conj.get('miss_distance', 0) / grid_resolution)}"
            density_map[cell_key] = density_map.get(cell_key, 0) + 1
        
        return {
            "grid_resolution": grid_resolution,
            "altitude_band": altitude_band,
            "cells": [{"key": k, "density": v} for k, v in density_map.items()]
        }
    except Exception as e:
        print(f"Error generating density map: {e}")
        return {"grid_resolution": grid_resolution, "altitude_band": altitude_band, "cells": []}

@app.get("/api/conjunctions/heatmap")
async def get_heatmap_data(count: int = 200, mode: str = "risk"):
    """
    Get conjunction data formatted specifically for deck.gl heatmap
    
    Args:
        count: Number of conjunction points (default: 200)
        mode: Visualization mode (density, risk, altitude)
    
    Returns:
        Formatted heatmap points with position, weight, and metadata
    """
    try:
        conjunctions = get_synthetic_conjunctions(count)
        
        # Format for heatmap
        points = []
        for conj in conjunctions:
            # Calculate ECI position (simplified)
            altitude = np.random.uniform(400, 1000)  # km
            radius = 6371 + altitude
            theta = np.random.uniform(0, 2 * np.pi)
            phi = np.random.uniform(0, np.pi)
            
            position = [
                radius * np.sin(phi) * np.cos(theta),
                radius * np.sin(phi) * np.sin(theta),
                radius * np.cos(phi)
            ]
            
            # Calculate weight based on mode
            weight_map = {'LOW': 0.25, 'MEDIUM': 0.5, 'HIGH': 0.75, 'CRITICAL': 1.0}
            weight = weight_map.get(conj.get('risk_level', 'LOW'), 0.5)
            
            points.append({
                "position": position,
                "weight": weight,
                "timestamp": conj.get('tca_timestamp', time.time()),
                "risk_level": conj.get('risk_level', 'LOW'),
                "altitude": altitude,
                "conjunction_id": conj.get('conjunction_id', 'UNKNOWN')
            })
        
        return {
            "points": points,
            "metadata": {
                "total_points": len(points),
                "time_range": "24h",
                "max_weight": max((p['weight'] for p in points), default=1.0),
                "min_weight": min((p['weight'] for p in points), default=0.0),
                "altitude": {
                    "min": min((p['altitude'] for p in points), default=0),
                    "max": max((p['altitude'] for p in points), default=0),
                    "mean": sum(p['altitude'] for p in points) / len(points) if points else 0
                }
            }
        }
    except Exception as e:
        print(f"Error generating heatmap data: {e}")
        return {"points": [], "metadata": {}}


@app.post("/api/predict", response_model=PredictionResponse)
async def predict_collision(request: ConjunctionRequest):
    """Predict collision probability for a specific conjunction"""
    
    # Get satellite and debris TLE data
    try:
        sat_data = get_satellite_by_id(request.satellite_id)
        deb_data = get_satellite_by_id(request.debris_id)
    except:
        raise HTTPException(status_code=404, detail="Satellite or debris not found")
    
    # Parse TLEs to state vectors
    sat_tle = '\n'.join(['SAT'] + sat_data['tle'])
    deb_tle = '\n'.join(['DEB'] + deb_data['tle'])
    
    sat_state = parse_tle_to_state(sat_tle)
    deb_state = parse_tle_to_state(deb_tle)
    
    # Find TCA
    tca, miss_distance = find_tca(sat_state, deb_state, request.time_horizon)
    
    # Generate covariances
    sat_cov = generate_realistic_covariance(sat_state, 'satellite')
    deb_cov = generate_realistic_covariance(deb_state, 'debris')
    
    # Compute PoC analytically (Foster 3D)
    poc_analytic = compute_poc_foster_3d(
        sat_state, sat_cov,
        deb_state, deb_cov,
        r_combined=0.05
    )
    
    # Try ML prediction
    predictor = get_ml_predictor()
    if predictor:
        conjunction_data = {
            'relative_position': sat_state.position - deb_state.position,
            'relative_velocity': sat_state.velocity - deb_state.velocity,
            'time_to_tca': tca,
            'covariance_1': sat_cov,
            'covariance_2': deb_cov,
            'combined_radius': 0.05,
            'crossing_angle': 45.0,  # Simplified
            'altitude': np.linalg.norm(sat_state.position) - 6371,
            'inclination_diff': 10.0  # Simplified
        }
        
        ml_result = predictor.predict(conjunction_data)
        poc_ml = ml_result['probability_of_collision']
        risk_level = ml_result['risk_level']
        features = ml_result['features']
    else:
        # Fallback to analytic
        poc_ml = poc_analytic
        if poc_ml > 1e-3:
            risk_level = "CRITICAL"
        elif poc_ml > 1e-4:
            risk_level = "HIGH"
        elif poc_ml > 1e-5:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        features = []
    
    # Confidence based on agreement between methods
    confidence = 1.0 - abs(np.log10(poc_analytic + 1e-10) - np.log10(poc_ml + 1e-10)) / 10
    confidence = max(0.0, min(1.0, confidence))
    
    return PredictionResponse(
        probability_of_collision=poc_ml,
        risk_level=risk_level,
        confidence=confidence,
        features_used=features
    )

@app.post("/api/conjunctions", response_model=List[ConjunctionAnalysis])
async def analyze_all_conjunctions(time_horizon: float = 86400):
    """Analyze all current conjunction events"""
    
    tle_data = get_all_tle_data()
    
    # Separate satellites and debris
    satellites = [obj for obj in tle_data if obj['type'] == 'active']
    debris = [obj for obj in tle_data if obj['type'] == 'debris']
    
    conjunctions = []
    conjunction_count = 0
    
    # Check each satellite against all debris
    for sat in satellites:
        sat_tle = '\n'.join([sat['name']] + sat['tle'])
        sat_state = parse_tle_to_state(sat_tle)
        sat_cov = generate_realistic_covariance(sat_state, 'satellite')
        
        for deb in debris:
            deb_tle = '\n'.join([deb['name']] + deb['tle'])
            deb_state = parse_tle_to_state(deb_tle)
            deb_cov = generate_realistic_covariance(deb_state, 'debris')
            
            # Find TCA
            tca, miss_distance = find_tca(sat_state, deb_state, time_horizon)
            
            # Only proceed if close approach
            if miss_distance < 50.0:  # 50 km threshold
                # Compute PoC
                poc_analytic = compute_poc_foster_3d(
                    sat_state, sat_cov,
                    deb_state, deb_cov,
                    r_combined=0.05
                )
                
                # ML prediction
                predictor = get_ml_predictor()
                if predictor:
                    conjunction_data = {
                        'relative_position': sat_state.position - deb_state.position,
                        'relative_velocity': sat_state.velocity - deb_state.velocity,
                        'time_to_tca': tca,
                        'covariance_1': sat_cov,
                        'covariance_2': deb_cov,
                        'combined_radius': 0.05,
                        'crossing_angle': 45.0,
                        'altitude': np.linalg.norm(sat_state.position) - 6371,
                        'inclination_diff': 10.0
                    }
                    ml_result = predictor.predict(conjunction_data)
                    poc_ml = ml_result['probability_of_collision']
                    risk_level = ml_result['risk_level']
                else:
                    poc_ml = poc_analytic
        
                rel_vel = np.linalg.norm(sat_state.velocity - deb_state.velocity)
                
                conjunction_count += 1
                
                # Extract features for database saving
                crossing_angle = conjunction_data.get('crossing_angle', 45.0)
                satellite_altitude = conjunction_data.get('altitude', np.linalg.norm(sat_state.position) - 6371)

                conjunction = ConjunctionAnalysis(
                    conjunction_id=f"CONJ-{conjunction_count:04d}",
                    satellite_id=sat['id'],
                    satellite_name=sat['name'],
                    debris_id=deb['id'],
                    debris_name=deb['name'],
                    time_to_tca=tca,
                    tca_timestamp=(datetime.utcnow().timestamp() + tca),
                    miss_distance=miss_distance,
                    relative_velocity=rel_vel,
                    poc_analytic=poc_analytic,
                    poc_ml=poc_ml,
                    risk_level=risk_level,
                    maneuver_required=poc_ml > 1e-4
                )
                
                conjunctions.append(conjunction)
    
    # Sort by PoC (highest first)
    conjunctions.sort(key=lambda x: x.poc_ml, reverse=True)
    
    return conjunctions

# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive any messages from client
            data = await websocket.receive_text()
            
            # Process command
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
            
            elif data == "get_conjunctions":
                # Send current conjunction analysis
                conjunctions = await analyze_all_conjunctions()
                await websocket.send_json({
                    "type": "conjunctions",
                    "data": [c.dict() for c in conjunctions]
                })
            
            # Wait before next iteration
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ============================================================================
# BACKGROUND TASKS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("=" * 80)
    print("ORBITAL GUARD AI - Backend Server Starting")
    print("=" * 80)
    
    # Initialize database
    init_database()
    
    # Pre-load ML model
    get_ml_predictor()
    
    # Load TLE data
    tle_data = get_all_tle_data()
    print(f"✓ Loaded {len(tle_data)} orbital objects")
    
    print("\nServer ready! 🚀")
    print("API Docs: http://localhost:8000/docs")
    print("=" * 80)

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("\nShutting down Orbital Guard AI Backend...")

# ============================================================================
# GRAPHQL API V2
# ============================================================================

# Create GraphQL schema
graphql_schema = strawberry.Schema(
    query=Query,
    mutation=Mutation
)

# Create GraphQL router with GraphiQL playground
graphql_app = GraphQLRouter(
    graphql_schema,
    # Enable GraphQL Playground
)   

# Mount GraphQL endpoint
app.include_router(graphql_app, prefix="/graphql", tags=["GraphQL API v2"])

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Orbital Guard AI Server...")
    print("📊 GraphQL Playground: http://localhost:8000/graphql")
    print("📖 REST API Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")


@app.get("/api/history/trends")
async def get_trends_data(days: int = 7):
    # This maps the frontend request to your existing history logic
    return await get_conjunction_history(time_range_hours=days*24)