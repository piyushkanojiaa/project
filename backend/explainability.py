"""
Explainability Module for Orbital Guard AI
Provides natural language explanations for collision risk assessments
"""

from typing import Dict, List, Tuple
import numpy as np


class RiskExplainer:
    """
    Generates human-readable explanations for collision risk assessments
    """
    
    @staticmethod
    def explain_poc(poc: float, method: str = "Foster 3D") -> Dict[str, str]:
        """
        Explain probability of collision in natural language
        
        Args:
            poc: Probability of collision (0.0 to 1.0)
            method: Calculation method used
            
        Returns:
            Dictionary with explanation components
        """
        # Risk level classification
        if poc > 1e-3:
            risk_level = "CRITICAL"
            severity = "immediate threat"
            action = "Execute evasive maneuver immediately"
        elif poc > 1e-4:
            risk_level = "HIGH"
            severity = "elevated collision probability"
            action = "Plan collision avoidance maneuver"
        elif poc > 1e-5:
            risk_level = "MEDIUM"
            severity = "moderate risk"
            action = "Continue monitoring, prepare contingency"
        elif poc > 1e-6:
            risk_level = "LOW"
            severity = "minimal but non-negligible risk"
            action = "Monitor situation, no immediate action needed"
        else:
            risk_level = "NEGLIGIBLE"
            severity = "very low risk"
            action = "Continue routine monitoring"
        
        # Human-readable probability
        if poc > 1e-2:
            poc_readable = f"1 in {int(1/poc)}"
        elif poc > 0:
            poc_readable = f"1 in {int(1/poc):,}"
        else:
            poc_readable = "less than 1 in 1 billion"
        
        # Explanation text
        explanation = (
            f"The collision probability of {poc:.2e} ({poc_readable}) indicates "
            f"{severity}. This assessment was calculated using the {method} method, "
            f"which is the industry-standard analytical approach for conjunction analysis. "
            f"Recommended action: {action}."
        )
        
        return {
            "risk_level": risk_level,
            "poc_value": poc,
            "poc_readable": poc_readable,
            "severity": severity,
            "action": action,
            "explanation": explanation,
            "method": method,
            "confidence": "HIGH" if method.startswith("Foster") else "ADVISORY"
        }
    
    @staticmethod
    def explain_ml_prediction(
        ml_poc: float,
        physics_poc: float,
        ml_confidence: float
    ) -> Dict[str, str]:
        """
        Explain ML prediction and its relationship to physics-based calculation
        
        Args:
            ml_poc: ML model prediction
            physics_poc: Physics-based (Foster) calculation
            ml_confidence: ML model confidence score
            
        Returns:
            Dictionary with ML explanation
        """
        # Agreement level
        relative_diff = abs(ml_poc - physics_poc) / physics_poc if physics_poc > 0 else 0
        
        if relative_diff < 0.1:
            agreement = "excellent agreement"
            reliability = "highly reliable"
        elif relative_diff < 0.3:
            agreement = "good agreement"
            reliability = "reliable"
        elif relative_diff < 0.5:
            agreement = "moderate agreement"
            reliability = "reasonably reliable"
        else:
            agreement = "divergent prediction"
            reliability = "requires physics validation"
        
        explanation = (
            f"The ML Risk Prioritization Engine predicts a PoC of {ml_poc:.2e} "
            f"with {ml_confidence*100:.0f}% confidence, showing {agreement} with the "
            f"authoritative physics-based calculation of {physics_poc:.2e}. "
            f"The ML model serves as a fast screening tool for risk ranking, "
            f"while the Foster 3D method provides the ground truth for operational decisions. "
            f"This prediction is {reliability}."
        )
        
        return {
            "ml_poc": ml_poc,
            "physics_poc": physics_poc,
            "agreement": agreement,
            "reliability": reliability,
            "explanation": explanation,
            "note": "ML prediction is ADVISORY. Physics-based calculation is AUTHORITATIVE."
        }
    
    @staticmethod
    def explain_miss_distance(
        miss_distance: float,
        relative_velocity: float,
        time_to_tca: float
    ) -> Dict[str, str]:
        """
        Explain geometric miss distance context
        
        Args:
            miss_distance: Minimum distance in km
            relative_velocity: Relative velocity in km/s
            time_to_tca: Time to closest approach in seconds
            
        Returns:
            Dictionary with geometry explanation
        """
        # Context comparisons
        if miss_distance < 0.1:
            context = "extremely close (within 100 meters)"
            danger = "extremely dangerous"
        elif miss_distance < 1.0:
            context = "very close (within 1 kilometer)"
            danger = "very dangerous"
        elif miss_distance < 5.0:
            context = "close (within 5 kilometers)"
            danger = "potentially dangerous"
        elif miss_distance < 25.0:
            context = "moderate separation (within 25 kilometers)"
            danger = "low risk but monitored"
        else:
            context = "safe separation (over 25 kilometers)"
            danger = "minimal risk"
        
        # Time context
        hours = time_to_tca / 3600
        if hours < 1:
            time_context = f"less than 1 hour ({int(time_to_tca/60)} minutes)"
            urgency = "URGENT"
        elif hours < 6:
            time_context = f"{hours:.1f} hours"
            urgency = "HIGH"
        elif hours < 24:
            time_context = f"{hours:.1f} hours"
            urgency = "MODERATE"
        else:
            days = hours / 24
            time_context = f"{days:.1f} days"
            urgency = "LOW"
        
        explanation = (
            f"The predicted miss distance is {miss_distance:.2f} km, which is {context}. "
            f"Objects are approaching at {relative_velocity:.2f} km/s "
            f"({relative_velocity*3600:.0f} km/h). "
            f"Time to closest approach: {time_context}. "
            f"This geometry indicates {danger} encounter. "
            f"Urgency level: {urgency}."
        )
        
        return {
            "miss_distance_km": miss_distance,
            "relative_velocity_km_s": relative_velocity,
            "time_to_tca_hours": hours,
            "context": context,
            "danger_level": danger,
            "urgency": urgency,
            "explanation": explanation
        }
    
    @staticmethod
    def explain_maneuver(
        delta_v_radial: float,
        delta_v_tangential: float,
        delta_v_normal: float,
        fuel_cost_kg: float,
        risk_reduction: float
    ) -> Dict[str, str]:
        """
        Explain recommended collision avoidance maneuver
        
        Args:
            delta_v_radial: Radial ΔV component (m/s)
            delta_v_tangential: Tangential ΔV component (m/s)
            delta_v_normal: Normal ΔV component (m/s)
            fuel_cost_kg: Estimated propellant mass (kg)
            risk_reduction: Risk reduction percentage (0-100)
            
        Returns:
            Dictionary with maneuver explanation
        """
        total_dv = np.sqrt(delta_v_radial**2 + delta_v_tangential**2 + delta_v_normal**2)
        
        # Dominant direction
        components = [
            ("radial", abs(delta_v_radial)),
            ("tangential", abs(delta_v_tangential)),
            ("normal", abs(delta_v_normal))
        ]
        dominant = max(components, key=lambda x: x[1])
        
        # Efficiency assessment
        if total_dv < 1.0:
            efficiency = "very fuel-efficient"
        elif total_dv < 5.0:
            efficiency = "fuel-efficient"
        elif total_dv < 20.0:
            efficiency = "moderate fuel cost"
        else:
            efficiency = "significant fuel cost"
        
        explanation = (
            f"Recommended maneuver: {total_dv:.2f} m/s total ΔV, "
            f"primarily in the {dominant[0]} direction ({dominant[1]:.2f} m/s). "
            f"Estimated propellant cost: {fuel_cost_kg:.1f} kg. "
            f"This maneuver is {efficiency} and will reduce collision risk by "
            f"{risk_reduction:.0f}%, bringing the probability well below operational thresholds. "
            f"Execute this maneuver at the recommended time for maximum effectiveness."
        )
        
        return {
            "total_delta_v": total_dv,
            "dominant_direction": dominant[0],
            "fuel_cost_kg": fuel_cost_kg,
            "risk_reduction_percent": risk_reduction,
            "efficiency": efficiency,
            "explanation": explanation,
            "components": {
                "radial": delta_v_radial,
                "tangential": delta_v_tangential,
                "normal": delta_v_normal
            }
        }
    
    @staticmethod
    def generate_full_report(
        satellite_name: str,
        debris_name: str,
        physics_poc: float,
        ml_poc: float,
        ml_confidence: float,
        miss_distance: float,
        relative_velocity: float,
        time_to_tca: float,
        maneuver_dv: Tuple[float, float, float] = None,
        fuel_cost: float = None,
        risk_reduction: float = None
    ) -> str:
        """
        Generate comprehensive conjunction assessment report
        
        Returns:
            Formatted natural language report
        """
        explainer = RiskExplainer()
        
        # Header
        report = f"=== CONJUNCTION ASSESSMENT REPORT ===\n"
        report += f"Primary: {satellite_name}\n"
        report += f"Secondary: {debris_name}\n"
        report += f"{'='*50}\n\n"
        
        # Physics-based PoC
        poc_explain = explainer.explain_poc(physics_poc, "Foster 3D")
        report += f"RISK LEVEL: {poc_explain['risk_level']}\n"
        report += f"{poc_explain['explanation']}\n\n"
        
        # ML prediction
        ml_explain = explainer.explain_ml_prediction(ml_poc, physics_poc, ml_confidence)
        report += f"ML ADVISORY:\n{ml_explain['explanation']}\n\n"
        
        # Geometry
        geom_explain = explainer.explain_miss_distance(
            miss_distance, relative_velocity, time_to_tca
        )
        report += f"ENCOUNTER GEOMETRY:\n{geom_explain['explanation']}\n\n"
        
        # Maneuver (if provided)
        if maneuver_dv and fuel_cost and risk_reduction:
            maneuver_explain = explainer.explain_maneuver(
                maneuver_dv[0], maneuver_dv[1], maneuver_dv[2],
                fuel_cost, risk_reduction
            )
            report += f"RECOMMENDED MANEUVER:\n{maneuver_explain['explanation']}\n\n"
        
        # Footer
        report += f"{'='*50}\n"
        report += f"RECOMMENDATION: {poc_explain['action']}\n"
        report += f"Assessment Method: Physics-based (Foster 3D) + ML Advisory\n"
        report += f"Confidence: {poc_explain['confidence']}\n"
        
        return report


# Example usage
if __name__ == "__main__":
    explainer = RiskExplainer()
    
    # Example 1:High risk scenario
    print("\n=== EXAMPLE 1: High Risk Conjunction ===")
    report = explainer.generate_full_report(
        satellite_name="ISS (ZARYA)",
        debris_name="FENGYUN 1C DEB",
        physics_poc=2.4e-4,
        ml_poc=2.7e-4,
        ml_confidence=0.92,
        miss_distance=0.8,
        relative_velocity=12.5,
        time_to_tca=15200,  # ~4.2 hours
        maneuver_dv=(5.2, -12.8, 1.3),
        fuel_cost=12.3,
        risk_reduction=95.8
    )
    print(report)
