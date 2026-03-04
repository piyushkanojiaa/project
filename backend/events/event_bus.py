"""
Event-Driven Architecture

Central event bus for system-wide events and reactive programming
"""

from typing import Callable, Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import asyncio
import json
from pydantic import BaseModel

# ============================================================
# Event Types
# ============================================================

class EventType(str, Enum):
    """System event types"""
    # Conjunction events
    CONJUNCTION_CREATED = "conjunction.created"
    CONJUNCTION_UPDATED = "conjunction.updated"
    CONJUNCTION_HIGH_RISK = "conjunction.high_risk"
    CONJUNCTION_RESOLVED = "conjunction.resolved"
    
    # Satellite events
    SATELLITE_CREATED = "satellite.created"
    SATELLITE_UPDATED = "satellite.updated"
    SATELLITE_ANOMALY = "satellite.anomaly"
    SATELLITE_HEALTH_CRITICAL = "satellite.health.critical"
    SATELLITE_HEALTH_DEGRADED = "satellite.health.degraded"
    SATELLITE_HEALTH_NOMINAL = "satellite.health.nominal"
    
    # System events
    SYSTEM_STARTUP = "system.startup"
    SYSTEM_SHUTDOWN = "system.shutdown"
    SYSTEM_ERROR = "system.error"
    SYSTEM_WARNING = "system.warning"
    
    # Database events
    DATABASE_CONNECTED = "database.connected"
    DATABASE_DISCONNECTED = "database.disconnected"
    DATABASE_ERROR = "database.error"
    
    # ML events  
    ML_PREDICTION_COMPLETE = "ml.prediction.complete"
    ML_MODEL_UPDATED = "ml.model.updated"
    ML_ANOMALY_DETECTED = "ml.anomaly.detected"
    
    # User events
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    USER_ACTION = "user.action"
    
    # API events
    API_REQUEST = "api.request"
    API_ERROR = "api.error"
    API_RATE_LIMIT = "api.rate_limit"


class Event(BaseModel):
    """Event data model"""
    event_id: str
    event_type: EventType
    timestamp: datetime
    source: str  # Which service/module generated this
    data: Dict[str, Any]
    priority: str = "NORMAL"  # LOW, NORMAL, HIGH, CRITICAL
    tags: List[str] = []


# ============================================================
# Event Bus
# ============================================================

class EventBus:
    """
    Central event bus for publish-subscribe pattern
    """
    
    def __init__(self):
        """Initialize event bus"""
        self.subscribers: Dict[EventType, List[Callable]] = {}
        self.event_history: List[Event] = []
        self.max_history = 1000
        self._lock = asyncio.Lock()
        self._running = False
        self._event_queue = asyncio.Queue()
    
    def subscribe(
        self,
        event_type: EventType,
        handler: Callable,
        priority: int = 0
    ):
        """
        Subscribe to an event type
        
        Args:
            event_type: Type of event to listen for
            handler: Async callback function
            priority: Handler priority (higher = called first)
        """
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        
        self.subscribers[event_type].append({
            "handler": handler,
            "priority": priority
        })
        
        # Sort by priority (descending)
        self.subscribers[event_type].sort(
            key=lambda x: x["priority"],
            reverse=True
        )
        
        print(f"✓ Subscribed to {event_type.value}")
    
    def unsubscribe(self, event_type: EventType, handler: Callable):
        """Unsubscribe from event type"""
        if event_type in self.subscribers:
            self.subscribers[event_type] = [
                sub for sub in self.subscribers[event_type]
                if sub["handler"] != handler
            ]
    
    async def publish(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        source: str = "system",
        priority: str = "NORMAL",
        tags: List[str] = None
    ) -> Event:
        """
        Publish an event
        
        Args:
            event_type: Type of event
            data: Event payload
            source: Source of event
            priority: Event priority
            tags: Optional tags
            
        Returns:
            Created event
        """
        import uuid
        
        # Create event
        event = Event(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=datetime.utcnow(),
            source=source,
            data=data,
            priority=priority,
            tags=tags or []
        )
        
        # Add to queue
        await self._event_queue.put(event)
        
        # Store in history
        async with self._lock:
            self.event_history.append(event)
            
            # Limit history size
            if len(self.event_history) > self.max_history:
                self.event_history = self.event_history[-self.max_history:]
        
        return event
    
    async def start_processing(self):
        """Start event processing loop"""
        self._running = True
        
        while self._running:
            try:
                # Get event from queue
                event = await asyncio.wait_for(
                    self._event_queue.get(),
                    timeout=1.0
                )
                
                # Process event
                await self._process_event(event)
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"⚠️  Event processing error: {e}")
    
    async def _process_event(self, event: Event):
        """Process a single event"""
        if event.event_type not in self.subscribers:
            return
        
        # Get handlers
        handlers = self.subscribers[event.event_type]
        
        # Execute handlers
        tasks = []
        for sub in handlers:
            handler = sub["handler"]
            tasks.append(self._safe_execute(handler, event))
        
        # Execute concurrently
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Log errors
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    print(f"⚠️  Handler error for {event.event_type}: {result}")
    
    async def _safe_execute(self, handler: Callable, event: Event):
        """Safely execute handler with error handling"""
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler(event)
            else:
                handler(event)
        except Exception as e:
            raise e
    
    def stop(self):
        """Stop event processing"""
        self._running = False
    
    def get_event_history(
        self,
        event_type: Optional[EventType] = None,
        limit: int = 100
    ) -> List[Event]:
        """Get event history"""
        if event_type:
            events = [
                e for e in self.event_history
                if e.event_type == event_type
            ]
        else:
            events = self.event_history
        
        return events[-limit:]
    
    def get_statistics(self) -> Dict:
        """Get event bus statistics"""
        total_events = len(self.event_history)
        
        # Count by type
        event_counts = {}
        for event in self.event_history:
            event_type = event.event_type.value
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
        
        # Count subscribers
        total_subscribers = sum(
            len(handlers) for handlers in self.subscribers.values()
        )
        
        return {
            "total_events": total_events,
            "event_counts": event_counts,
            "total_subscribers": total_subscribers,
            "subscribed_event_types": len(self.subscribers),
            "queue_size": self._event_queue.qsize()
        }


# ============================================================
# Event Handlers (Examples)
# ============================================================

class ConjunctionEventHandler:
    """Handle conjunction events"""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        
        # Subscribe to conjunction events
        event_bus.subscribe(
            EventType.CONJUNCTION_CREATED,
            self.on_conjunction_created
        )
        event_bus.subscribe(
            EventType.CONJUNCTION_HIGH_RISK,
            self.on_high_risk_conjunction,
            priority=10  # High priority
        )
    
    async def on_conjunction_created(self, event: Event):
        """Handle new conjunction"""
        print(f"🚨 New conjunction: {event.data.get('conjunction_id')}")
        
        # Check risk level
        risk_level = event.data.get('risk_level')
        if risk_level == "HIGH" or risk_level == "CRITICAL":
            # Publish high-risk event
            await self.event_bus.publish(
                EventType.CONJUNCTION_HIGH_RISK,
                data=event.data,
                source="conjunction_handler"
            )
    
    async def on_high_risk_conjunction(self, event: Event):
        """Handle high-risk conjunction"""
        print(f"⚠️  HIGH RISK conjunction: {event.data.get('conjunction_id')}")
        
        # Trigger alerts, notifications, etc.
        # Could trigger:
        # - Email notifications
        # - SMS alerts
        # - WebSocket push to connected clients
        # - Slack/Teams messages


class HealthMonitoringHandler:
    """Handle satellite health events"""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        
        # Subscribe to health events
        event_bus.subscribe(
            EventType.SATELLITE_HEALTH_CRITICAL,
            self.on_critical_health,
            priority=10
        )
        event_bus.subscribe(
            EventType.SATELLITE_ANOMALY,
            self.on_anomaly_detected
        )
    
    async def on_critical_health(self, event: Event):
        """Handle critical health status"""
        satellite_id = event.data.get('satellite_id')
        print(f"🚨 CRITICAL health: {satellite_id}")
        
        # Check for conjunction risk
        # If satellite has degraded health AND upcoming conjunction,
        # increase risk assessment
    
    async def on_anomaly_detected(self, event: Event):
        """Handle detected anomaly"""
        print(f"⚠️  Anomaly: {event.data.get('anomaly_type')}")


class MLEventHandler:
    """Handle ML prediction events"""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        
        event_bus.subscribe(
            EventType.ML_ANOMALY_DETECTED,
            self.on_ml_anomaly
        )
    
    async def on_ml_anomaly(self, event: Event):
        """Handle ML-detected anomaly"""
        print(f"🤖 ML anomaly: {event.data.get('description')}")


# ============================================================
# Global Event Bus Instance
# ============================================================

# Create global event bus
global_event_bus = EventBus()


async def start_event_system():
    """Start the global event system"""
    # Initialize handlers
    ConjunctionEventHandler(global_event_bus)
    HealthMonitoringHandler(global_event_bus)
    MLEventHandler(global_event_bus)
    
    # Start processing
    await global_event_bus.start_processing()


# Export
__all__ = [
    'Event',
    'EventType',
    'EventBus',
    'global_event_bus',
    'start_event_system',
    'ConjunctionEventHandler',
    'HealthMonitoringHandler',
    'MLEventHandler'
]
