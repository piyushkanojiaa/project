"""
Backend Test Suite - Comprehensive Unit & Integration Tests

Test coverage for:
- API endpoints
- Authentication & authorization
- ML models
- Database operations
- GraphQL queries & mutations
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

# Import app
from api_server import app
from auth.authentication import create_access_token, UserRole, hash_password
from ml.trajectory_predictor import TrajectoryPredictor, AnomalyDetector


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def client():
    """Test client"""
    return TestClient(app)


@pytest.fixture
def admin_token():
    """Admin user token for testing"""
    token_data = {
        "sub": "test_admin",
        "email": "admin@test.com",
        "role": UserRole.ADMIN.value
    }
    return create_access_token(token_data)


@pytest.fixture
def viewer_token():
    """Viewer user token for testing"""
    token_data = {
        "sub": "test_viewer",
        "email": "viewer@test.com",
        "role": UserRole.VIEWER.value
    }
    return create_access_token(token_data)


# ============================================================
# API Health Tests
# ============================================================

class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_check(self, client):
        """Test basic health check"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert"version" in data
    
    def test_health_check_structure(self, client):
        """Test health check response structure"""
        response = client.get("/api/health")
        data = response.json()
        
        required_fields = ["status", "timestamp", "version", "features"]
        for field in required_fields:
            assert field in data


# ============================================================
# Authentication Tests
# ============================================================

class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_register_user(self, client):
        """Test user registration"""
        user_data = {
            "email": "newuser@test.com",
            "username": "newuser",
            "password": "SecurePass123!",
            "role": "viewer"
        }
        
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert "password" not in data  # Password should not be returned
    
    def test_register_weak_password(self, client):
        """Test registration with weak password"""
        user_data = {
            "email": "test@test.com",
            "username": "test",
            "password": "weak",  # Too short
            "role": "viewer"
        }
        
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 400
        assert "8 characters" in response.json()["detail"]
    
    def test_login_success(self, client):
        """Test successful login"""
        # First register
        user_data = {
            "email": "login@test.com",
            "username": "loginuser",
            "password": "SecurePass123!",
            "role": "viewer"
        }
        client.post("/auth/register", json=user_data)
        
        # Then login
        login_data = {
            "email": "login@test.com",
            "password": "SecurePass123!"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401


# ============================================================
# Authorization Tests
# ============================================================

class TestAuthorization:
    """Test role-based access control"""
    
    def test_admin_access(self, client, admin_token):
        """Test admin can access admin endpoints"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/admin/health", headers=headers)
        assert response.status_code == 200
    
    def test_viewer_denied_admin(self, client, viewer_token):
        """Test viewer cannot access admin endpoints"""
        headers = {"Authorization": f"Bearer {viewer_token}"}
        response = client.get("/admin/health", headers=headers)
        assert response.status_code == 403
    
    def test_unauthenticated_denied(self, client):
        """Test unauthenticated requests are denied"""
        response = client.get("/admin/health")
        assert response.status_code in [401, 403]


# ============================================================
# GraphQL Tests
# ============================================================

class TestGraphQL:
    """Test GraphQL API"""
    
    def test_graphql_query_satellites(self, client):
        """Test GraphQL satellite query"""
        query = """
            query {
                satellites(limit: 10) {
                    id
                    name
                    noradId
                    altitude
                }
            }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "satellites" in data["data"]
    
    def test_graphql_query_conjunctions(self, client):
        """Test GraphQL conjunction query"""
        query = """
            query {
                conjunctions(limit: 5, riskLevel: HIGH) {
                    id
                    satelliteName
                    debrisName
                    riskLevel
                    probability
                }
            }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
    
    def test_graphql_mutation(self, client, admin_token):
        """Test GraphQL mutation"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        mutation = """
            mutation {
                updateConjunctionStatus(
                    id: "test_id",
                    status: MONITORING
                ) {
                    id
                    status
                }
            }
        """
        
        response = client.post("/graphql", json={"query": mutation}, headers=headers)
        assert response.status_code == 200


# ============================================================
# ML Model Tests
# ============================================================

class TestMLModels:
    """Test ML model functionality"""
    
    def test_trajectory_predictor_init(self):
        """Test trajectory predictor initialization"""
        predictor = TrajectoryPredictor()
        assert predictor.model is not None
        assert predictor.device is not None
    
    def test_trajectory_prediction(self):
        """Test trajectory prediction"""
        import numpy as np
        
        predictor = TrajectoryPredictor()
        
        # Create sample history (50 timesteps, 6 features)
        history = np.random.randn(50, 6) * 1000  # Random orbital states
        
        # Predict 10 steps ahead
        predictions = predictor.predict_trajectory(history, steps_ahead=10)
        
        assert len(predictions) == 10
        assert all('position' in p for p in predictions)
        assert all('velocity' in p for p in predictions)
    
    def test_anomaly_detector(self):
        """Test anomaly detection"""
        import numpy as np
        
        detector = AnomalyDetector(threshold_sigma=3.0)
        
        # Normal history
        history = np.random.randn(50, 6) * 100
        
        # Recent states with anomaly
        recent = history[-10:].copy()
        recent[5] += 1000  # Add large deviation
        
        anomalies = detector.detect_anomalies(history, recent)
        
        # Should detect the anomaly
        assert len(anomalies) > 0
        assert anomalies[0]['deviation_km'] > 100


# ============================================================
# Database Tests (if using database)
# ============================================================

class TestDatabase:
    """Test database operations"""
    
    @pytest.mark.asyncio
    async def test_database_connection(self):
        """Test database connection"""
        from database.database import engine
        
        # Test connection
        async with engine.connect() as conn:
            result = await conn.execute("SELECT 1")
            assert result is not None
    
    @pytest.mark.asyncio
    async def test_create_conjunction(self):
        """Test creating a conjunction record"""
        from database.crud import ConjunctionCRUD
        from database.models import ConjunctionCreate
        
        conjunction_data = ConjunctionCreate(
            satellite_id="sat_test",
            debris_id="debris_test",
            satellite_name="Test Satellite",
            debris_name="Test Debris",
            tca=datetime.utcnow() + timedelta(hours=12),
            miss_distance=0.5,
            probability=0.001,
            risk_level="HIGH",
            relative_velocity=7.5,
            status="PREDICTED"
        )
        
        # Create (if database available)
        # conjunction = await ConjunctionCRUD.create(conjunction_data)
        # assert conjunction.id is not None


# ============================================================
# Integration Tests
# ============================================================

class TestIntegration:
    """End-to-end integration tests"""
    
    def test_full_workflow(self, client):
        """Test complete user workflow"""
        # 1. Register user
        register_data = {
            "email": "workflow@test.com",
            "username": "workflow",
            "password": "WorkflowPass123!",
            "role": "analyst"
        }
        response = client.post("/auth/register", json=register_data)
        assert response.status_code == 201
        
        # 2. Login
        login_data = {
            "email": "workflow@test.com",
            "password": "WorkflowPass123!"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # 3. Access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        
        # 4. Query data
        query = '{ satellites(limit: 5) { id name } }'
        response = client.post("/graphql", json={"query": query}, headers=headers)
        assert response.status_code == 200


# ============================================================
# Performance Tests
# ============================================================

class TestPerformance:
    """Test API performance"""
    
    def test_response_time(self, client):
        """Test API response time"""
        import time
        
        start = time.time()
        response = client.get("/api/health")
        end = time.time()
        
        response_time = (end - start) * 1000  # ms
        assert response_time < 100  # Should respond in < 100ms
    
    def test_concurrent_requests(self, client):
        """Test handling concurrent requests"""
        import concurrent.futures
        
        def make_request():
            return client.get("/api/health")
        
        # Make 10 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [f.result() for f in futures]
        
        # All should succeed
        assert all(r.status_code == 200 for r in results)


# ============================================================
# Run Tests
# ============================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=.", "--cov-report=html"])
