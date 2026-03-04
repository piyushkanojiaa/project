"""
CRUD Operations for Database
Create, Read, Update, Delete operations for conjunction history
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from .models import ConjunctionHistory, AnalyticsSummary


class ConjunctionCRUD:
    """CRUD operations for conjunction history"""
    
    @staticmethod
    def create(db: Session, conjunction_data: Dict) -> ConjunctionHistory:
        """Create new conjunction record"""
        # Calculate model agreement
        if 'poc_analytic' in conjunction_data and 'poc_ml' in conjunction_data:
            poc_a = conjunction_data['poc_analytic']
            poc_m = conjunction_data['poc_ml']
            if poc_a > 0 and poc_m > 0:
                agreement = 100 * (1 - abs(poc_a - poc_m) / max(poc_a, poc_m))
                conjunction_data['model_agreement'] = agreement
        
        record = ConjunctionHistory(**conjunction_data)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    
    @staticmethod
    def get_by_id(db: Session, conjunction_id: str) -> Optional[ConjunctionHistory]:
        """Get conjunction by ID"""
        return db.query(ConjunctionHistory).filter(
            ConjunctionHistory.conjunction_id == conjunction_id
        ).first()
    
    @staticmethod
    def get_recent(db: Session, days: int = 7, limit: int = 100) -> List[ConjunctionHistory]:
        """Get recent conjunctions within N days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.query(ConjunctionHistory).filter(
            ConjunctionHistory.detected_at >= cutoff_date
        ).order_by(desc(ConjunctionHistory.detected_at)).limit(limit).all()
    
    @staticmethod
    def get_by_risk_level(db: Session, risk_level: str, days: int = 7) -> List[ConjunctionHistory]:
        """Get conjunctions by risk level"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.query(ConjunctionHistory).filter(
            and_(
                ConjunctionHistory.risk_level == risk_level,
                ConjunctionHistory.detected_at >= cutoff_date
            )
        ).order_by(desc(ConjunctionHistory.poc_ml)).all()
    
    @staticmethod
    def get_active(db: Session) -> List[ConjunctionHistory]:
        """Get all active (unresolved) conjunctions"""
        return db.query(ConjunctionHistory).filter(
            ConjunctionHistory.status == 'ACTIVE'
        ).order_by(desc(ConjunctionHistory.poc_ml)).all()
    
    @staticmethod
    def update_status(db: Session, conjunction_id: str, status: str, notes: str = None) -> Optional[ConjunctionHistory]:
        """Update conjunction status"""
        record = ConjunctionCRUD.get_by_id(db, conjunction_id)
        if record:
            record.status = status
            if status == 'RESOLVED':
                record.resolved_at = datetime.utcnow()
            if notes:
                record.notes = notes
            db.commit()
            db.refresh(record)
        return record
    
    @staticmethod
    def mark_maneuver_executed(db: Session, conjunction_id: str, details: str = None) -> Optional[ConjunctionHistory]:
        """Mark maneuver as executed"""
        record = ConjunctionCRUD.get_by_id(db, conjunction_id)
        if record:
            record.maneuver_executed = True
            if details:
                record.maneuver_details = details
            db.commit()
            db.refresh(record)
        return record
    
    @staticmethod
    def get_statistics(db: Session, days: int = 30) -> Dict:
        """Get aggregate statistics"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = db.query(ConjunctionHistory).filter(
            ConjunctionHistory.detected_at >= cutoff_date
        )
        
        total = query.count()
        critical = query.filter(ConjunctionHistory.risk_level == 'CRITICAL').count()
        high = query.filter(ConjunctionHistory.risk_level == 'HIGH').count()
        medium = query.filter(ConjunctionHistory.risk_level == 'MEDIUM').count()
        low = query.filter(ConjunctionHistory.risk_level == 'LOW').count()
        
        # Averages
        avg_poc = db.query(func.avg(ConjunctionHistory.poc_ml)).filter(
            ConjunctionHistory.detected_at >= cutoff_date
        ).scalar() or 0
        
        avg_miss = db.query(func.avg(ConjunctionHistory.miss_distance)).filter(
            ConjunctionHistory.detected_at >= cutoff_date
        ).scalar() or 0
        
        maneuvers_required = query.filter(ConjunctionHistory.maneuver_required == True).count()
        maneuvers_executed = query.filter(ConjunctionHistory.maneuver_executed == True).count()
        
        return {
            'total_conjunctions': total,
            'critical_count': critical,
            'high_count': high,
            'medium_count': medium,
            'low_count': low,
            'avg_poc': float(avg_poc),
            'avg_miss_distance': float(avg_miss),
            'maneuvers_required': maneuvers_required,
            'maneuvers_executed': maneuvers_executed,
            'days': days
        }


class AnalyticsCRUD:
    """CRUD operations for analytics summaries"""
    
    @staticmethod
    def create_daily_summary(db: Session, date: datetime) -> AnalyticsSummary:
        """Create or update daily summary"""
        # Check if already exists
        existing = db.query(AnalyticsSummary).filter(
            func.date(AnalyticsSummary.date) == date.date()
        ).first()
        
        if existing:
            # Update existing
            summary = existing
        else:
            # Create new
            summary = AnalyticsSummary(date=date)
            db.add(summary)
        
        # Calculate stats for this day
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        day_conjunctions = db.query(ConjunctionHistory).filter(
            and_(
                ConjunctionHistory.detected_at >= start_of_day,
                ConjunctionHistory.detected_at < end_of_day
            )
        )
        
        summary.total_conjunctions = day_conjunctions.count()
        summary.critical_count = day_conjunctions.filter(ConjunctionHistory.risk_level == 'CRITICAL').count()
        summary.high_count = day_conjunctions.filter(ConjunctionHistory.risk_level == 'HIGH').count()
        summary.medium_count = day_conjunctions.filter(ConjunctionHistory.risk_level == 'MEDIUM').count()
        summary.low_count = day_conjunctions.filter(ConjunctionHistory.risk_level == 'LOW').count()
        
        # Averages
        summary.avg_poc = db.query(func.avg(ConjunctionHistory.poc_ml)).filter(
            and_(
                ConjunctionHistory.detected_at >= start_of_day,
                ConjunctionHistory.detected_at < end_of_day
            )
        ).scalar() or 0
        
        summary.max_poc = db.query(func.max(ConjunctionHistory.poc_ml)).filter(
            and_(
                ConjunctionHistory.detected_at >= start_of_day,
                ConjunctionHistory.detected_at < end_of_day
            )
        ).scalar() or 0
        
        summary.avg_miss_distance = db.query(func.avg(ConjunctionHistory.miss_distance)).filter(
            and_(
                ConjunctionHistory.detected_at >= start_of_day,
                ConjunctionHistory.detected_at < end_of_day
            )
        ).scalar() or 0
        
        summary.min_miss_distance = db.query(func.min(ConjunctionHistory.miss_distance)).filter(
            and_(
                ConjunctionHistory.detected_at >= start_of_day,
                ConjunctionHistory.detected_at < end_of_day
            )
        ).scalar() or 0
        
        summary.maneuvers_required = day_conjunctions.filter(ConjunctionHistory.maneuver_required == True).count()
        summary.maneuvers_executed = day_conjunctions.filter(ConjunctionHistory.maneuver_executed == True).count()
        
        db.commit()
        db.refresh(summary)
        return summary
    
    @staticmethod
    def get_trend(db: Session, days: int = 30) -> List[AnalyticsSummary]:
        """Get daily summaries for trend analysis"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.query(AnalyticsSummary).filter(
            AnalyticsSummary.date >= cutoff_date
        ).order_by(AnalyticsSummary.date).all()
