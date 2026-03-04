"""
Health Tracker

Real-time component health tracking and reporting
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel

# ============================================================
# Models
# ============================================================

class HealthStatus(str, Enum):
    """Component health status"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    UNKNOWN = "unknown"


class ComponentInfo(BaseModel):
    """Component health information"""
    name: str
    status: HealthStatus
    last_check: datetime
    uptime_seconds: float
    error_count: int
    last_error: Optional[str] = None
    fallback_active: bool = False
    fallback_name: Optional[str] = None
    metadata: Dict = {}


# ============================================================
# Health Tracker
# ============================================================

class HealthTracker:
    """
    Track health of all system components
    Provides dashboard view of system status
    """
    
    def __init__(self):
        """Initialize health tracker"""
        self.components: Dict[str, ComponentInfo] = {}
        self.start_time = datetime.utcnow()
        self.health_history: List[Dict] = []
        self.max_history = 1000
    
    def register_component(
        self,
        name: str,
        metadata: Optional[Dict] = None
    ):
        """Register a component for health tracking"""
        self.components[name] = ComponentInfo(
            name=name,
            status=HealthStatus.UNKNOWN,
            last_check=datetime.utcnow(),
            uptime_seconds=0,
            error_count=0,
            fallback_active=False,
            metadata=metadata or {}
        )
    
    def update_status(
        self,
        component: str,
        status: HealthStatus,
        error: Optional[str] = None,
        fallback_name: Optional[str] = None
    ):
        """Update component health status"""
        if component not in self.components:
            self.register_component(component)
        
        comp = self.components[component]
        comp.status = status
        comp.last_check = datetime.utcnow()
        
        if error:
            comp.error_count += 1
            comp.last_error = error
        
        if fallback_name:
            comp.fallback_active = True
            comp.fallback_name = fallback_name
        else:
            comp.fallback_active = False
            comp.fallback_name = None
        
        # Calculate uptime
        comp.uptime_seconds = (
            datetime.utcnow() - self.start_time
        ).total_seconds()
        
        # Add to history
        self._add_to_history({
            "timestamp": datetime.utcnow().isoformat(),
            "component": component,
            "status": status.value,
            "error": error
        })
    
    def mark_healthy(self, component: str):
        """Mark component as healthy"""
        self.update_status(component, HealthStatus.HEALTHY)
    
    def mark_degraded(
        self,
        component: str,
        error: str,
        fallback: Optional[str] = None
    ):
        """Mark component as degraded"""
        self.update_status(
            component,
            HealthStatus.DEGRADED,
            error=error,
            fallback_name=fallback
        )
    
    def mark_failed(self, component: str, error: str):
        """Mark component as failed"""
        self.update_status(component, HealthStatus.FAILED, error=error)
    
    def get_component_health(self, component: str) -> Optional[ComponentInfo]:
        """Get health info for specific component"""
        return self.components.get(component)
    
    def get_all_components(self) -> Dict[str, ComponentInfo]:
        """Get all component health information"""
        return self.components.copy()
    
    def get_system_overview(self) -> Dict:
        """Get system-wide health overview"""
        total = len(self.components)
        
        if total == 0:
            return {
                "status": "unknown",
                "total_components": 0,
                "uptime_seconds": 0
            }
        
        # Count by status
        healthy = sum(
            1 for c in self.components.values()
            if c.status == HealthStatus.HEALTHY
        )
        degraded = sum(
            1 for c in self.components.values()
            if c.status == HealthStatus.DEGRADED
        )
        failed = sum(
            1 for c in self.components.values()
            if c.status == HealthStatus.FAILED
        )
        
        # Determine overall status
        if failed > 0:
            overall_status = "critical"
        elif degraded > 0:
            overall_status = "degraded"
        elif healthy == total:
            overall_status = "healthy"
        else:
            overall_status = "unknown"
        
        # Calculate total errors
        total_errors = sum(c.error_count for c in self.components.values())
        
        # Components using fallbacks
        fallback_count = sum(
            1 for c in self.components.values()
            if c.fallback_active
        )
        
        return {
            "status": overall_status,
            "total_components": total,
            "healthy": healthy,
            "degraded": degraded,
            "failed": failed,
            "unknown": total - healthy - degraded - failed,
            "total_errors": total_errors,
            "fallbacks_active": fallback_count,
            "uptime_seconds": (datetime.utcnow() - self.start_time).total_seconds(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_degraded_components(self) -> List[ComponentInfo]:
        """Get list of degraded components"""
        return [
            comp for comp in self.components.values()
            if comp.status == HealthStatus.DEGRADED
        ]
    
    def get_failed_components(self) -> List[ComponentInfo]:
        """Get list of failed components"""
        return [
            comp for comp in self.components.values()
            if comp.status == HealthStatus.FAILED
        ]
    
    def get_dashboard_view(self) -> str:
        """
        Generate ASCII dashboard view
        
        Returns:
            Human-readable dashboard
        """
        overview = self.get_system_overview()
        
        lines = []
        lines.append("┌" + "─" * 58 + "┐")
        lines.append("│" + " " * 18 + "SYSTEM HEALTH" + " " * 27 + "│")
        lines.append("├" + "─" * 58 + "┤")
        
        # Overall status
        status_icon = {
            "healthy": "🟢",
            "degraded": "🟡",
            "critical": "🔴",
            "unknown": "⚪"
        }.get(overview['status'], "⚪")
        
        lines.append(f"│ {status_icon} Overall Status: {overview['status'].upper().ljust(36)} │")
        lines.append("├" + "─" * 58 + "┤")
        
        # Component breakdown
        for name, comp in sorted(self.components.items()):
            icon = {
                HealthStatus.HEALTHY: "🟢",
                HealthStatus.DEGRADED: "🟡",
                HealthStatus.FAILED: "🔴",
                HealthStatus.UNKNOWN: "⚪"
            }.get(comp.status, "⚪")
            
            status_text = comp.status.value.upper()
            
            # Add fallback indicator
            if comp.fallback_active:
                status_text += f" (fallback: {comp.fallback_name})"
            
            # Truncate if too long
            display_name = name[:25]
            display_status = status_text[:28]
            
            lines.append(f"│ {icon} {display_name.ljust(25)} {display_status.ljust(28)} │")
        
        lines.append("├" + "─" * 58 + "┤")
        
        # Summary
        lines.append(f"│ Summary:                                                 │")
        lines.append(f"│   Total Components: {str(overview['total_components']).ljust(39)} │")
        lines.append(f"│   Healthy:  {str(overview['healthy']).ljust(46)} │")
        lines.append(f"│   Degraded: {str(overview['degraded']).ljust(46)} │")
        lines.append(f"│   Failed:   {str(overview['failed']).ljust(46)} │")
        lines.append(f"│   Total Errors: {str(overview['total_errors']).ljust(42)} │")
        lines.append(f"│   Fallbacks Active: {str(overview['fallbacks_active']).ljust(38)} │")
        
        # Uptime
        uptime = timedelta(seconds=int(overview['uptime_seconds']))
        lines.append(f"│   Uptime: {str(uptime).ljust(46)} │")
        
        lines.append("└" + "─" * 58 + "┘")
        
        return "\n".join(lines)
    
    def _add_to_history(self, record: Dict):
        """Add health record to history"""
        self.health_history.append(record)
        
        if len(self.health_history) > self.max_history:
            self.health_history = self.health_history[-self.max_history:]
    
    def get_recent_health_changes(self, limit: int = 10) -> List[Dict]:
        """Get recent health status changes"""
        return self.health_history[-limit:]


# ============================================================
# Global Health Tracker
# ============================================================

global_health_tracker = HealthTracker()


# Export
__all__ = [
    'HealthTracker',
    'HealthStatus',
    'ComponentInfo',
    'global_health_tracker'
]
