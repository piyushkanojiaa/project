"""
Fallback Implementations

Fallback strategies for graceful degradation when components fail
"""

from typing import Dict, List, Any
import numpy as np
from datetime import datetime

# ============================================================
# AI Model Fallbacks
# ============================================================

class HeuristicDetector:
    """
    Simple heuristic-based anomaly detector
    Fallback for when AI model fails to load
    """
    
    @staticmethod
    def analyze(telemetry: Dict) -> Dict:
        """
        Heuristic anomaly detection
        
        Uses simple threshold-based rules instead of ML
        """
        anomalies = []
        
        # Battery check
        if telemetry.get('battery_level', 100) < 20:
            anomalies.append("LOW_BATTERY")
        
        # Temperature check
        if telemetry.get('cpu_temperature', 0) > 80:
            anomalies.append("HIGH_TEMP")
        
        # Signal check
        if telemetry.get('signal_strength', 0) < -90:
            anomalies.append("WEAK_SIGNAL")
        
        return {
            "mode": "heuristic",
            "anomalies": anomalies,
            "confidence": 0.6,  # Lower confidence than ML
            "method": "threshold_based"
        }


class SimplePredictor:
    """
    Simple trajectory predictor
    Fallback for ML trajectory prediction
    """
    
    @staticmethod
    def predict_trajectory(current_state: Dict) -> Dict:
        """Linear extrapolation instead of LSTM"""
        # Simple linear prediction
        return {
            "mode": "simple",
            "method": "linear_extrapolation",
            "confidence": 0.5,
            "positions": []  # Would calculate linear path
        }


# ============================================================
# Database Fallbacks
# ============================================================

class InMemoryCache:
    """
    In-memory cache fallback when database fails
    """
    
    def __init__(self):
        self.cache: Dict[str, Any] = {}
        self.max_size = 1000
    
    def get(self, key: str) -> Any:
        """Get from cache"""
        return self.cache.get(key)
    
    def set(self, key: str, value: Any):
        """Set in cache"""
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        
        self.cache[key] = value
    
    def delete(self, key: str):
        """Delete from cache"""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()


class LocalBuffer:
    """
    Local buffer for when database is unavailable
    Stores data locally and syncs when database recovers
    """
    
    def __init__(self):
        self.buffer: List[Dict] = []
        self.max_buffer_size = 10000
    
    def add(self, data: Dict):
        """Add to buffer"""
        if len(self.buffer) >= self.max_buffer_size:
            # Remove oldest
            self.buffer.pop(0)
        
        data['buffered_at'] = datetime.utcnow().isoformat()
        self.buffer.append(data)
    
    def get_all(self) -> List[Dict]:
        """Get all buffered data"""
        return self.buffer.copy()
    
    def clear(self):
        """Clear buffer"""
        self.buffer.clear()
    
    def size(self) -> int:
        """Get buffer size"""
        return len(self.buffer)


# ============================================================
# Memory Store Fallbacks
# ============================================================

class InMemoryVectorStore:
    """
    Simple in-memory vector store
    Fallback when Qdrant is unavailable
    """
    
    def __init__(self):
        self.vectors: Dict[str, np.ndarray] = {}
        self.metadata: Dict[str, Dict] = {}
    
    def store(self, id: str, vector: np.ndarray, metadata: Dict):
        """Store vector"""
        self.vectors[id] = vector
        self.metadata[id] = metadata
    
    def search(self, query_vector: np.ndarray, limit: int = 10) -> List[Dict]:
        """
        Simple cosine similarity search
        """
        if not self.vectors:
            return []
        
        results = []
        
        for id, vector in self.vectors.items():
            # Cosine similarity
            similarity = np.dot(query_vector, vector) / (
                np.linalg.norm(query_vector) * np.linalg.norm(vector)
            )
            
            results.append({
                "id": id,
                "similarity": float(similarity),
                "metadata": self.metadata[id]
            })
        
        # Sort by similarity
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        return results[:limit]


# ============================================================
# API Fallbacks
# ============================================================

class QueuedRequests:
    """
    Queue requests when API endpoint is unavailable
    Retry with exponential backoff
    """
    
    def __init__(self):
        self.queue: List[Dict] = []
        self.max_queue_size = 1000
        self.retry_attempts: Dict[str, int] = {}
    
    def queue_request(self, request: Dict):
        """Queue a failed request"""
        if len(self.queue) >= self.max_queue_size:
            # Remove oldest
            self.queue.pop(0)
        
        request['queued_at'] = datetime.utcnow().isoformat()
        request['retry_count'] = self.retry_attempts.get(request.get('id'), 0)
        
        self.queue.append(request)
    
    def get_pending(self) -> List[Dict]:
        """Get pending requests"""
        return self.queue.copy()
    
    def remove(self, request_id: str):
        """Remove request from queue"""
        self.queue = [
            r for r in self.queue
            if r.get('id') != request_id
        ]
    
    def increment_retry(self, request_id: str):
        """Increment retry count"""
        self.retry_attempts[request_id] = self.retry_attempts.get(request_id, 0) + 1


class CircuitBreaker:
    """
    Circuit breaker pattern
    Prevents cascading failures
    """
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout  # seconds
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half_open
    
    def call(self, func, *args, **kwargs):
        """Call function through circuit breaker"""
        if self.state == "open":
            # Check if timeout passed
            if self.last_failure_time:
                elapsed = (datetime.utcnow() - self.last_failure_time).seconds
                if elapsed > self.timeout:
                    self.state = "half_open"
                else:
                    raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            
            # Success - reset
            if self.state == "half_open":
                self.state = "closed"
                self.failure_count = 0
            
            return result
        
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = datetime.utcnow()
            
            if self.failure_count >= self.failure_threshold:
                self.state = "open"
            
            raise e


# ============================================================
# Configuration Fallbacks
# ============================================================

DEFAULT_CONFIG = {
    "ai_model": {
        "fallback": HeuristicDetector,
        "description": "Heuristic threshold-based detection"
    },
    "trajectory_predictor": {
        "fallback": SimplePredictor,
        "description": "Linear extrapolation"
    },
    "database": {
        "fallback": LocalBuffer,
        "description": "Local buffering with sync"
    },
    "memory_store": {
        "fallback": InMemoryVectorStore,
        "description": "In-memory vector similarity"
    },
    "api_endpoint": {
        "fallback": QueuedRequests,
        "description": "Request queuing with retry"
    }
}


# Export
__all__ = [
    'HeuristicDetector',
    'SimplePredictor',
    'InMemoryCache',
    'LocalBuffer',
    'InMemoryVectorStore',
    'QueuedRequests',
    'CircuitBreaker',
    'DEFAULT_CONFIG'
]
