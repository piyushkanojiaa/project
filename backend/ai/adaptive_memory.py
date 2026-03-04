"""
Adaptive Memory System - Vector Embeddings

Store and retrieve similar conjunction patterns using vector similarity
"""

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List, Dict, Optional
import numpy as np
from datetime import datetime
import hashlib

# ============================================================
# Adaptive Memory Store
# ============================================================

class AdaptiveMemoryStore:
    """
    Vector-based memory system for storing and retrieving
    similar conjunction patterns
    """
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6333,
        collection_name: str = "conjunction_memory"
    ):
        """
        Initialize adaptive memory
        
        Args:
            host: Qdrant server host
            port: Qdrant server port
            collection_name: Name of vector collection
        """
        # Initialize vector database client
        try:
            self.client = QdrantClient(host=host, port=port)
        except:
            # Fallback to in-memory mode
            print("⚠️  Qdrant server not available, using in-memory mode")
            self.client = QdrantClient(":memory:")
        
        self.collection_name = collection_name
        
        # Initialize embedding model
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_dim = 384  # Dimension for all-MiniLM-L6-v2
        
        # Create collection if not exists
        self._initialize_collection()
    
    def _initialize_collection(self):
        """Create vector collection"""
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            collection_exists = any(
                c.name == self.collection_name 
                for c in collections
            )
            
            if not collection_exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dim,
                        distance=Distance.COSINE
                    )
                )
                print(f"✓ Created collection: {self.collection_name}")
        except Exception as e:
            print(f"⚠️  Collection initialization warning: {e}")
    
    def _create_text_representation(self, conjunction: Dict) -> str:
        """
        Create textual representation of conjunction for embedding
        
        Args:
            conjunction: Conjunction data
            
        Returns:
            Text representation
        """
        return f"""
Satellite: {conjunction.get('satellite_name', 'Unknown')}
Type: {conjunction.get('satellite_type', 'Unknown')}
Altitude: {conjunction.get('altitude', 0)} km
Debris: {conjunction.get('debris_name', 'Unknown')}
Debris Type: {conjunction.get('debris_type', 'Unknown')}
Miss Distance: {conjunction.get('miss_distance', 0)} km
Collision Probability: {conjunction.get('probability', 0)}
Relative Velocity: {conjunction.get('relative_velocity', 0)} km/s
Risk Level: {conjunction.get('risk_level', 'UNKNOWN')}
Status: {conjunction.get('status', 'UNKNOWN')}
Outcome: {conjunction.get('outcome', 'PENDING')}
Action Taken: {conjunction.get('action_taken', 'NONE')}
        """.strip()
    
    def store_conjunction(
        self,
        conjunction: Dict,
        outcome: Optional[str] = None,
        lessons_learned: Optional[str] = None
    ) -> str:
        """
        Store conjunction event in adaptive memory
        
        Args:
            conjunction: Conjunction data
            outcome: Final outcome (SAFE_PASS, COLLISION, MANEUVER_SUCCESS, etc.)
            lessons_learned: Optional lessons learned
            
        Returns:
            Memory ID (unique identifier)
        """
        # Create text representation
        text = self._create_text_representation(conjunction)
        
        # Generate embedding
        embedding = self.encoder.encode(text)
        
        # Create unique ID
        memory_id = self._generate_id(conjunction)
        
        # Prepare metadata
        metadata = {
            **conjunction,  # Include all conjunction data
            "stored_at": datetime.utcnow().isoformat(),
            "outcome": outcome or "PENDING",
            "lessons_learned": lessons_learned or "",
            "embedding_model": "all-MiniLM-L6-v2"
        }
        
        # Store in vector database
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=memory_id,
                        vector=embedding.tolist(),
                        payload=metadata
                    )
                ]
            )
            print(f"✓ Stored conjunction {conjunction.get('id')} in memory")
        except Exception as e:
            print(f"⚠️  Failed to store in memory: {e}")
        
        return memory_id
    
    def find_similar_conjunctions(
        self,
        current_conjunction: Dict,
        limit: int = 10,
        score_threshold: float = 0.7
    ) -> List[Dict]:
        """
        Find similar historical conjunctions
        
        Args:
            current_conjunction: Current conjunction to compare
            limit: Maximum number of results
            score_threshold: Minimum similarity score (0-1)
            
        Returns:
            List of similar conjunctions with similarity scores
        """
        # Create text representation
        text = self._create_text_representation(current_conjunction)
        
        # Generate query embedding
        query_embedding = self.encoder.encode(text)
        
        try:
            # Search vector database
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding.tolist(),
                limit=limit,
                score_threshold=score_threshold
            )
            
            # Format results
            similar_events = []
            for result in results:
                event = result.payload.copy()
                event['similarity_score'] = result.score
                event['memory_id'] = result.id
                similar_events.append(event)
            
            return similar_events
        
        except Exception as e:
            print (f"⚠️  Search failed: {e}")
            return []
    
    def get_outcome_statistics(
        self,
        similar_conjunctions: List[Dict]
    ) -> Dict:
        """
        Analyze outcomes of similar historical events
        
        Args:
            similar_conjunctions: List of similar events
            
        Returns:
            Statistical analysis of outcomes
        """
        if not similar_conjunctions:
            return {
                "total_events": 0,
                "outcomes": {},
                "average_similarity": 0.0,
                "recommendation": "INSUFFICIENT_DATA"
            }
        
        # Count outcomes
        outcomes = {}
        similarities = []
        actions_taken = {}
        
        for event in similar_conjunctions:
            outcome = event.get('outcome', 'UNKNOWN')
            outcomes[outcome] = outcomes.get(outcome, 0) + 1
            
            action = event.get('action_taken', 'NONE')
            actions_taken[action] = actions_taken.get(action, 0) + 1
            
            similarities.append(event.get('similarity_score', 0))
        
        # Calculate statistics
        total = len(similar_conjunctions)
        avg_similarity = np.mean(similarities) if similarities else 0
        
        # Determine recommendation
        maneuver_count = actions_taken.get('MANEUVER', 0)
        collision_count = outcomes.get('COLLISION', 0)
        
        if collision_count > 0:
            recommendation = "HIGH_RISK_MANEUVER_ADVISED"
        elif maneuver_count / total > 0.5:
            recommendation = "MANEUVER_COMMON"
        else:
            recommendation = "MONITORING_SUFFICIENT"
        
        return {
            "total_events": total,
            "outcomes": outcomes,
            "actions_taken": actions_taken,
            "average_similarity": float(avg_similarity),
            "collision_rate": collision_count / total if total > 0 else 0,
            "maneuver_rate": maneuver_count / total if total > 0 else 0,
            "recommendation": recommendation
        }
    
    def learn_from_outcome(
        self,
        conjunction_id: str,
        actual_outcome: str,
        lessons_learned: Optional[str] = None
    ):
        """
        Update memory with actual outcome (learning)
        
        Args:
            conjunction_id: ID of conjunction
            actual_outcome: What actually happened
            lessons_learned: Lessons learned from this event
        """
        memory_id = self._generate_id({"id": conjunction_id})
        
        try:
            # Retrieve existing point
            point = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[memory_id]
            )
            
            if point:
                # Update payload
                payload = point[0].payload
                payload['outcome'] = actual_outcome
                payload['updated_at'] = datetime.utcnow().isoformat()
                
                if lessons_learned:
                    payload['lessons_learned'] = lessons_learned
                
                # Update in database
                self.client.set_payload(
                    collection_name=self.collection_name,
                    payload=payload,
                    points=[memory_id]
                )
                
                print(f"✓ Updated memory with outcome: {actual_outcome}")
        
        except Exception as e:
            print(f"⚠️  Failed to update memory: {e}")
    
    def get_statistics(self) -> Dict:
        """Get memory statistics"""
        try:
            collection_info = self.client.get_collection(self.collection_name)
            
            return {
                "total_memories": collection_info.points_count,
                "collection": self.collection_name,
                "vector_dimension": self.embedding_dim,
                "model": "all-MiniLM-L6-v2"
            }
        except:
            return {"error": "Unable to retrieve statistics"}
    
    @staticmethod
    def _generate_id(conjunction: Dict) -> str:
        """Generate unique ID for conjunction"""
        # Create hash from conjunction ID or key properties
        if 'id' in conjunction:
            return hashlib.md5(
                conjunction['id'].encode()
            ).hexdigest()
        else:
            # Fallback to properties hash
            key = f"{conjunction.get('satellite_name')}_{conjunction.get('debris_name')}_{conjunction.get('tca')}"
            return hashlib.md5(key.encode()).hexdigest()


# ============================================================
# Pattern Recognition
# ============================================================

class PatternRecognizer:
    """Recognize patterns in conjunction data"""
    
    def __init__(self, memory_store: AdaptiveMemoryStore):
        self.memory = memory_store
    
    def detect_recurring_threats(
        self,
        satellite_id: str,
        lookback_days: int = 30
    ) -> List[Dict]:
        """
        Detect recurring threats to a specific satellite
        
        Args:
            satellite_id: Satellite to analyze
            lookback_days: How far back to look
            
        Returns:
            List of recurring threat patterns
        """
        # Query would filter by satellite_id and time range
        # For now, simplified implementation
        
        patterns = []
        # Pattern detection logic here
        
        return patterns
    
    def identify_risk_trends(self) -> Dict:
        """Identify trends in collision risks over time"""
        stats = self.memory.get_statistics()
        
        # Trend analysis would go here
        # For now, return basic structure
        
        return {
            "total_events_analyzed": stats.get('total_memories', 0),
            "trends": {
                "increasing_risk": False,
                "seasonal_patterns": False,
                "high_risk_periods": []
            }
        }


# Export
__all__ = ['AdaptiveMemoryStore', 'PatternRecognizer']
