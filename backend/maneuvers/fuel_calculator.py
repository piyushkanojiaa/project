"""
Fuel Consumption Calculator

Calculates fuel consumption for satellite maneuvers using the Tsiolkovsky rocket equation
"""

from typing import Dict, Optional
from pydantic import BaseModel
from enum import Enum
import math

# ============================================================
# Satellite Fuel Models
# ============================================================

class ThrusterType(str, Enum):
    """Types of satellite propulsion systems"""
    CHEMICAL = "chemical"      # High thrust, moderate Isp
    ION = "ion"               # Low thrust, very high Isp
    COLD_GAS = "cold_gas"     # Very low Isp
    ELECTRIC = "electric"     # High Isp
    HYBRID = "hybrid"         # Combined systems


class SatelliteFuelModel(BaseModel):
    """Fuel model for a satellite"""
    satellite_id: str
    satellite_name: str
    
    # Mass properties
    total_fuel_kg: float           # Total fuel capacity
    remaining_fuel_kg: float       # Current fuel remaining
    dry_mass_kg: float             # Mass without fuel
    
    # Propulsion system
    thruster_type: ThrusterType
    isp_seconds: float             # Specific impulse
    max_delta_v_ms: float          # Max single maneuver delta-v (m/s)
    min_delta_v_ms: float          # Min controllable delta-v (m/s)
    
    # Constraints
    max_thrust_newtons: Optional[float] = None
    min_burn_duration_s: Optional[float] = None


# ============================================================
# Predefined Satellite Models
# ============================================================

# International Space Station
ISS_FUEL_MODEL = SatelliteFuelModel(
    satellite_id="iss_001",
    satellite_name="ISS (ZARYA)",
    total_fuel_kg=860,
    remaining_fuel_kg=650,
    dry_mass_kg=419725,
    thruster_type=ThrusterType.CHEMICAL,
    isp_seconds=290,
    max_delta_v_ms=50.0,
    min_delta_v_ms=0.1
)

# Hubble Space Telescope
HUBBLE_FUEL_MODEL = SatelliteFuelModel(
    satellite_id="hubble_001",
    satellite_name="Hubble Space Telescope",
    total_fuel_kg=360,
    remaining_fuel_kg=120,
    dry_mass_kg=11110,
    thruster_type=ThrusterType.CHEMICAL,
    isp_seconds=225,
    max_delta_v_ms=30.0,
    min_delta_v_ms=0.05
)

# CubeSat (3U)
CUBESAT_FUEL_MODEL = SatelliteFuelModel(
    satellite_id="cubesat_001",
    satellite_name="CubeSat 3U",
    total_fuel_kg=0.5,
    remaining_fuel_kg=0.4,
    dry_mass_kg=3.5,
    thruster_type=ThrusterType.COLD_GAS,
    isp_seconds=65,
    max_delta_v_ms=10.0,
    min_delta_v_ms=0.01
)

# Geostationary Communications Satellite
GEO_SAT_FUEL_MODEL = SatelliteFuelModel(
    satellite_id="geo_001",
    satellite_name="GEO ComSat",
    total_fuel_kg=2500,
    remaining_fuel_kg=1800,
    dry_mass_kg=4500,
    thruster_type=ThrusterType.ELECTRIC,
    isp_seconds=3200,
    max_delta_v_ms=100.0,
    min_delta_v_ms=0.1
)


# ============================================================
# Fuel Calculator
# ============================================================

# Standard gravity (m/s²)
G0 = 9.80665


class FuelCalculator:
    """
    Calculate fuel consumption using Tsiolkovsky rocket equation
    
    Δv = Isp × g₀ × ln(m_initial / m_final)
    
    Where:
    - Δv = change in velocity (m/s)
    - Isp = specific impulse (seconds)
    - g₀ = standard gravity (9.80665 m/s²)
    - m_initial = initial mass including fuel (kg)
    - m_final = final mass after burn (kg)
    """
    
    @staticmethod
    def calculate_fuel_for_delta_v(
        delta_v_ms: float,
        fuel_model: SatelliteFuelModel
    ) -> Dict:
        """
        Calculate fuel required for a given delta-v
        
        Args:
            delta_v_ms: Desired delta-v in m/s
            fuel_model: Satellite fuel model
            
        Returns:
            {
                "fuel_kg": float,
                "feasible": bool,
                "remaining_after": float,
                "mass_ratio": float
            }
        """
        # Current total mass
        m_initial = fuel_model.dry_mass_kg + fuel_model.remaining_fuel_kg
        
        # Calculate mass ratio
        # Δv = Isp × g₀ × ln(m_initial / m_final)
        # m_final = m_initial / e^(Δv / (Isp × g₀))
        
        ve = fuel_model.isp_seconds * G0  # Effective exhaust velocity
        mass_ratio = math.exp(delta_v_ms / ve)
        
        m_final = m_initial / mass_ratio
        
        # Fuel consumed
        fuel_consumed = m_initial - m_final
        
        # Check feasibility
        feasible = (
            fuel_consumed <= fuel_model.remaining_fuel_kg and
            delta_v_ms <= fuel_model.max_delta_v_ms and
            delta_v_ms >= fuel_model.min_delta_v_ms
        )
        
        remaining_after = fuel_model.remaining_fuel_kg - fuel_consumed
        
        return {
            "fuel_kg": fuel_consumed,
            "feasible": feasible,
            "remaining_after": max(0, remaining_after),
            "mass_ratio": mass_ratio,
            "delta_v_actual": delta_v_ms,
            "efficiency": FuelCalculator._calculate_efficiency(
                fuel_consumed,
                delta_v_ms,
                fuel_model.thruster_type
            )
        }
    
    @staticmethod
    def calculate_max_delta_v(fuel_model: SatelliteFuelModel) -> Dict:
        """
        Calculate maximum possible delta-v with remaining fuel
        
        Returns:
            {
                "max_delta_v_ms": float,
                "uses_all_fuel": bool,
                "theoretical_max": float
            }
        """
        # Current total mass
        m_initial = fuel_model.dry_mass_kg + fuel_model.remaining_fuel_kg
        
        # Final mass (just dry mass)
        m_final = fuel_model.dry_mass_kg
        
        # Calculate theoretical max delta-v
        ve = fuel_model.isp_seconds * G0
        max_delta_v = ve * math.log(m_initial / m_final)
        
        # Practical max (limited by thruster)
        practical_max = min(max_delta_v, fuel_model.max_delta_v_ms)
        
        return {
            "max_delta_v_ms": practical_max,
            "theoretical_max_ms": max_delta_v,
            "uses_all_fuel": practical_max >= max_delta_v,
            "thruster_limited": practical_max < max_delta_v
        }
    
    @staticmethod
    def calculate_fuel_for_maneuver_vector(
        delta_v_vector: list,
        fuel_model: SatelliteFuelModel
    ) -> Dict:
        """
        Calculate fuel for a 3D maneuver vector
        
        Args:
            delta_v_vector: [Δvx, Δvy, Δvz] in m/s
            fuel_model: Satellite fuel model
            
        Returns:
            Fuel calculation results
        """
        # Calculate magnitude
        import numpy as np
        delta_v_magnitude = np.linalg.norm(delta_v_vector)
        
        return FuelCalculator.calculate_fuel_for_delta_v(
            delta_v_magnitude,
            fuel_model
        )
    
    @staticmethod
    def _calculate_efficiency(
        fuel_kg: float,
        delta_v: float,
        thruster_type: ThrusterType
    ) -> float:
        """
        Calculate maneuver efficiency (0-1)
        
        Higher efficiency = better fuel usage for delta-v achieved
        """
        if fuel_kg == 0:
            return 1.0
        
        # Efficiency metric: delta-v per kg of fuel
        efficiency = delta_v / fuel_kg
        
        # Normalize by thruster type
        max_efficiency = {
            ThrusterType.CHEMICAL: 50,
            ThrusterType.ION: 5000,
            ThrusterType.COLD_GAS: 20,
            ThrusterType.ELECTRIC: 3000,
            ThrusterType.HYBRID: 1000
        }.get(thruster_type, 100)
        
        return min(1.0, efficiency / max_efficiency)
    
    @staticmethod
    def estimate_burn_duration(
        delta_v_ms: float,
        fuel_model: SatelliteFuelModel,
        thrust_newtons: Optional[float] = None
    ) -> Dict:
        """
        Estimate burn duration for maneuver
        
        Args:
            delta_v_ms: Delta-v magnitude
            fuel_model: Satellite fuel model
            thrust_newtons: Thrust level (optional)
            
        Returns:
            {
                "burn_duration_s": float,
                "fuel_flow_rate_kg_s": float
            }
        """
        # Calculate fuel needed
        fuel_calc = FuelCalculator.calculate_fuel_for_delta_v(
            delta_v_ms,
            fuel_model
        )
        
        fuel_kg = fuel_calc["fuel_kg"]
        
        # Use thrust if provided, otherwise estimate
        if thrust_newtons is None:
            # Estimate based on typical values
            thrust_estimates = {
                ThrusterType.CHEMICAL: 400,   # N
                ThrusterType.ION: 0.09,       # N
                ThrusterType.COLD_GAS: 1,     # N
                ThrusterType.ELECTRIC: 0.5,   # N
                ThrusterType.HYBRID: 50       # N
            }
            thrust_newtons = thrust_estimates.get(
                fuel_model.thruster_type,
                10
            )
        
        # Calculate mass flow rate
        # F = ṁ × ve
        # ṁ = F / ve
        ve = fuel_model.isp_seconds * G0
        fuel_flow_rate = thrust_newtons / ve  # kg/s
        
        # Burn duration
        if fuel_flow_rate > 0:
            burn_duration = fuel_kg / fuel_flow_rate
        else:
            burn_duration = 0
        
        return {
            "burn_duration_s": burn_duration,
            "burn_duration_minutes": burn_duration / 60,
            "fuel_flow_rate_kg_s": fuel_flow_rate,
            "thrust_newtons": thrust_newtons
        }
    
    @staticmethod
    def compare_maneuver_options(
        options: list,
        fuel_model: SatelliteFuelModel
    ) -> Dict:
        """
        Compare multiple maneuver options
        
        Args:
            options: List of delta-v values or vectors
            fuel_model: Satellite fuel model
            
        Returns:
            Comparison of fuel costs
        """
        comparisons = []
        
        for i, option in enumerate(options):
            if isinstance(option, list):
                calc = FuelCalculator.calculate_fuel_for_maneuver_vector(
                    option,
                    fuel_model
                )
                delta_v = sum(x**2 for x in option) ** 0.5
            else:
                calc = FuelCalculator.calculate_fuel_for_delta_v(
                    option,
                    fuel_model
                )
                delta_v = option
            
            comparisons.append({
                "option_id": i,
                "delta_v_ms": delta_v,
                "fuel_kg": calc["fuel_kg"],
                "efficiency": calc["efficiency"],
                "feasible": calc["feasible"],
                "remaining_fuel_kg": calc["remaining_after"]
            })
        
        # Sort by fuel efficiency
        comparisons.sort(key=lambda x: x["efficiency"], reverse=True)
        
        return {
            "options": comparisons,
            "most_efficient": comparisons[0] if comparisons else None,
            "least_fuel": min(comparisons, key=lambda x: x["fuel_kg"]) if comparisons else None
        }


# ============================================================
# Utility Functions
# ============================================================

def get_fuel_model(satellite_id: str) -> Optional[SatelliteFuelModel]:
    """Get predefined fuel model by satellite ID"""
    models = {
        "iss_001": ISS_FUEL_MODEL,
        "hubble_001": HUBBLE_FUEL_MODEL,
        "cubesat_001": CUBESAT_FUEL_MODEL,
        "geo_001": GEO_SAT_FUEL_MODEL
    }
    
    return models.get(satellite_id)


def create_custom_fuel_model(
    satellite_id: str,
    satellite_name: str,
    **kwargs
) -> SatelliteFuelModel:
    """Create custom fuel model"""
    return SatelliteFuelModel(
        satellite_id=satellite_id,
        satellite_name=satellite_name,
        **kwargs
    )


# Export
__all__ = [
    'FuelCalculator',
    'SatelliteFuelModel',
    'ThrusterType',
    'ISS_FUEL_MODEL',
    'HUBBLE_FUEL_MODEL',
    'CUBESAT_FUEL_MODEL',
    'GEO_SAT_FUEL_MODEL',
    'get_fuel_model',
    'create_custom_fuel_model'
]
