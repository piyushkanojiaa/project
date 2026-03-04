"""
Maneuver Optimizer

Optimizes collision avoidance maneuvers considering fuel, safety, and mission constraints
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
from datetime import datetime
from pydantic import BaseModel

from maneuvers.fuel_calculator import FuelCalculator, SatelliteFuelModel
from maneuvers.budget_manager import FuelBudgetManager, FuelBudgetStrategy

# ============================================================
# Optimization Models
# ============================================================

class ManeuverObjective(BaseModel):
    """Multi-objective optimization weights"""
    safety_weight: float = 0.6      # Maximize safety margin
    fuel_weight: float = 0.3        # Minimize fuel usage
    orbit_weight: float = 0.1       # Minimize orbital change


class ManeuverSolution(BaseModel):
    """Optimized maneuver solution"""
    delta_v_vector: List[float]     # [Δvx, Δvy, Δvz] m/s
    delta_v_magnitude: float        # Total delta-v m/s
    fuel_required_kg: float
    fuel_feasible: bool
    safety_margin_km: float         # Additional separation achieved
    optimization_score: float       # Overall score (0-1)
    method: str                     # Optimization method used
    alternatives: List[Dict] = []   # Alternative solutions


# ============================================================
# Maneuver Optimizer
# ============================================================

class ManeuverOptimizer:
    """
    Optimize collision avoidance maneuvers
    
    Balances multiple objectives:
    - Maximize safety (miss distance)
    - Minimize fuel consumption
    - Minimize orbital perturbation
    """
    
    def __init__(
        self,
        budget_manager: Optional[FuelBudgetManager] = None
    ):
        """Initialize optimizer"""
        self.budget_manager = budget_manager or FuelBudgetManager()
        self.fuel_calculator = FuelCalculator()
    
    def optimize_conjunction_maneuver(
        self,
        conjunction_data: Dict,
        fuel_model: SatelliteFuelModel,
        objective: Optional[ManeuverObjective] = None,
        min_safe_distance_km: float = 5.0
    ) -> ManeuverSolution:
        """
        Find optimal maneuver for conjunction avoidance
        
        Args:
            conjunction_data: Conjunction event data
            fuel_model: Satellite fuel model
            objective: Optimization objectives
            min_safe_distance_km: Minimum safe miss distance
            
        Returns:
            Optimal maneuver solution
        """
        if objective is None:
            objective = ManeuverObjective()
        
        # Extract conjunction parameters
        miss_distance_km = conjunction_data.get("miss_distance_km", 0.5)
        relative_velocity_ms = conjunction_data.get("relative_velocity_ms", 7000)
        time_to_tca_hours = conjunction_data.get("time_to_tca_hours", 12)
        
        # Calculate required delta-v for various safety margins
        solutions = []
        
        # Try different safety margins
        safety_margins = [5, 10, 15, 20, 30]  # km
        
        for target_margin in safety_margins:
            # Calculate delta-v needed
            delta_v = self._calculate_delta_v_for_margin(
                miss_distance_km,
                target_margin,
                time_to_tca_hours
            )
            
            # Check fuel feasibility
            fuel_calc = self.fuel_calculator.calculate_fuel_for_delta_v(
                delta_v,
                fuel_model
            )
            
            # Check budget
            can_afford, reason = self.budget_manager.can_afford_maneuver(
                fuel_model.satellite_id,
                delta_v,
                fuel_model
            )
            
            if not can_afford:
                continue
            
            # Calculate optimization score
            score = self._calculate_optimization_score(
                safety_margin_km=target_margin - miss_distance_km,
                fuel_kg=fuel_calc["fuel_kg"],
                delta_v_ms=delta_v,
                fuel_model=fuel_model,
                objective=objective
            )
            
            # Create solution
            # Assume radial maneuver (simplification)
            delta_v_vector = [0, delta_v, 0]  # Radial boost
            
            solution = {
                "delta_v_vector": delta_v_vector,
                "delta_v_magnitude": delta_v,
                "fuel_required_kg": fuel_calc["fuel_kg"],
                "fuel_feasible": fuel_calc["feasible"] and can_afford,
                "safety_margin_km": target_margin,
                "optimization_score": score,
                "achieves_min_safe_distance": target_margin >= min_safe_distance_km
            }
            
            solutions.append(solution)
        
        # Sort by optimization score
        solutions.sort(key=lambda x: x["optimization_score"], reverse=True)
        
        if not solutions:
            # No feasible solution - return emergency maneuver
            return self._generate_emergency_solution(
                conjunction_data,
                fuel_model,
                min_safe_distance_km
            )
        
        # Best solution
        best = solutions[0]
        
        return ManeuverSolution(
            delta_v_vector=best["delta_v_vector"],
            delta_v_magnitude=best["delta_v_magnitude"],
            fuel_required_kg=best["fuel_required_kg"],
            fuel_feasible=best["fuel_feasible"],
            safety_margin_km=best["safety_margin_km"],
            optimization_score=best["optimization_score"],
            method="multi_objective",
            alternatives=solutions[1:5]  # Top 5 alternatives
        )
    
    def _calculate_delta_v_for_margin(
        self,
        current_miss_km: float,
        target_miss_km: float,
        time_to_tca_hours: float
    ) -> float:
        """
        Calculate delta-v needed to achieve target miss distance
        
        Simplified calculation assuming impulsive maneuver
        """
        # Required change in miss distance
        delta_miss = target_miss_km - current_miss_km
        
        # Time available (convert to seconds)
        time_available_s = time_to_tca_hours * 3600
        
        # Required velocity change (simplified)
        # Δv ≈ Δmiss / time_to_tca
        delta_v = (delta_miss * 1000) / time_available_s  # m/s
        
        # Minimum delta-v
        return max(abs(delta_v), 0.1)  # At least 0.1 m/s
    
    def _calculate_optimization_score(
        self,
        safety_margin_km: float,
        fuel_kg: float,
        delta_v_ms: float,
        fuel_model: SatelliteFuelModel,
        objective: ManeuverObjective
    ) -> float:
        """
        Calculate multi-objective optimization score
        
        Returns score from 0 to 1 (higher is better)
        """
        # Safety score (0-1)
        # Higher margin = higher score
        safety_score = min(1.0, safety_margin_km / 30.0)  # Normalize to 30km
        
        # Fuel efficiency score (0-1)
        # Less fuel = higher score
        max_fuel = fuel_model.remaining_fuel_kg * 0.1  # 10% of remaining
        fuel_score = 1.0 - min(1.0, fuel_kg / max_fuel)
        
        # Orbital stability score (0-1)
        # Smaller delta-v = higher score
        orbit_score = 1.0 - min(1.0, delta_v_ms / 10.0)  # Normalize to 10 m/s
        
        # Weighted combination
        total_score = (
            objective.safety_weight * safety_score +
            objective.fuel_weight * fuel_score +
            objective.orbit_weight * orbit_score
        )
        
        return total_score
    
    def _generate_emergency_solution(
        self,
        conjunction_data: Dict,
        fuel_model: SatelliteFuelModel,
        min_safe_distance_km: float
    ) -> ManeuverSolution:
        """Generate emergency maneuver when no optimal solution exists"""
        # Use all available fuel for safety
        max_delta_v_info = self.fuel_calculator.calculate_max_delta_v(fuel_model)
        
        delta_v = min(
            max_delta_v_info["max_delta_v_ms"],
            fuel_model.max_delta_v_ms
        )
        
        fuel_calc = self.fuel_calculator.calculate_fuel_for_delta_v(
            delta_v,
            fuel_model
        )
        
        return ManeuverSolution(
            delta_v_vector=[0, delta_v, 0],
            delta_v_magnitude=delta_v,
            fuel_required_kg=fuel_calc["fuel_kg"],
            fuel_feasible=True,
            safety_margin_km=min_safe_distance_km,
            optimization_score=0.5,
            method="emergency",
            alternatives=[]
        )
    
    def compare_strategies(
        self,
        conjunction_data: Dict,
        fuel_model: SatelliteFuelModel,
        strategies: List[str] = ["aggressive", "balanced", "conservative"]
    ) -> Dict:
        """
        Compare different fuel budget strategies
        
        Returns best strategy recommendation
        """
        results = []
        
        for strategy_name in strategies:
            strategy = FuelBudgetStrategy(strategy_name)
            
            # Calculate budget
            budget = self.budget_manager.calculate_budget(
                fuel_model,
                strategy
            )
            
            # Optimize maneuver
            solution = self.optimize_conjunction_maneuver(
                conjunction_data,
                fuel_model
            )
            
            results.append({
                "strategy": strategy_name,
                "fuel_available_kg": budget.available_for_maneuvers_kg,
                "fuel_required_kg": solution.fuel_required_kg,
                "feasible": solution.fuel_feasible,
                "safety_margin_km": solution.safety_margin_km,
                "optimization_score": solution.optimization_score
            })
        
        # Find best feasible strategy
        feasible = [r for r in results if r["feasible"]]
        
        if feasible:
            best = max(feasible, key=lambda x: x["optimization_score"])
        else:
            best = None
        
        return {
            "comparison": results,
            "recommended_strategy": best["strategy"] if best else "none",
            "all_feasible": len(feasible) == len(results)
        }
    
    def optimize_multi_debris(
        self,
        conjunctions: List[Dict],
        fuel_model: SatelliteFuelModel,
        planning_horizon_hours: float = 24
    ) -> Dict:
        """
        Optimize maneuvers for multiple debris threats
        
        Finds sequence of maneuvers that handles all threats
        with minimum total fuel
        """
        # Sort by time to TCA
        sorted_conjunctions = sorted(
            conjunctions,
            key=lambda x: x.get("time_to_tca_hours", 999)
        )
        
        total_fuel = 0
        maneuvers = []
        
        for conjunction in sorted_conjunctions:
            # Optimize individual maneuver
            solution = self.optimize_conjunction_maneuver(
                conjunction,
                fuel_model
            )
            
            if solution.fuel_feasible:
                maneuvers.append({
                    "conjunction_id": conjunction.get("id"),
                    "delta_v": solution.delta_v_magnitude,
                    "fuel_kg": solution.fuel_required_kg,
                    "time_to_tca_hours": conjunction.get("time_to_tca_hours")
                })
                
                total_fuel += solution.fuel_required_kg
                
                # Update remaining fuel
                fuel_model.remaining_fuel_kg -= solution.fuel_required_kg
        
        return {
            "total_conjunctions": len(conjunctions),
            "maneuvers_planned": len(maneuvers),
            "total_fuel_required_kg": total_fuel,
            "all_threats_handled": len(maneuvers) == len(conjunctions),
            "maneuver_sequence": maneuvers
        }


# ============================================================
# Global Optimizer
# ============================================================

global_maneuver_optimizer = ManeuverOptimizer()


# Export
__all__ = [
    'ManeuverOptimizer',
    'ManeuverObjective',
    'ManeuverSolution',
    'global_maneuver_optimizer'
]
