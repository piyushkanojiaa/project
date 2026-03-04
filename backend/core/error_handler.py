"""
Centralized Error Handling System

Never-crash guarantee with graceful degradation and automatic fallbacks
"""

from typing import Optional, Callable, Dict, Any, List
from datetime import datetime
from enum import Enum
import traceback
import logging
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# Health States
# ============================================================

class ComponentHealth(str, Enum):
    """Component health states"""
    HEALTHY = "healthy"      # Full functionality
    DEGRADED = "degraded"    # Using fallbacks
    FAILED = "failed"        # Critical impairment


# ============================================================
# Error Categories
# ============================================================

class ErrorCategory(str, Enum):
    """Error categories for classification"""
    MODEL_ERROR = "model_error"
    DATABASE_ERROR = "database_error"
    API_ERROR = "api_error"
    MEMORY_ERROR = "memory_error"
    NETWORK_ERROR = "network_error"
    VALIDATION_ERROR = "validation_error"
    UNKNOWN_ERROR = "unknown_error"


# ============================================================
# Error Handler
# ============================================================

class ErrorHandler:
    """
    Centralized error handling with graceful degradation
    
    Ensures system never crashes by:
    1. Catching all exceptions
    2. Logging with full context
    3. Activating fallback behavior
    4. Tracking component health
    """
    
    def __init__(self):
        """Initialize error handler"""
        self.component_health: Dict[str, ComponentHealth] = {}
        self.error_counts: Dict[str, int] = {}
        self.fallback_registry: Dict[str, Callable] = {}
        self.error_history: List[Dict] = []
        self.max_history = 1000
    
    def register_fallback(
        self,
        component: str,
        fallback: Callable
    ):
        """
        Register fallback for component
        
        Args:
            component: Component name (e.g., "ai_model")
            fallback: Fallback function to use on failure
        """
        self.fallback_registry[component] = fallback
        logger.info(f"✓ Registered fallback for {component}")
    
    def handle_component_failure(
        self,
        component: str,
        error: Exception,
        context: Optional[Dict] = None,
        fallback: Optional[Callable] = None
    ) -> Dict:
        """
        Handle component failure gracefully
        
        Args:
            component: Component that failed
            error: Exception that occurred
            context: Additional context
            fallback: Optional custom fallback
            
        Returns:
            Result with status and fallback info
        """
        # Log error
        error_msg = str(error)
        error_trace = traceback.format_exc()
        
        logger.error(f"⚠️  Component failure: {component}")
        logger.error(f"   Error: {error_msg}")
        if context:
            logger.error(f"   Context: {context}")
        
        # Update health status
        self.component_health[component] = ComponentHealth.DEGRADED
        
        # Increment error count
        self.error_counts[component] = self.error_counts.get(component, 0) + 1
        
        # Store in history
        self._add_to_history({
            "timestamp": datetime.utcnow().isoformat(),
            "component": component,
            "error": error_msg,
            "error_type": type(error).__name__,
            "context": context,
            "trace": error_trace
        })
        
        # Get fallback
        fallback_func = fallback or self.fallback_registry.get(component)
        
        result = {
            "status": "degraded",
            "component": component,
            "error": error_msg,
            "health": ComponentHealth.DEGRADED.value,
            "fallback_used": None
        }
        
        if fallback_func:
            try:
                logger.info(f"🔄 Activating fallback for {component}")
                fallback_result = fallback_func()
                result["fallback_used"] = fallback_func.__name__
                result["fallback_result"] = fallback_result
                logger.info(f"✓ Fallback activated: {fallback_func.__name__}")
            except Exception as fallback_error:
                logger.error(f"⚠️  Fallback also failed: {fallback_error}")
                self.component_health[component] = ComponentHealth.FAILED
                result["status"] = "failed"
                result["health"] = ComponentHealth.FAILED.value
        else:
            logger.warning(f"⚠️  No fallback registered for {component}")
        
        return result
    
    def with_fallback(
        self,
        component: str,
        context: Optional[Dict] = None
    ):
        """
        Decorator for automatic error handling with fallback
        
        Usage:
            @error_handler.with_fallback("ai_model")
            def predict(data):
                return model.predict(data)
        """
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                try:
                    # Mark component as healthy
                    self.component_health[component] = ComponentHealth.HEALTHY
                    
                    # Execute function
                    result = func(*args, **kwargs)
                    return result
                
                except Exception as e:
                    # Handle failure
                    return self.handle_component_failure(
                        component=component,
                        error=e,
                        context=context
                    )
            
            return wrapper
        return decorator
    
    def get_component_health(self, component: str) -> ComponentHealth:
        """Get health status of component"""
        return self.component_health.get(component, ComponentHealth.HEALTHY)
    
    def get_system_health(self) -> Dict:
        """
        Get overall system health
        
        Returns:
            System health summary
        """
        if not self.component_health:
            return {
                "status": "healthy",
                "components": {},
                "total_errors": 0
            }
        
        # Count by health state
        healthy_count = sum(
            1 for h in self.component_health.values()
            if h == ComponentHealth.HEALTHY
        )
        degraded_count = sum(
            1 for h in self.component_health.values()
            if h == ComponentHealth.DEGRADED
        )
        failed_count = sum(
            1 for h in self.component_health.values()
            if h == ComponentHealth.FAILED
        )
        
        # Determine overall status
        if failed_count > 0:
            status = "critical"
        elif degraded_count > 0:
            status = "degraded"
        else:
            status = "healthy"
        
        return {
            "status": status,
            "components": {
                name: health.value
                for name, health in self.component_health.items()
            },
            "healthy_count": healthy_count,
            "degraded_count": degraded_count,
            "failed_count": failed_count,
            "total_errors": sum(self.error_counts.values()),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_error_statistics(self) -> Dict:
        """Get error statistics"""
        return {
            "total_errors": sum(self.error_counts.values()),
            "errors_by_component": self.error_counts.copy(),
            "recent_errors": self.error_history[-10:],
            "total_components": len(self.component_health),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def reset_component_health(self, component: str):
        """Reset component to healthy state"""
        self.component_health[component] = ComponentHealth.HEALTHY
        logger.info(f"✓ Reset {component} to HEALTHY")
    
    def _add_to_history(self, error_record: Dict):
        """Add error to history"""
        self.error_history.append(error_record)
        
        # Limit history size
        if len(self.error_history) > self.max_history:
            self.error_history = self.error_history[-self.max_history:]
    
    def get_health_report(self) -> str:
        """Generate human-readable health report"""
        health = self.get_system_health()
        
        report = []
        report.append("=" * 60)
        report.append("SYSTEM HEALTH REPORT")
        report.append("=" * 60)
        report.append(f"Status: {health['status'].upper()}")
        report.append(f"Timestamp: {health['timestamp']}")
        report.append("")
        report.append("Component Status:")
        report.append("-" * 60)
        
        for component, status in health['components'].items():
            icon = {
                "healthy": "🟢",
                "degraded": "🟡",
                "failed": "🔴"
            }.get(status, "⚪")
            
            report.append(f"{icon} {component.ljust(30)} {status.upper()}")
        
        report.append("")
        report.append(f"Summary:")
        report.append(f"  Healthy:  {health['healthy_count']}")
        report.append(f"  Degraded: {health['degraded_count']}")
        report.append(f"  Failed:   {health['failed_count']}")
        report.append(f"  Total Errors: {health['total_errors']}")
        report.append("=" * 60)
        
        return "\n".join(report)


# ============================================================
# Global Error Handler Instance
# ============================================================

# Create global error handler
global_error_handler = ErrorHandler()


# ============================================================
# Convenience Functions
# ============================================================

def handle_error(
    component: str,
    error: Exception,
    context: Optional[Dict] = None
) -> Dict:
    """Convenience function for error handling"""
    return global_error_handler.handle_component_failure(
        component=component,
        error=error,
        context=context
    )


def with_fallback(component: str, context: Optional[Dict] = None):
    """Convenience decorator for error handling"""
    return global_error_handler.with_fallback(component, context)


def get_system_health() -> Dict:
    """Get overall system health"""
    return global_error_handler.get_system_health()


# Export
__all__ = [
    'ErrorHandler',
    'ComponentHealth',
    'ErrorCategory',
    'global_error_handler',
    'handle_error',
    'with_fallback',
    'get_system_health'
]
