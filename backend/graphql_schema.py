"""
GraphQL Schema for Orbital Guard AI API v2

Defines all GraphQL types, queries, mutations, and subscriptions
"""

import strawberry
from typing import List, Optional
from datetime import datetime
from enum import Enum

# ============================================================
# Enums
# ============================================================

@strawberry.enum
class RiskLevel(Enum):
    """Risk level classification for conjunctions"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

@strawberry.enum
class SatelliteType(Enum):
    """Type classification for space objects"""
    ACTIVE = "ACTIVE"
    DEBRIS = "DEBRIS"
    ROCKET_BODY = "ROCKET_BODY"
    PAYLOAD = "PAYLOAD"
    UNKNOWN = "UNKNOWN"

@strawberry.enum
class ConjunctionStatus(Enum):
    """Status of conjunction event"""
    PREDICTED = "PREDICTED"
    MONITORING = "MONITORING"
    RESOLVED = "RESOLVED"
    COLLISION = "COLLISION"

# ============================================================
# Types
# ============================================================

@strawberry.type
class Position:
    """3D position in ECI coordinates with optional lat/lng"""
    x: float
    y: float
    z: float
    lat: Optional[float] = None
    lng: Optional[float] = None
    altitude: Optional[float] = None

@strawberry.type
class Velocity:
    """3D velocity vector in km/s"""
    vx: float
    vy: float
    vz: float
    magnitude: Optional[float] = None

@strawberry.type
class TLE:
    """Two-Line Element set data"""
    line1: str
    line2: str
    epoch: datetime

@strawberry.type
class Satellite:
    """Satellite or space object"""
    id: strawberry.ID
    name: str
    norad_id: str
    type: SatelliteType
    altitude: float
    position: Position
    velocity: Optional[Velocity] = None
    tle: Optional[TLE] = None
    last_updated: datetime
    is_active: bool

@strawberry.type
class SpaceObject:
    """Generic space object (debris, rocket body, etc.)"""
    id: strawberry.ID
    name: str
    type: SatelliteType
    position: Position
    size_estimate: Optional[float] = None
    mass_estimate: Optional[float] = None

@strawberry.type
class Conjunction:
    """Conjunction event between two space objects"""
    id: strawberry.ID
    satellite_id: str
    debris_id: str
    satellite_name: str
    debris_name: str
    tca: datetime  # Time of Closest Approach
    miss_distance: float  # km
    probability: float  # 0-1
    risk_level: RiskLevel
    relative_velocity: float  # km/s
    status: ConjunctionStatus
    created_at: datetime
    updated_at: datetime

@strawberry.type
class CollisionPrediction:
    """ML-based collision prediction"""
    conjunction_id: str
    probability: float
    risk_score: float
    confidence: float
    factors: List[str]
    recommendation: str

@strawberry.type
class ConjunctionStatistics:
    """Aggregated conjunction statistics"""
    total_conjunctions: int
    by_risk_level: List["RiskLevelCount"]
    average_probability: float
    highest_risk_conjunction: Optional[Conjunction] = None
    time_range_days: int

@strawberry.type
class RiskLevelCount:
    """Count of conjunctions by risk level"""
    risk_level: RiskLevel
    count: int
    percentage: float

@strawberry.type
class RiskTrend:
    """Risk trend over time"""
    date: datetime
    total_events: int
    high_risk_count: int
    critical_risk_count: int
    average_probability: float

@strawberry.type
class Alert:
    """User alert for high-risk conjunctions"""
    id: strawberry.ID
    conjunction_id: str
    threshold: float
    created_at: datetime
    triggered_at: Optional[datetime] = None
    acknowledged: bool

@strawberry.type
class Report:
    """Generated conjunction report"""
    id: strawberry.ID
    title: str
    start_date: datetime
    end_date: datetime
    format: str
    file_path: str
    generated_at: datetime
    size_bytes: int

# ============================================================
# Input Types
# ============================================================

@strawberry.input
class TLEInput:
    """Input type for TLE updates"""
    line1: str
    line2: str

@strawberry.input
class SatelliteFilter:
    """Filter options for satellite queries"""
    type: Optional[SatelliteType] = None
    min_altitude: Optional[float] = None
    max_altitude: Optional[float] = None
    is_active: Optional[bool] = None

@strawberry.input
class ConjunctionFilter:
    """Filter options for conjunction queries"""
    risk_level: Optional[RiskLevel] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_probability: Optional[float] = None
    status: Optional[ConjunctionStatus] = None

@strawberry.input
class DateRange:
    """Date range for analytics queries"""
    start_date: datetime
    end_date: datetime

# ============================================================
# Helper Functions
# ============================================================

def create_position(x: float, y: float, z: float, 
                   lat: Optional[float] = None, 
                   lng: Optional[float] = None,
                   altitude: Optional[float] = None) -> Position:
    """Helper to create Position object"""
    return Position(x=x, y=y, z=z, lat=lat, lng=lng, altitude=altitude)

def create_velocity(vx: float, vy: float, vz: float) -> Velocity:
    """Helper to create Velocity object"""
    import math
    magnitude = math.sqrt(vx**2 + vy**2 + vz**2)
    return Velocity(vx=vx, vy=vy, vz=vz, magnitude=magnitude)
