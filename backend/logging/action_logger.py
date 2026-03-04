"""
Action Logging System

Comprehensive logging of all system actions with operator feedback
"""

from typing import Dict, List, Optional, Callable
from datetime import datetime
from pydantic import BaseModel
from enum import Enum
from functools import wraps
import uuid

# ============================================================
# Models
# ============================================================

class ActionOutcome(str, Enum):
    """Action outcome status"""
    SUCCESS = "success"
    FAILURE = "failure"
    PENDING = "pending"
    PARTIAL = "partial"


class ActionLog(BaseModel):
    """Action log entry"""
    action_id: str
    action_type: str
    satellite_id: Optional[str] = None
    parameters: Dict
    timestamp: datetime
    outcome: ActionOutcome
    duration_ms: Optional[float] = None
    error: Optional[str] = None
    operator_feedback: Optional[str] = None
    feedback_timestamp: Optional[datetime] = None
    learned: bool = False
    metadata: Dict = {}


class OperatorFeedback(BaseModel):
    """Operator feedback on action"""
    action_id: str
    feedback: str
    rating: int  # 1-5 stars
    would_repeat: bool
    timestamp: datetime
    operator_id: str


# ============================================================
# Action Logger
# ============================================================

class ActionLogger:
    """
    Comprehensive action logging system
    Tracks all system actions with outcomes and operator feedback
    """
    
    def __init__(self):
        """Initialize action logger"""
        self.logs: Dict[str, ActionLog] = {}
        self.feedback: Dict[str, List[OperatorFeedback]] = {}
        self.max_logs = 10000
    
    def log_action(
        self,
        action_type: str,
        parameters: Dict,
        satellite_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Log a new action
        
        Args:
            action_type: Type of action (e.g., "maneuver", "recovery")
            parameters: Action parameters
            satellite_id: Optional satellite ID
            metadata: Optional additional metadata
            
        Returns:
            Action ID
        """
        action_id = str(uuid.uuid4())
        
        log_entry = ActionLog(
            action_id=action_id,
            action_type=action_type,
            satellite_id=satellite_id,
            parameters=parameters,
            timestamp=datetime.utcnow(),
            outcome=ActionOutcome.PENDING,
            metadata=metadata or {}
        )
        
        self.logs[action_id] = log_entry
        
        # Limit log size
        if len(self.logs) > self.max_logs:
            # Remove oldest
            oldest_id = min(self.logs.keys(), key=lambda k: self.logs[k].timestamp)
            del self.logs[oldest_id]
        
        return action_id
    
    def update_outcome(
        self,
        action_id: str,
        outcome: ActionOutcome,
        duration_ms: Optional[float] = None,
        error: Optional[str] = None
    ):
        """
        Update action outcome
        
        Args:
            action_id: Action ID
            outcome: Outcome status
            duration_ms: Execution duration in milliseconds
            error: Error message if failed
        """
        if action_id in self.logs:
            log = self.logs[action_id]
            log.outcome = outcome
            log.duration_ms = duration_ms
            log.error = error
    
    def add_operator_feedback(
        self,
        action_id: str,
        feedback: str,
        rating: int,
        would_repeat: bool,
        operator_id: str = "system"
    ):
        """
        Add operator feedback for action
        
        Args:
            action_id: Action ID
            feedback: Feedback text
            rating: Rating (1-5)
            would_repeat: Would operator repeat this action?
            operator_id: Operator identifier
        """
        if action_id in self.logs:
            # Update log entry
            log = self.logs[action_id]
            log.operator_feedback = feedback
            log.feedback_timestamp = datetime.utcnow()
            
            # Store detailed feedback
            feedback_entry = OperatorFeedback(
                action_id=action_id,
                feedback=feedback,
                rating=rating,
                would_repeat=would_repeat,
                timestamp=datetime.utcnow(),
                operator_id=operator_id
            )
            
            if action_id not in self.feedback:
                self.feedback[action_id] = []
            
            self.feedback[action_id].append(feedback_entry)
    
    def mark_as_learned(self, action_id: str):
        """Mark action as incorporated into learning"""
        if action_id in self.logs:
            self.logs[action_id].learned = True
    
    def get_action_log(self, action_id: str) -> Optional[ActionLog]:
        """Get action log by ID"""
        return self.logs.get(action_id)
    
    def get_actions_for_satellite(
        self,
        satellite_id: str,
        limit: int = 100
    ) -> List[ActionLog]:
        """Get action logs for specific satellite"""
        actions = [
            log for log in self.logs.values()
            if log.satellite_id == satellite_id
        ]
        
        # Sort by timestamp (newest first)
        actions.sort(key=lambda x: x.timestamp, reverse=True)
        
        return actions[:limit]
    
    def get_actions_by_type(
        self,
        action_type: str,
        limit: int = 100
    ) -> List[ActionLog]:
        """Get actions by type"""
        actions = [
            log for log in self.logs.values()
            if log.action_type == action_type
        ]
        
        actions.sort(key=lambda x: x.timestamp, reverse=True)
        
        return actions[:limit]
    
    def get_failed_actions(self, limit: int = 50) -> List[ActionLog]:
        """Get failed actions for analysis"""
        failed = [
            log for log in self.logs.values()
            if log.outcome == ActionOutcome.FAILURE
        ]
        
        failed.sort(key=lambda x: x.timestamp, reverse=True)
        
        return failed[:limit]
    
    def get_statistics(self) -> Dict:
        """Get action logging statistics"""
        total = len(self.logs)
        
        if total == 0:
            return {
                "total_actions": 0,
                "success_rate": 0.0
            }
        
        # Count by outcome
        success_count = sum(
            1 for log in self.logs.values()
            if log.outcome == ActionOutcome.SUCCESS
        )
        failure_count = sum(
            1 for log in self.logs.values()
            if log.outcome == ActionOutcome.FAILURE
        )
        pending_count = sum(
            1 for log in self.logs.values()
            if log.outcome == ActionOutcome.PENDING
        )
        
        # Count by type
        actions_by_type = {}
        for log in self.logs.values():
            actions_by_type[log.action_type] = actions_by_type.get(log.action_type, 0) + 1
        
        # Feedback stats
        total_feedback = sum(len(fb) for fb in self.feedback.values())
        avg_rating = 0.0
        if total_feedback > 0:
            all_ratings = [
                fb.rating
                for feedback_list in self.feedback.values()
                for fb in feedback_list
            ]
            avg_rating = sum(all_ratings) / len(all_ratings)
        
        # Learning stats
        learned_count = sum(
            1 for log in self.logs.values()
            if log.learned
        )
        
        return {
            "total_actions": total,
            "success_count": success_count,
            "failure_count": failure_count,
            "pending_count": pending_count,
            "success_rate": success_count / total if total > 0 else 0.0,
            "actions_by_type": actions_by_type,
            "feedback_count": total_feedback,
            "average_rating": avg_rating,
            "learned_actions": learned_count,
            "learning_rate": learned_count / total if total > 0 else 0.0
        }


# ============================================================
# Decorator for Auto-Logging
# ============================================================

def log_feedback(
    action_type: str,
    logger: Optional[ActionLogger] = None
):
    """
    Decorator for automatic action logging
    
    Usage:
        @log_feedback("maneuver")
        async def execute_maneuver(satellite_id, delta_v):
            # ... execute maneuver
            return result
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            import time
            
            # Get logger
            action_logger = logger or global_action_logger
            
            # Extract parameters
            params = {
                "args": str(args),
                "kwargs": kwargs
            }
            
            # Extract satellite_id if present
            satellite_id = kwargs.get("satellite_id")
            
            # Log action start
            action_id = action_logger.log_action(
                action_type=action_type,
                parameters=params,
                satellite_id=satellite_id
            )
            
            start_time = time.time()
            
            try:
                # Execute function
                result = await func(*args, **kwargs)
                
                # Calculate duration
                duration_ms = (time.time() - start_time) * 1000
                
                # Update outcome
                action_logger.update_outcome(
                    action_id=action_id,
                    outcome=ActionOutcome.SUCCESS,
                    duration_ms=duration_ms
                )
                
                return result
            
            except Exception as e:
                # Calculate duration
                duration_ms = (time.time() - start_time) * 1000
                
                # Update outcome
                action_logger.update_outcome(
                    action_id=action_id,
                    outcome=ActionOutcome.FAILURE,
                    duration_ms=duration_ms,
                    error=str(e)
                )
                
                raise e
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            import time
            
            # Similar logic for sync functions
            action_logger = logger or global_action_logger
            
            params = {
                "args": str(args),
                "kwargs": kwargs
            }
            
            satellite_id = kwargs.get("satellite_id")
            
            action_id = action_logger.log_action(
                action_type=action_type,
                parameters=params,
                satellite_id=satellite_id
            )
            
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                action_logger.update_outcome(
                    action_id=action_id,
                    outcome=ActionOutcome.SUCCESS,
                    duration_ms=duration_ms
                )
                
                return result
            
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                action_logger.update_outcome(
                    action_id=action_id,
                    outcome=ActionOutcome.FAILURE,
                    duration_ms=duration_ms,
                    error=str(e)
                )
                
                raise e
        
        # Return appropriate wrapper
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


# ============================================================
# Global Action Logger
# ============================================================

global_action_logger = ActionLogger()


# Export
__all__ = [
    'ActionLogger',
    'ActionLog',
    'ActionOutcome',
    'OperatorFeedback',
    'log_feedback',
    'global_action_logger'
]
