"""
GraphQL Subscriptions for Orbital Guard AI

Provides real-time updates via WebSocket for:
- New conjunction events
- Conjunction risk updates
- Satellite position changes
- System statistics
"""

import strawberry
import asyncio
from typing import AsyncGenerator, Optional
from datetime import datetime, timedelta
from graphql_schema import (
    Conjunction, Satellite, ConjunctionStatistics, 
    RiskLevel, ConjunctionFilter
)

# In-memory storage for tracking last update times
_last_conjunction_check = datetime.utcnow()
_last_stats_update = datetime.utcnow()
_satellite_positions = {}


@strawberry.type
class Subscription:
    """GraphQL Subscriptions for real-time updates"""
    
    @strawberry.subscription
    async def conjunction_created(
        self,
        min_risk_level: Optional[RiskLevel] = None
    ) -> AsyncGenerator[Conjunction, None]:
        """
        Subscribe to newly created conjunctions
        
        Args:
            min_risk_level: Only get conjunctions at or above this risk level
        
        Yields:
            New Conjunction objects as they are detected
        """
        global _last_conjunction_check
        
        while True:
            await asyncio.sleep(10)  # Check every 10 seconds
            
            try:
                # Fetch conjunctions created since last check
                from graphql_resolvers import get_conjunctions
                
                filter_obj = ConjunctionFilter(
                    start_date=_last_conjunction_check,
                    risk_level=min_risk_level
                )
                
                new_conjunctions = await get_conjunctions(
                    filter=filter_obj,
                    limit=100
                )
                
                _last_conjunction_check = datetime.utcnow()
                
                # Yield each new conjunction
                for conjunction in new_conjunctions:
                    if conjunction.created_at > _last_conjunction_check - timedelta(seconds=15):
                        yield conjunction
                        
            except Exception as e:
                print(f"[Subscription] Error in conjunction_created: {e}")
                await asyncio.sleep(5)
    
    
    @strawberry.subscription
    async def conjunction_updated(
        self,
        conjunction_id: Optional[str] = None,
        min_risk_level: Optional[RiskLevel] = None
    ) -> AsyncGenerator[Conjunction, None]:
        """
        Subscribe to conjunction updates (risk level changes, status changes)
        
        Args:
            conjunction_id: Specific conjunction to monitor (optional)
            min_risk_level: Only get updates for conjunctions at or above this level
        
        Yields:
            Updated Conjunction objects
        """
        tracked_conjunctions = {}  # conjunction_id -> last known state
        
        while True:
            await asyncio.sleep(15)  # Check every 15 seconds
            
            try:
                from graphql_resolvers import get_conjunctions, get_conjunction_by_id
                
                if conjunction_id:
                    # Monitor specific conjunction
                    conjunction = await get_conjunction_by_id(conjunction_id)
                    
                    if conjunction:
                        last_state = tracked_conjunctions.get(conjunction_id)
                        
                        # Check if risk level or status changed
                        if (last_state is None or 
                            last_state.risk_level != conjunction.risk_level or
                            last_state.status != conjunction.status or
                            last_state.probability != conjunction.probability):
                            
                            tracked_conjunctions[conjunction_id] = conjunction
                            yield conjunction
                else:
                    # Monitor all conjunctions
                    filter_obj = ConjunctionFilter(risk_level=min_risk_level)
                    conjunctions = await get_conjunctions(filter=filter_obj, limit=200)
                    
                    for conj in conjunctions:
                        last_state = tracked_conjunctions.get(conj.id)
                        
                        if (last_state is None or
                            last_state.risk_level != conj.risk_level or
                            last_state.status != conj.status):
                            
                            tracked_conjunctions[conj.id] = conj
                            yield conj
                            
            except Exception as e:
                print(f"[Subscription] Error in conjunction_updated: {e}")
                await asyncio.sleep(5)
    
    
    @strawberry.subscription
    async def satellite_position_updated(
        self,
        norad_id: Optional[str] = None,
        update_interval: int = 30
    ) -> AsyncGenerator[Satellite, None]:
        """
        Subscribe to satellite position updates
        
        Args:
            norad_id: Specific satellite to track (optional, tracks all if not provided)
            update_interval: Update frequency in seconds (default: 30)
        
        Yields:
            Satellite objects with updated positions
        """
        while True:
            await asyncio.sleep(update_interval)
            
            try:
                from graphql_resolvers import get_satellites, get_satellite_by_norad_id
                
                if norad_id:
                    # Track specific satellite
                    satellite = await get_satellite_by_norad_id(norad_id)
                    if satellite:
                        yield satellite
                else:
                    # Track all satellites (limit to avoid performance issues)
                    satellites = await get_satellites(limit=50)
                    for sat in satellites:
                        yield sat
                        await asyncio.sleep(0.1)  # Small delay between yields
                        
            except Exception as e:
                print(f"[Subscription] Error in satellite_position_updated: {e}")
                await asyncio.sleep(5)
    
    
    @strawberry.subscription
    async def stats_updated(
        self,
        update_interval: int = 60
    ) -> AsyncGenerator[ConjunctionStatistics, None]:
        """
        Subscribe to system statistics updates
        
        Args:
            update_interval: Update frequency in seconds (default: 60)
        
        Yields:
            Updated ConjunctionStatistics objects
        """
        while True:
            await asyncio.sleep(update_interval)
            
            try:
                from graphql_resolvers import get_conjunction_statistics
                
                stats = await get_conjunction_statistics()
                yield stats
                
            except Exception as e:
                print(f"[Subscription] Error in stats_updated: {e}")
                await asyncio.sleep(10)
    
    
    @strawberry.subscription
    async def critical_alert(self) -> AsyncGenerator[Conjunction, None]:
        """
        Subscribe to critical risk conjunctions only (HIGH and CRITICAL)
        
        This is a convenience subscription for monitoring only the most dangerous events
        
        Yields:
            Critical/High risk Conjunction objects
        """
        while True:
            await asyncio.sleep(30)  # Check every 30 seconds
            
            try:
                from graphql_resolvers import get_conjunctions
                
                # Get only critical and high risk
                critical_filter = ConjunctionFilter(
                    risk_level=RiskLevel.CRITICAL
                )
                high_filter = ConjunctionFilter(
                    risk_level=RiskLevel.HIGH
                )
                
                critical_conjunctions = await get_conjunctions(filter=critical_filter, limit=50)
                high_conjunctions = await get_conjunctions(filter=high_filter, limit=50)
                
                # Yield critical first
                for conj in critical_conjunctions:
                    # Only yield if created/updated recently (last 60 seconds)
                    if (datetime.utcnow() - conj.updated_at).total_seconds() < 60:
                        yield conj
                
                # Then high risk
                for conj in high_conjunctions:
                    if (datetime.utcnow() - conj.updated_at).total_seconds() < 60:
                        yield conj
                        
            except Exception as e:
                print(f"[Subscription] Error in critical_alert: {e}")
                await asyncio.sleep(10)


# Export for use in main GraphQL schema
__all__ = ['Subscription']
