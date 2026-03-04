"""
GraphQL Resolvers for Orbital Guard AI API v2

Implements query and mutation resolvers
"""

import strawberry
from typing import List, Optional
from datetime import datetime, timedelta
from graphql_schema import (
    Satellite, Conjunction, Position, Velocity, TLE,
    SatelliteType, RiskLevel, ConjunctionStatus,
    ConjunctionStatistics, RiskLevelCount, RiskTrend,
    CollisionPrediction, Alert, Report,
    SatelliteFilter, ConjunctionFilter, DateRange, TLEInput,
    create_position, create_velocity
)

# Import existing backend services
try:
    from .tle_data import TLE_DATA
    from .collision_ml_model import predict_collision_risk
except ImportError:
    TLE_DATA = []
    predict_collision_risk = None

# ============================================================
# Data Access Layer (mocked for now, can be replaced with DB)
# ============================================================

def get_satellites_from_db(
    type_filter: Optional[SatelliteType] = None,
    min_altitude: Optional[float] = None,
    max_altitude: Optional[float] = None,
    is_active: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Satellite]:
    """Fetch satellites from data source"""
    satellites = []
    
    for i, tle in enumerate(TLE_DATA[:limit]):
        sat_type = SatelliteType.ACTIVE if "SAT" in tle[0].upper() else SatelliteType.DEBRIS
        
        # Apply filters
        if type_filter and sat_type != type_filter:
            continue
        
        # Mock satellite data
        altitude = 400 + (i * 50) % 600  # 400-1000 km
        
        if min_altitude and altitude < min_altitude:
            continue
        if max_altitude and altitude > max_altitude:
            continue
        if is_active is not None and sat_type != SatelliteType.ACTIVE:
            continue
        
        position = create_position(
            x=6871.0 + i * 10,
            y=0.0,
            z=0.0,
            altitude=altitude
        )
        
        velocity = create_velocity(0.0, 7.5, 0.0)
        
        tle_obj = TLE(
            line1=tle[1] if len(tle) > 2 else "",
            line2=tle[2] if len(tle) > 2 else "",
            epoch=datetime.now()
        )
        
        satellites.append(Satellite(
            id=strawberry.ID(f"sat-{i}"),
            name=tle[0],
            norad_id=f"{25544 + i}",
            type=sat_type,
            altitude=altitude,
            position=position,
            velocity=velocity,
            tle=tle_obj,
            last_updated=datetime.now(),
            is_active=(sat_type == SatelliteType.ACTIVE)
        ))
    
    return satellites[offset:offset + limit]

def get_conjunctions_from_db(
    risk_level: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    min_probability: Optional[float] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Conjunction]:
    """Fetch conjunctions from data source"""
    conjunctions = []
    
    # Generate mock conjunction data
    for i in range(min(limit, 50)):
        prob = 0.0001 + (i * 0.00005)
        
        if prob < 0.0002:
            risk = RiskLevel.LOW
        elif prob < 0.0005:
            risk = RiskLevel.MEDIUM
        elif prob < 0.001:
            risk = RiskLevel.HIGH
        else:
            risk = RiskLevel.CRITICAL
        
        # Apply filters
        if risk_level and risk.value != risk_level:
            continue
        if min_probability and prob < min_probability:
            continue
        
        tca = datetime.now() + timedelta(hours=i * 2)
        
        if start_date and tca < start_date:
            continue
        if end_date and tca > end_date:
            continue
        
        current_status = ConjunctionStatus.PREDICTED
        if status and current_status.value != status:
            continue
        
        conjunctions.append(Conjunction(
            id=strawberry.ID(f"conj-{i}"),
            satellite_id=f"sat-{i}",
            debris_id=f"debris-{i * 2}",
            satellite_name=f"Satellite {i}",
            debris_name=f"Debris {i * 2}",
            tca=tca,
            miss_distance=0.5 + (i * 0.1),
            probability=prob,
            risk_level=risk,
            relative_velocity=10.5 + (i * 0.5),
            status=current_status,
            created_at=datetime.now() - timedelta(days=1),
            updated_at=datetime.now()
        ))
    
    return conjunctions[offset:offset + limit]

# ============================================================
# Query Resolvers
# ============================================================

@strawberry.type
class Query:
    """Root Query type"""
    
    @strawberry.field
    def satellites(
        self,
        type: Optional[SatelliteType] = None,
        min_altitude: Optional[float] = None,
        max_altitude: Optional[float] = None,
        is_active: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Satellite]:
        """Get list of satellites with optional filters"""
        return get_satellites_from_db(
            type_filter=type,
            min_altitude=min_altitude,
            max_altitude=max_altitude,
            is_active=is_active,
            limit=limit,
            offset=offset
        )
    
    @strawberry.field
    def satellite(self, id: strawberry.ID) -> Optional[Satellite]:
        """Get single satellite by ID"""
        satellites = get_satellites_from_db(limit=1000)
        for sat in satellites:
            if sat.id == id:
                return sat
        return None
    
    @strawberry.field
    def satellite_by_norad(self, norad_id: str) -> Optional[Satellite]:
        """Get satellite by NORAD ID"""
        satellites = get_satellites_from_db(limit=1000)
        for sat in satellites:
            if sat.norad_id == norad_id:
                return sat
        return None
    
    @strawberry.field
    def conjunctions(
        self,
        risk_level: Optional[RiskLevel] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        min_probability: Optional[float] = None,
        status: Optional[ConjunctionStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Conjunction]:
        """Get list of conjunctions with optional filters"""
        return get_conjunctions_from_db(
            risk_level=risk_level.value if risk_level else None,
            start_date=start_date,
            end_date=end_date,
            min_probability=min_probability,
            status=status.value if status else None,
            limit=limit,
            offset=offset
        )
    
    @strawberry.field
    def conjunction(self, id: strawberry.ID) -> Optional[Conjunction]:
        """Get single conjunction by ID"""
        conjunctions = get_conjunctions_from_db(limit=1000)
        for conj in conjunctions:
            if conj.id == id:
                return conj
        return None
    
    @strawberry.field
    def conjunction_stats(self, days: int = 7) -> ConjunctionStatistics:
        """Get conjunction statistics for specified time period"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        conjunctions = get_conjunctions_from_db(
            start_date=start_date,
            end_date=end_date,
            limit=1000
        )
        
        # Calculate statistics
        risk_counts = {
            RiskLevel.LOW: 0,
            RiskLevel.MEDIUM: 0,
            RiskLevel.HIGH: 0,
            RiskLevel.CRITICAL: 0
        }
        
        total_prob = 0.0
        highest_risk = None
        highest_prob = 0.0
        
        for conj in conjunctions:
            risk_counts[conj.risk_level] += 1
            total_prob += conj.probability
            
            if conj.probability > highest_prob:
                highest_prob = conj.probability
                highest_risk = conj
        
        total = len(conjunctions)
        avg_prob = total_prob / total if total > 0 else 0.0
        
        risk_level_counts = [
            RiskLevelCount(
                risk_level=level,
                count=count,
                percentage=(count / total * 100) if total > 0 else 0.0
            )
            for level, count in risk_counts.items()
        ]
        
        return ConjunctionStatistics(
            total_conjunctions=total,
            by_risk_level=risk_level_counts,
            average_probability=avg_prob,
            highest_risk_conjunction=highest_risk,
            time_range_days=days
        )
    
    @strawberry.field
    def risk_trends(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[RiskTrend]:
        """Get risk trends over time period"""
        trends = []
        current_date = start_date
        
        while current_date <= end_date:
            day_end = current_date + timedelta(days=1)
            
            conjunctions = get_conjunctions_from_db(
                start_date=current_date,
                end_date=day_end,
                limit=1000
            )
            
            high_risk = sum(1 for c in conjunctions if c.risk_level == RiskLevel.HIGH)
            critical_risk = sum(1 for c in conjunctions if c.risk_level == RiskLevel.CRITICAL)
            avg_prob = sum(c.probability for c in conjunctions) / len(conjunctions) if conjunctions else 0.0
            
            trends.append(RiskTrend(
                date=current_date,
                total_events=len(conjunctions),
                high_risk_count=high_risk,
                critical_risk_count=critical_risk,
                average_probability=avg_prob
            ))
            
            current_date += timedelta(days=1)
        
        return trends
    
    @strawberry.field
    def predict_collision(
        self,
        satellite_id: strawberry.ID,
        debris_id: strawberry.ID,
        hours: int = 24
    ) -> CollisionPrediction:
        """Predict collision probability using ML model"""
        # Mock prediction - replace with actual ML model
        return CollisionPrediction(
            conjunction_id=f"{satellite_id}-{debris_id}",
            probability=0.00045,
            risk_score=0.75,
            confidence=0.92,
            factors=[
                "Close approach distance",
                "High relative velocity",
                "Orbital plane intersection"
            ],
            recommendation="Monitor closely. Consider evasive maneuver if probability exceeds 0.001"
        )

# ============================================================
# Mutation Resolvers
# ============================================================

@strawberry.type
class Mutation:
    """Root Mutation type"""
    
    @strawberry.mutation
    def update_satellite_tle(
        self,
        id: strawberry.ID,
        tle: TLEInput
    ) -> Satellite:
        """Update satellite TLE data"""
        # Mock implementation - replace with actual DB update
        satellite = Query().satellite(id=id)
        if satellite:
            satellite.tle = TLE(
                line1=tle.line1,
                line2=tle.line2,
                epoch=datetime.now()
            )
            satellite.last_updated = datetime.now()
        return satellite
    
    @strawberry.mutation
    def update_conjunction_status(
        self,
        id: strawberry.ID,
        status: ConjunctionStatus
    ) -> Conjunction:
        """Update conjunction status"""
        # Mock implementation
        conjunction = Query().conjunction(id=id)
        if conjunction:
            conjunction.status = status
            conjunction.updated_at = datetime.now()
        return conjunction
    
    @strawberry.mutation
    def create_alert(
        self,
        conjunction_id: strawberry.ID,
        threshold: float
    ) -> Alert:
        """Create alert for conjunction"""
        return Alert(
            id=strawberry.ID(f"alert-{conjunction_id}"),
            conjunction_id=str(conjunction_id),
            threshold=threshold,
            created_at=datetime.now(),
            triggered_at=None,
            acknowledged=False
        )
