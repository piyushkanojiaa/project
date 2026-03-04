"""
Fuel Budget Manager

Manages fuel budgets and allocation strategies for collision avoidance
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel

from maneuvers.fuel_calculator import SatelliteFuelModel, FuelCalculator

# ============================================================
# Budget Strategy
# ============================================================

class FuelBudgetStrategy(str, Enum):
    """Fuel allocation strategies"""
    AGGRESSIVE = "aggressive"         # Use 80% for safety
    BALANCED = "balanced"             # Use 50% for safety
    CONSERVATIVE = "conservative"     # Use 20% for safety
    EMERGENCY = "emergency"           # Use all available
    MISSION_FIRST = "mission_first"   # Prioritize mission over safety


class BudgetAllocation(BaseModel):
    """Fuel budget allocation"""
    total_fuel_kg: float
    available_for_maneuvers_kg: float
    reserved_station_keeping_kg: float
    emergency_reserve_kg: float
    max_maneuvers_possible: int
    strategy: FuelBudgetStrategy


# ============================================================
# Fuel Budget Manager
# ============================================================

class FuelBudgetManager:
    """
    Manages fuel budgets for satellites
    Prevents fuel starvation while maximizing safety
    """
    
    def __init__(self):
        """Initialize budget manager"""
        self.satellite_budgets: Dict[str, BudgetAllocation] = {}
        self.fuel_usage_history: Dict[str, List[Dict]] = {}
    
    def calculate_budget(
        self,
        fuel_model: SatelliteFuelModel,
        strategy: FuelBudgetStrategy = FuelBudgetStrategy.BALANCED,
        mission_years_remaining: float = 5.0
    ) -> BudgetAllocation:
        """
        Calculate fuel budget allocation
        
        Args:
            fuel_model: Satellite fuel model
            strategy: Budget strategy
            mission_years_remaining: Years left in mission
            
        Returns:
            Budget allocation
        """
        remaining = fuel_model.remaining_fuel_kg
        
        # Strategy-based allocation percentages
        allocations = {
            FuelBudgetStrategy.AGGRESSIVE: {
                "maneuvers": 0.80,
                "station_keeping": 0.15,
                "emergency": 0.05
            },
            FuelBudgetStrategy.BALANCED: {
                "maneuvers": 0.50,
                "station_keeping": 0.35,
                "emergency": 0.15
            },
            FuelBudgetStrategy.CONSERVATIVE: {
                "maneuvers": 0.20,
                "station_keeping": 0.60,
                "emergency": 0.20
            },
            FuelBudgetStrategy.EMERGENCY: {
                "maneuvers": 0.95,
                "station_keeping": 0.03,
                "emergency": 0.02
            },
            FuelBudgetStrategy.MISSION_FIRST: {
                "maneuvers": 0.10,
                "station_keeping": 0.80,
                "emergency": 0.10
            }
        }
        
        alloc = allocations[strategy]
        
        # Calculate allocations
        maneuver_fuel = remaining * alloc["maneuvers"]
        station_keeping = remaining * alloc["station_keeping"]
        emergency = remaining * alloc["emergency"]
        
        # Estimate max maneuvers possible
        # Assume average maneuver uses 0.5 m/s delta-v
        avg_delta_v = 0.5  # m/s
        avg_fuel_calc = FuelCalculator.calculate_fuel_for_delta_v(
            avg_delta_v,
            fuel_model
        )
        
        if avg_fuel_calc["fuel_kg"] > 0:
            max_maneuvers = int(maneuver_fuel / avg_fuel_calc["fuel_kg"])
        else:
            max_maneuvers = 0
        
        budget = BudgetAllocation(
            total_fuel_kg=remaining,
            available_for_maneuvers_kg=maneuver_fuel,
            reserved_station_keeping_kg=station_keeping,
            emergency_reserve_kg=emergency,
            max_maneuvers_possible=max_maneuvers,
            strategy=strategy
        )
        
        # Store budget
        self.satellite_budgets[fuel_model.satellite_id] = budget
        
        return budget
    
    def can_afford_maneuver(
        self,
        satellite_id: str,
        delta_v_ms: float,
        fuel_model: SatelliteFuelModel
    ) -> tuple[bool, Optional[str]]:
        """
        Check if satellite can afford maneuver
        
        Args:
            satellite_id: Satellite ID
            delta_v_ms: Required delta-v
            fuel_model: Fuel model
            
        Returns:
            (can_afford, reason_if_not)
        """
        # Get budget
        if satellite_id not in self.satellite_budgets:
            # Calculate default balanced budget
            self.calculate_budget(fuel_model, FuelBudgetStrategy.BALANCED)
        
        budget = self.satellite_budgets[satellite_id]
        
        # Calculate fuel needed
        fuel_calc = FuelCalculator.calculate_fuel_for_delta_v(
            delta_v_ms,
            fuel_model
        )
        
        fuel_needed = fuel_calc["fuel_kg"]
        
        # Check if affordable
        if fuel_needed > budget.available_for_maneuvers_kg:
            return False, f"Exceeds maneuver budget ({fuel_needed:.2f} kg > {budget.available_for_maneuvers_kg:.2f} kg available)"
        
        if fuel_needed > fuel_model.remaining_fuel_kg:
            return False, f"Insufficient total fuel ({fuel_needed:.2f} kg > {fuel_model.remaining_fuel_kg:.2f} kg remaining)"
        
        if not fuel_calc["feasible"]:
            return False, "Maneuver not feasible (exceeds thruster limits)"
        
        return True, None
    
    def record_fuel_usage(
        self,
        satellite_id: str,
        maneuver_type: str,
        fuel_used_kg: float,
        delta_v_ms: float
    ):
        """Record fuel usage for tracking"""
        if satellite_id not in self.fuel_usage_history:
            self.fuel_usage_history[satellite_id] = []
        
        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "maneuver_type": maneuver_type,
            "fuel_used_kg": fuel_used_kg,
            "delta_v_ms": delta_v_ms,
            "efficiency": delta_v_ms / fuel_used_kg if fuel_used_kg > 0 else 0
        }
        
        self.fuel_usage_history[satellite_id].append(record)
        
        # Update budget
        if satellite_id in self.satellite_budgets:
            budget = self.satellite_budgets[satellite_id]
            budget.available_for_maneuvers_kg -= fuel_used_kg
            budget.total_fuel_kg -= fuel_used_kg
    
    def get_fuel_projections(
        self,
        satellite_id: str,
        maneuvers_per_year: int = 10
    ) -> Dict:
        """
        Project fuel usage over time
        
        Args:
            satellite_id: Satellite ID
            maneuvers_per_year: Expected maneuvers per year
            
        Returns:
            Fuel projections
        """
        if satellite_id not in self.satellite_budgets:
            return {"error": "No budget calculated"}
        
        budget = self.satellite_budgets[satellite_id]
        
        # Get usage history
        history = self.fuel_usage_history.get(satellite_id, [])
        
        # Calculate average fuel per maneuver
        if history:
            avg_fuel_per_maneuver = sum(
                h["fuel_used_kg"] for h in history
            ) / len(history)
        else:
            avg_fuel_per_maneuver = 0.5  # Default estimate
        
        # Project years remaining
        annual_fuel_usage = avg_fuel_per_maneuver * maneuvers_per_year
        
        if annual_fuel_usage > 0:
            years_remaining = budget.available_for_maneuvers_kg / annual_fuel_usage
        else:
            years_remaining = float('inf')
        
        return {
            "satellite_id": satellite_id,
            "current_fuel_kg": budget.total_fuel_kg,
            "avg_fuel_per_maneuver_kg": avg_fuel_per_maneuver,
            "annual_fuel_usage_kg": annual_fuel_usage,
            "years_remaining": min(years_remaining, 50),  # Cap at 50 years
            "maneuvers_remaining": int(budget.available_for_maneuvers_kg / avg_fuel_per_maneuver) if avg_fuel_per_maneuver > 0 else 0,
            "total_maneuvers_recorded": len(history)
        }
    
    def get_budget_status(self, satellite_id: str) -> Optional[Dict]:
        """Get current budget status"""
        if satellite_id not in self.satellite_budgets:
            return None
        
        budget = self.satellite_budgets[satellite_id]
        
        # Calculate usage percentage
        maneuver_usage = (
            (budget.available_for_maneuvers_kg / budget.total_fuel_kg) * 100
            if budget.total_fuel_kg > 0 else 0
        )
        
        return {
            "satellite_id": satellite_id,
            "strategy": budget.strategy.value,
            "total_fuel_kg": budget.total_fuel_kg,
            "available_for_maneuvers_kg": budget.available_for_maneuvers_kg,
            "maneuver_budget_percent": maneuver_usage,
            "max_maneuvers_possible": budget.max_maneuvers_possible,
            "emergency_reserve_kg": budget.emergency_reserve_kg
        }
    
    def update_strategy(
        self,
        satellite_id: str,
        new_strategy: FuelBudgetStrategy,
        fuel_model: SatelliteFuelModel
    ):
        """Update budget strategy"""
        self.calculate_budget(fuel_model, new_strategy)
        
        print(f"✓ Updated {satellite_id} to {new_strategy.value} strategy")
    
    def get_usage_summary(self, satellite_id: str) -> Dict:
        """Get fuel usage summary"""
        history = self.fuel_usage_history.get(satellite_id, [])
        
        if not history:
            return {
                "total_maneuvers": 0,
                "total_fuel_used_kg": 0,
                "average_delta_v_ms": 0,
                "average_fuel_kg": 0
            }
        
        total_fuel = sum(h["fuel_used_kg"] for h in history)
        total_delta_v = sum(h["delta_v_ms"] for h in history)
        
        return {
            "satellite_id": satellite_id,
            "total_maneuvers": len(history),
            "total_fuel_used_kg": total_fuel,
            "total_delta_v_ms": total_delta_v,
            "average_fuel_kg": total_fuel / len(history),
            "average_delta_v_ms": total_delta_v / len(history),
            "most_recent": history[-1] if history else None
        }


# ============================================================
# Global Budget Manager
# ============================================================

global_budget_manager = FuelBudgetManager()


# Export
__all__ = [
    'FuelBudgetManager',
    'FuelBudgetStrategy',
    'BudgetAllocation',
    'global_budget_manager'
]
