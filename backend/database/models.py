"""
Database Models for Conjunction History
SQLAlchemy ORM models for storing historical conjunction data
"""

from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class ConjunctionHistory(Base):
    """Historical record of detected conjunctions"""
    __tablename__ = "conjunction_history"
    
    # Primary identifiers
    id = Column(Integer, primary_key=True, autoincrement=True)
    conjunction_id = Column(String(50), unique=True, nullable=False, index=True)
    
    # Object identifiers
    satellite_id = Column(String(20), nullable=False, index=True)
    satellite_name = Column(String(100), nullable=False)
    debris_id = Column(String(20), nullable=False, index=True)
    debris_name = Column(String(100), nullable=False)
    
    # Time information
    tca_timestamp = Column(DateTime, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    time_to_tca = Column(Float)  # seconds
    
    # Risk assessment
    risk_level = Column(String(20), nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    poc_analytic = Column(Float, nullable=False)  # Foster 3D PoC
    poc_ml = Column(Float, nullable=False)  # ML prediction
    model_agreement = Column(Float)  # Percentage
    
    # Orbital parameters
    miss_distance = Column(Float, nullable=False)  # km
    relative_velocity = Column(Float, nullable=False)  # km/s
    crossing_angle = Column(Float)  # degrees
    satellite_altitude = Column(Float)  # km
    debris_size = Column(Float)  # km
    
    # Maneuver information
    maneuver_required = Column(Boolean, default=False)
    maneuver_executed = Column(Boolean, default=False)
    maneuver_details = Column(Text, nullable=True)  # JSON string
    
    # Status tracking
    status = Column(String(20), default='ACTIVE')  # ACTIVE, RESOLVED, FALSE_ALARM
    notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<ConjunctionHistory({self.conjunction_id}, {self.risk_level}, TCA:{self.tca_timestamp})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'conjunction_id': self.conjunction_id,
            'satellite_id': self.satellite_id,
            'satellite_name': self.satellite_name,
            'debris_id': self.debris_id,
            'debris_name': self.debris_name,
            'tca_timestamp': self.tca_timestamp.isoformat() if self.tca_timestamp else None,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'time_to_tca': self.time_to_tca,
            'risk_level': self.risk_level,
            'poc_analytic': self.poc_analytic,
            'poc_ml': self.poc_ml,
            'model_agreement': self.model_agreement,
            'miss_distance': self.miss_distance,
            'relative_velocity': self.relative_velocity,
            'crossing_angle': self.crossing_angle,
            'satellite_altitude': self.satellite_altitude,
            'debris_size': self.debris_size,
            'maneuver_required': self.maneuver_required,
            'maneuver_executed': self.maneuver_executed,
            'status': self.status,
        }


class AnalyticsSummary(Base):
    """Daily analytics summary for quick trend analysis"""
    __tablename__ = "analytics_summary"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, nullable=False, unique=True, index=True)
    
    # Conjunction counts by risk
    total_conjunctions = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    
    # Statistical metrics
    avg_poc = Column(Float)
    max_poc = Column(Float)
    avg_miss_distance = Column(Float)
    min_miss_distance = Column(Float)
    
    # Maneuver stats
    maneuvers_required = Column(Integer, default=0)
    maneuvers_executed = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AnalyticsSummary({self.date}, Total:{self.total_conjunctions})>"
    
    def to_dict(self):
        return {
            'date': self.date.isoformat() if self.date else None,
            'total_conjunctions': self.total_conjunctions,
            'critical_count': self.critical_count,
            'high_count': self.high_count,
            'medium_count': self.medium_count,
            'low_count': self.low_count,
            'avg_poc': self.avg_poc,
            'max_poc': self.max_poc,
            'avg_miss_distance': self.avg_miss_distance,
            'min_miss_distance': self.min_miss_distance,
            'maneuvers_required': self.maneuvers_required,
            'maneuvers_executed': self.maneuvers_executed,
        }
