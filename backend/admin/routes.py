"""
Admin Dashboard API Endpoints

System monitoring, user management, analytics, logs
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from auth.authentication import (
    TokenData, RequireRole, UserRole,
    get_current_active_user
)

# Create router
router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


# ============================================================
# Models
# ============================================================

class SystemHealth(BaseModel):
    """System health status"""
    status: str
    uptime_seconds: float
    cpu_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_used_gb: float
    disk_total_gb: float
    active_connections: int
    timestamp: datetime


class DatabaseStats(BaseModel):
    """Database statistics"""
    total_satellites: int 
    total_conjunctions: int
    total_users: int
    database_size_mb: float
    collections: List[Dict[str, any]]


class APIUsageStats(BaseModel):
    """API usage statistics"""
    total_requests: int
    requests_today: int
    requests_per_hour: List[int]
    top_endpoints: List[Dict[str, any]]
    average_response_time_ms: float
    error_rate_percent: float


class UserActivity(BaseModel):
    """User activity log"""
    user_id: str
    username: str
    email: str
    last_login: Optional[datetime]
    total_requests: int
    role: UserRole


class SystemLog(BaseModel):
    """System log entry"""
    id: str
    timestamp: datetime
    level: str  # INFO, WARNING, ERROR, CRITICAL
    service: str
    message: str
    details: Optional[dict] = None


# ============================================================
# System Health Monitoring
# ============================================================

@router.get("/health", response_model=SystemHealth)
async def get_system_health(
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get comprehensive system health status
    
    Requires Admin role
    """
    import psutil
    import time
    
    # Get system metrics
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Get active connections (placeholder)
    active_connections = 42  # Would come from connection pool
    
    return SystemHealth(
        status="healthy" if cpu < 80 and memory.percent < 80 else "degraded",
        uptime_seconds=time.time() - psutil.boot_time(),
        cpu_percent=cpu,
        memory_used_mb=memory.used / (1024 ** 2),
        memory_total_mb=memory.total / (1024 ** 2),
        disk_used_gb=disk.used / (1024 ** 3),
        disk_total_gb=disk.total / (1024 ** 3),
        active_connections=active_connections,
        timestamp=datetime.utcnow()
    )


@router.get("/database/stats", response_model=DatabaseStats)
async def get_database_stats(
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get database statistics
    """
    # In production: Query database
    # Example with MongoDB:
    # db_stats = await db.command("dbStats")
    # satellites_count = await db.satellites.count_documents({})
    
    return DatabaseStats(
        total_satellites=1250,
        total_conjunctions=3847,
        total_users=45,
        database_size_mb=256.7,
        collections=[
            {"name": "satellites", "count": 1250, "size_mb": 89.3},
            {"name": "conjunctions", "count": 3847, "size_mb": 145.2},
            {"name": "users", "count": 45, "size_mb": 2.1}
        ]
    )


# ============================================================
# API Usage Analytics
# ============================================================

@router.get("/analytics/api-usage", response_model=APIUsageStats)
async def get_api_usage(
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get API usage statistics
    """
    # In production: Query from Redis or metrics database
    
    return APIUsageStats(
        total_requests=125847,
        requests_today=3215,
        requests_per_hour=[120, 145, 98, 134, 167, 189, 210, 198, 176, 154, 132, 145],
        top_endpoints=[
            {"endpoint": "/api/conjunctions", "count": 45231, "avg_time_ms": 87},
            {"endpoint": "/graphql", "count": 38947, "avg_time_ms": 125},
            {"endpoint": "/api/satellites", "count": 21450, "avg_time_ms": 65}
        ],
        average_response_time_ms=95.3,
        error_rate_percent=0.42
    )


@router.get("/analytics/users", response_model=List[UserActivity])
async def get_user_activity(
    limit: int = 50,
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get user activity statistics
    """
    # In production: Query from database
    
    return [
        UserActivity(
            user_id="user_1",
            username="analyst1",
            email="analyst1@example.com",
            last_login=datetime.utcnow() - timedelta(hours=2),
            total_requests=1247,
            role=UserRole.ANALYST
        ),
        UserActivity(
            user_id="user_2",
            username="viewer1",
            email="viewer1@example.com",
            last_login=datetime.utcnow() - timedelta(days=1),
            total_requests=345,
            role=UserRole.VIEWER
        )
    ]


# ============================================================
# System Logs
# ============================================================

@router.get("/logs", response_model=List[SystemLog])
async def get_system_logs(
    level: Optional[str] = None,
    service: Optional[str] = None,
    limit: int = 100,
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get system logs with optional filtering
    
    - **level**: Filter by log level (INFO, WARNING, ERROR, CRITICAL)
    - **service**: Filter by service name
    - **limit**: Maximum number of logs to return
    """
    # In production: Query from log aggregation service (Loki, ELK, etc.)
    
    logs = [
        SystemLog(
            id="log_1",
            timestamp=datetime.utcnow() - timedelta(minutes=5),
            level="INFO",
            service="api",
            message="New conjunction detected",
            details={"conjunction_id": "conj_123", "risk_level": "HIGH"}
        ),
        SystemLog(
            id="log_2",
            timestamp=datetime.utcnow() - timedelta(minutes=15),
            level="WARNING",
            service="database",
            message="Slow query detected",
            details={"query_time_ms": 2547, "query": "SELECT * FROM conjunctions"}
        ),
        SystemLog(
            id="log_3",
            timestamp=datetime.utcnow() - timedelta(hours=1),
            level="ERROR",
            service="ml",
            message="Model inference failed",
            details={"error": "CUDA out of memory", "model": "collision_predictor"}
        )
    ]
    
    # Filter logs
    if level:
        logs = [log for log in logs if log.level == level.upper()]
    if service:
        logs = [log for log in logs if log.service == service]
    
    return logs[:limit]


# ============================================================
# Cache Management
# ============================================================

@router.post("/cache/clear", status_code=200)
async def clear_cache(
    cache_type: str = "all",  # all, redis, application
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Clear application caches
    
    **Warning**: This may impact performance temporarily
    """
    # In production: Clear Redis, application caches
    # await redis.flushdb()
    
    return {
        "message": f"{cache_type} cache cleared successfully",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/cache/stats", response_model=dict)
async def get_cache_stats(
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get cache statistics
    """
    # In production: Query Redis
    # info = await redis.info("stats")
    
    return {
        "redis": {
            "used_memory_mb": 45.7,
            "total_keys": 1247,
            "hit_rate_percent": 87.3,
            "evicted_keys": 156
        },
        "application": {
            "cached_queries": 234,
            "cache_size_mb": 12.4
        }
    }


# ============================================================
# Background Jobs
# ============================================================

@router.get("/jobs", response_model=List[Dict])
async def get_background_jobs(
    status: Optional[str] = None,
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get background job status
    """
    jobs = [
        {
            "id": "job_1",
            "name": "TLE Update",
            "status": "running",
            "progress": 67,
            "started_at": (datetime.utcnow() - timedelta(minutes=10)).isoformat(),
            "estimated_completion": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        },
        {
            "id": "job_2",
            "name": "Database Backup",
            "status": "completed",
            "progress": 100,
            "started_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "completed_at": (datetime.utcnow() - timedelta(hours=1, minutes=45)).isoformat()
        }
    ]
    
    if status:
        jobs = [job for job in jobs if job["status"] == status]
    
    return jobs


@router.post("/jobs/{job_id}/cancel", status_code=200)
async def cancel_job(
    job_id: str,
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Cancel a running background job
    """
    # In production: Cancel Celery/RQ job
    
    return {
        "message": f"Job {job_id} cancelled",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================
# Configuration
# ============================================================

@router.get("/config", response_model=Dict)
async def get_system_config(
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get system configuration
    """
    return {
        "app": {
            "name": "Orbital Guard AI",
            "version": "2.0.0",
            "environment": "production",
            "debug": False
        },
        "database": {
            "type": "PostgreSQL",
            "host": "postgres",
            "port": 5432,
            "max_connections": 100
        },
        "redis": {
            "host": "redis",
            "port": 6379,
            "db": 0
        },
        "ml": {
            "model_version": "1.2.0",
            "device": "cuda",
            "batch_size": 32
        }
    }


@router.put("/config", status_code=200)
async def update_system_config(
    config_updates: Dict,
    current_user: TokenData = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Update system configuration
    
    **Warning**: Some changes may require restart
    """
    # In production: Update configuration file/database
    
    return {
        "message": "Configuration updated",
        "requires_restart": True,
        "updated_fields": list(config_updates.keys())
    }


# Export router
__all__ = ['router']
