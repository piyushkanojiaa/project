"""
Foster PoC Method Selector
Automatically selects Foster-2D or Foster-3D based on encounter geometry
"""

import numpy as np
from typing import Tuple, Dict
from enum import Enum


class FosterMethod(Enum):
    """PoC calculation method"""
    FOSTER_2D = "Foster-2D"
    FOSTER_3D = "Foster-3D"
    MONTE_CARLO = "Monte Carlo"


class PoCMethodSelector:
    """
    Selects appropriate PoC calculation method based on encounter characteristics
    
    Selection Criteria:
    - Foster-2D: High relative velocity, planar encounters
    - Foster-3D: General 3D encounters, standard method
    - Monte Carlo: High-risk cases requiring verification
    """
    
    # Thresholds (tunable based on operational experience)
    VELOCITY_THRESHOLD_2D = 10.0  # km/s - use 2D for v_rel > this
    VELOCITY_THRESHOLD_3D = 2.0   # km/s - use 3D for v_rel < this
    POC_THRESHOLD_MC = 1e-4       # Use MC verification above this PoC
    
    @staticmethod
    def select_method(
        relative_velocity: float,
        miss_distance: float,
        encounter_angle: float = None
    ) -> Tuple[FosterMethod, str]:
        """
        Select appropriate PoC calculation method
        
        Args:
            relative_velocity: Magnitude of relative velocity (km/s)
            miss_distance: Miss distance at TCA (km)
            encounter_angle: Angle between velocity vectors (degrees, optional)
            
        Returns:
            Tuple of (recommended method, reasoning)
        """
        
        # Rule 1: Very high relative velocity → Foster-2D
        if relative_velocity > PoCMethodSelector.VELOCITY_THRESHOLD_2D:
            reason = (
                f"High relative velocity ({relative_velocity:.2f} km/s) indicates "
                f"a fast encounter where the 2D approximation is valid. "
                f"Foster-2D assumes instantaneous passage through the collision plane, "
                f"which is accurate when {relative_velocity:.2f} >> combined object radius."
            )
            return FosterMethod.FOSTER_2D, reason
        
        # Rule 2: Low relative velocity → Foster-3D
        if relative_velocity < PoCMethodSelector.VELOCITY_THRESHOLD_3D:
            reason = (
                f"Low relative velocity ({relative_velocity:.2f} km/s) requires "
                f"full 3D treatment. Foster-3D accounts for finite transit time "
                f"through the collision volume, which is critical for slow encounters."
            )
            return FosterMethod.FOSTER_3D, reason
        
        # Rule 3: Near-perpendicular encounters → Foster-2D preferred
        if encounter_angle is not None and 70 < encounter_angle < 110:
            reason = (
                f"Near-perpendicular encounter (angle: {encounter_angle:.1f}°) "
                f"favors Foster-2D. The 2D planar approximation is most accurate "
                f"when trajectories cross at high angles."
            )
            return FosterMethod.FOSTER_2D, reason
        
        # Rule 4: Default to Foster-3D (industry standard)
        reason = (
            f"Standard conjunction case (v_rel={relative_velocity:.2f} km/s, "
            f"miss={miss_distance:.2f} km). Using Foster-3D as the industry-standard "
            f"general-purpose method for 3D PoC calculation."
        )
        return FosterMethod.FOSTER_3D, reason
    
    @staticmethod
    def should_verify_with_mc(poc: float, method: FosterMethod) -> Tuple[bool, str]:
        """
        Determine if Monte Carlo verification is needed
        
        Args:
            poc: Calculated probability of collision
            method: Method used for initial calculation
            
        Returns:
            Tuple of (should_verify, reasoning)
        """
        if poc > PoCMethodSelector.POC_THRESHOLD_MC:
            reason = (
                f"High PoC value ({poc:.2e}) exceeds operational threshold "
                f"({PoCMethodSelector.POC_THRESHOLD_MC:.2e}). "
                f"Monte Carlo verification recommended for critical decisions. "
                f"Run 10,000+ samples to establish confidence interval."
            )
            return True, reason
        
        reason = (
            f"PoC value ({poc:.2e}) below verification threshold. "
            f"{method.value} result is sufficient for operational decisions."
        )
        return False, reason
    
    @staticmethod
    def get_method_info(method: FosterMethod) -> Dict[str, str]:
        """
        Get detailed information about a PoC method
        
        Returns:
            Dictionary with method characteristics
        """
        info = {
            FosterMethod.FOSTER_2D: {
                "name": "Foster 1992 (2D)",
                "assumptions": [
                    "Planar encounter (instantaneous passage)",
                    "High relative velocity",
                    "Gaussian uncertainty in encounter plane",
                    "Circular combined hard-body sphere"
                ],
                "use_cases": [
                    "v_rel > 10 km/s",
                    "Near-perpendicular crossings",
                    "Fast screening calculations"
                ],
                "accuracy": "Excellent for high-speed encounters",
                "computational_cost": "Very low (~1 ms)",
                "reference": "Foster, J. L. (1992). The Analytic Basis for Debris Avoidance"
            },
            FosterMethod.FOSTER_3D: {
                "name": "Foster 1992 (3D)",
                "assumptions": [
                    "Full 3D Gaussian uncertainty",
                    "Finite transit through collision volume",
                    "Ellipsoidal covariance",
                    "Combined hard-body sphere"
                ],
                "use_cases": [
                    "General conjunctions (industry standard)",
                    "Moderate relative velocities (2-10 km/s)",
                    "Operational decision-making"
                ],
                "accuracy": "Industry standard, widely validated",
                "computational_cost": "Low (~3-5 ms)",
                "reference": "Foster, J. L. (1992). The Analytic Basis for Debris Avoidance"
            },
            FosterMethod.MONTE_CARLO: {
                "name": "Monte Carlo Simulation",
                "assumptions": [
                    "Samples from full uncertainty distribution",
                    "No analytical approximations",
                    "Statistical convergence"
                ],
                "use_cases": [
                    "PoC > 1e-4 (verification)",
                    "Non-Gaussian uncertainties",
                    "High-stakes decisions"
                ],
                "accuracy": "Ground truth (with sufficient samples)",
                "computational_cost": "High (~100-500 ms for 10K samples)",
                "reference": "Alfriend et al. (2009). Probability of Collision Error Analysis"
            }
        }
        
        return info.get(method, {"name": "Unknown"})


# Example usage and validation
if __name__ == "__main__":
    selector = PoCMethodSelector()
    
    print("\n=== PoC Method Selection Examples ===\n")
    
    # Example 1: High-speed debris encounter
    print("Example 1: High-speed FENGYUN debris")
    method, reason = selector.select_method(
        relative_velocity=14.2,
        miss_distance=1.5,
        encounter_angle=85
    )
    print(f"Selected: {method.value}")
    print(f"Reasoning: {reason}\n")
    
    # Example 2: Slow GEO encounter
    print("Example 2: Slow GEO conjunction")
    method, reason = selector.select_method(
        relative_velocity=0.8,
        miss_distance=5.0
    )
    print(f"Selected: {method.value}")
    print(f"Reasoning: {reason}\n")
    
    # Example 3: Standard LEO encounter
    print("Example 3: Standard LEO case")
    method, reason = selector.select_method(
        relative_velocity=5.5,
        miss_distance=2.0
    )
    print(f"Selected: {method.value}")
    print(f"Reasoning: {reason}\n")
    
    # Example 4: MC verification decision
    print("Example 4: Should we verify with Monte Carlo?")
    should_verify, reason = selector.should_verify_with_mc(
        poc=2.5e-4,
        method=FosterMethod.FOSTER_3D
    )
    print(f"Verify with MC: {should_verify}")
    print(f"Reasoning: {reason}\n")
    
    # Show method details
    print("=== Method Information ===\n")
    for method in FosterMethod:
        info = selector.get_method_info(method)
        print(f"{info['name']}:")
        print(f"  Accuracy: {info['accuracy']}")
        print(f"  Cost: {info['computational_cost']}")
        print()
