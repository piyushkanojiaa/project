"""
Adaptive API Rate Limiter

Intelligent rate limiting that adjusts based on system health
"""

import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import time

# ============================================================
# Rate Limiter
# ============================================================

class AdaptiveRateLimiter:
    """
    Rate limiter that adjusts limits based on system health
    
    System States:
    - HEALTHY:   100% of base limit
    - DEGRADED:   50% of base limit
    - CRITICAL:   10% of base limit (essential only)
    """
    
    def __init__(
        self,
        base_limit: int = 100,  # requests per minute
        window_seconds: int = 60
    ):
        """
        Initialize rate limiter
        
        Args:
            base_limit: Base rate limit (req/min) when healthy
            window_seconds: Time window for rate limiting
        """
        self.base_limit = base_limit
        self.window_seconds = window_seconds
        
        # Track requests by client
        self.request_counts: Dict[str, list] = defaultdict(list)
        
        # Current system health status
        self.system_health = "healthy"
        
        # Multipliers for different health states
        self.health_multipliers = {
            "healthy": 1.0,
            "degraded": 0.5,
            "critical": 0.1
        }
    
    def set_system_health(self, health_status: str):
        """Update system health status"""
        if health_status in self.health_multipliers:
            self.system_health = health_status
    
    def get_current_limit(self) -> int:
        """Get current rate limit based on system health"""
        multiplier = self.health_multipliers.get(self.system_health, 1.0)
        return int(self.base_limit * multiplier)
    
    async def check_rate_limit(
        self,
        client_id: str,
        priority: str = "normal"
    ) -> tuple[bool, Optional[str]]:
        """
        Check if request is within rate limit
        
        Args:
            client_id: Client identifier (IP, user ID, etc.)
            priority: Request priority (critical, high, normal, low)
            
        Returns:
            (allowed, reason_if_denied)
        """
        now = time.time()
        
        # Clean old requests outside window
        cutoff = now - self.window_seconds
        self.request_counts[client_id] = [
            req_time for req_time in self.request_counts[client_id]
            if req_time > cutoff
        ]
        
        # Get current limit
        current_limit = self.get_current_limit()
        
        # Priority adjustments
        if priority == "critical":
            # Critical requests always allowed (with higher limit)
            effective_limit = current_limit * 2
        elif priority == "high":
            effective_limit = int(current_limit * 1.5)
        elif priority == "low":
            effective_limit = int(current_limit * 0.75)
        else:  # normal
            effective_limit = current_limit
        
        # Check limit
        current_count = len(self.request_counts[client_id])
        
        if current_count >= effective_limit:
            retry_after = self.window_seconds
            return False, f"Rate limit exceeded ({current_count}/{effective_limit} req/{self.window_seconds}s). Retry after {retry_after}s"
        
        # Record request
        self.request_counts[client_id].append(now)
        
        return True, None
    
    def get_client_stats(self, client_id: str) -> Dict:
        """Get rate limit stats for client"""
        now = time.time()
        cutoff = now - self.window_seconds
        
        recent_requests = [
            req for req in self.request_counts.get(client_id, [])
            if req > cutoff
        ]
        
        current_limit = self.get_current_limit()
        
        return {
            "client_id": client_id,
            "requests_in_window": len(recent_requests),
            "current_limit": current_limit,
            "system_health": self.system_health,
            "remaining_requests": max(0, current_limit - len(recent_requests)),
            "window_seconds": self.window_seconds
        }
    
    def get_all_stats(self) -> Dict:
        """Get overall rate limiter statistics"""
        now = time.time()
        cutoff = now - self.window_seconds
        
        total_requests = 0
        active_clients = 0
        
        for client_id, requests in self.request_counts.items():
            recent = [r for r in requests if r > cutoff]
            if recent:
                active_clients += 1
                total_requests += len(recent)
        
        return {
            "system_health": self.system_health,
            "base_limit": self.base_limit,
            "current_limit": self.get_current_limit(),
            "active_clients": active_clients,
            "total_requests_in_window": total_requests,
            "window_seconds": self.window_seconds
        }


# ============================================================
# Health Monitor Integration
# ============================================================

class SystemHealthMonitor:
    """Monitor system health for rate limiting"""
    
    def __init__(self, rate_limiter: AdaptiveRateLimiter):
        """Initialize health monitor"""
        self.rate_limiter = rate_limiter
        self._running = False
    
    async def start_monitoring(self):
        """Start continuous health monitoring"""
        self._running = True
        
        while self._running:
            try:
                # Get system health
                health = await self._check_system_health()
                
                # Update rate limiter
                self.rate_limiter.set_system_health(health["status"])
                
                # Wait before next check
                await asyncio.sleep(10)
            
            except Exception as e:
                print(f"⚠️  Health monitoring error: {e}")
    
    async def _check_system_health(self) -> Dict:
        """
        Check overall system health
        
        Integrates with error handler and self-healing system
        """
        try:
            # Import here to avoid circular dependency
            from core.error_handler import get_system_health
            
            health = get_system_health()
            return health
        
        except ImportError:
            # Fallback if modules not available
            return {"status": "healthy"}
    
    def stop(self):
        """Stop monitoring"""
        self._running = False


# ============================================================
# FastAPI Middleware
# ============================================================

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import hashlib

class RateLimitMiddleware:
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, rate_limiter: AdaptiveRateLimiter):
        self.rate_limiter = rate_limiter
    
    async def __call__(self, request: Request, call_next):
        """Process request through rate limiter"""
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Determine priority from headers or path
        priority = request.headers.get("X-Priority", "normal")
        
        # Check rate limit
        allowed, reason = await self.rate_limiter.check_rate_limit(
            client_id, priority
        )
        
        if not allowed:
            # Return 429 Too Many Requests
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": reason,
                    "retry_after": self.rate_limiter.window_seconds
                },
                headers={
                    "Retry-After": str(self.rate_limiter.window_seconds)
                }
            )
        
        # Add rate limit headers to response
        response = await call_next(request)
        
        stats = self.rate_limiter.get_client_stats(client_id)
        response.headers["X-RateLimit-Limit"] = str(stats["current_limit"])
        response.headers["X-RateLimit-Remaining"] = str(stats["remaining_requests"])
        response.headers["X-RateLimit-Reset"] = str(stats["window_seconds"])
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request"""
        # Try to get authenticated user ID
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"
        
        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        
        # Hash IP for privacy
        return hashlib.md5(client_ip.encode()).hexdigest()


# ============================================================
# Global Rate Limiter
# ============================================================

global_rate_limiter = AdaptiveRateLimiter(base_limit=100)


# Export
__all__ = [
    'AdaptiveRateLimiter',
    'SystemHealthMonitor',
    'RateLimitMiddleware',
    'global_rate_limiter'
]
