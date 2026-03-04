"""
Multi-Modal Debris Capture Mechanisms
Models different capture strategies with fuel costs and success rates
"""

from enum import Enum
from typing import Dict, Tuple, Optional, List
import numpy as np
from dataclasses import dataclass

class CaptureMethod(Enum):
    """Available capture mechanisms"""
    NET = "net"
    HARPOON = "harpoon"
    MAGNETIC = "magnetic"
    ROBOTIC_ARM = "robotic_arm"

@dataclass
class CaptureSpecs:
    """Specifications for a capture mechanism"""
    name: str
    max_debris_size: float  # meters
    max_relative_velocity: float  # m/s
    success_rate: float  # 0.0 to 1.0
    fuel_cost_multiplier: float
    deployment_time: int  # seconds
    description: str
    requires_metallic: bool = False

class CaptureMechanism:
    """Model for debris capture mechanisms"""
    
    MECHANISM_SPECS = {
        CaptureMethod.NET: CaptureSpecs(
            name='Net Capture',
            max_debris_size=5.0,
            max_relative_velocity=2.0,
            success_rate=0.85,
            fuel_cost_multiplier=1.2,
            deployment_time=30,
            description='Deploys expandable net to ensnare debris. Best for medium-sized objects with moderate velocity.',
            requires_metallic=False
        ),
        CaptureMethod.HARPOON: CaptureSpecs(
            name='Harpoon Capture',
            max_debris_size=10.0,
            max_relative_velocity=5.0,
            success_rate=0.75,
            fuel_cost_multiplier=1.5,
            deployment_time=10,
            description='Fires penetrating harpoon to secure debris. Effective for large, fast-moving objects.',
            requires_metallic=False
        ),
        CaptureMethod.MAGNETIC: CaptureSpecs(
            name='Magnetic Capture',
            max_debris_size=3.0,
            max_relative_velocity=1.0,
            success_rate=0.95,
            fuel_cost_multiplier=1.0,
            deployment_time=60,
            description='Uses electromagnetic field for metallic debris. Highest success rate but requires metal.',
            requires_metallic=True
        ),
        CaptureMethod.ROBOTIC_ARM: CaptureSpecs(
            name='Robotic Arm',
            max_debris_size=2.0,
            max_relative_velocity=0.5,
            success_rate=0.98,
            fuel_cost_multiplier=1.1,
            deployment_time=120,
            description='Precise robotic arm for controlled capture. Best for small, slow-moving debris.',
            requires_metallic=False
        )
    }
    
    @classmethod
    def select_optimal_method(
        cls,
        debris_size: float,
        relative_velocity: float,
        is_metallic: bool = False,
        prefer_speed: bool = False
    ) -> Tuple[Optional[CaptureMethod], Dict]:
        """
        Select optimal capture method based on debris characteristics
        
        Args:
            debris_size: Size of debris in meters
            relative_velocity: Relative velocity in m/s
            is_metallic: Whether debris is metallic
            prefer_speed: Prefer faster deployment over success rate
        
        Returns:
            Tuple of (CaptureMethod, analysis dict)
        """
        
        viable_methods = []
        
        for method, specs in cls.MECHANISM_SPECS.items():
            # Check if method can handle debris
            can_capture = (
                debris_size <= specs.max_debris_size and
                relative_velocity <= specs.max_relative_velocity
            )
            
            # Skip magnetic if not metallic
            if specs.requires_metallic and not is_metallic:
                can_capture = False
            
            if can_capture:
                # Calculate score
                success_rate = specs.success_rate
                
                # Bonus for magnetic if debris is metallic
                if method == CaptureMethod.MAGNETIC and is_metallic:
                    success_rate *= 1.1
                
                # Calculate score based on preferences
                if prefer_speed:
                    score = success_rate / (specs.deployment_time / 60.0)
                else:
                    score = success_rate / specs.fuel_cost_multiplier
                
                viable_methods.append({
                    'method': method,
                    'specs': specs,
                    'score': score,
                    'success_rate': success_rate
                })
        
        if not viable_methods:
            return None, {
                'error': 'No viable capture method',
                'reason': f'Debris size ({debris_size}m) or velocity ({relative_velocity}m/s) exceeds all method limits',
                'suggestions': cls._get_suggestions(debris_size, relative_velocity)
            }
        
        # Select method with highest score
        best = max(viable_methods, key=lambda x: x['score'])
        
        return best['method'], {
            'selected_method': best['specs'].name,
            'success_rate': best['success_rate'],
            'fuel_multiplier': best['specs'].fuel_cost_multiplier,
            'deployment_time': best['specs'].deployment_time,
            'description': best['specs'].description,
            'alternatives': [
                {
                    'method': m['specs'].name,
                    'success_rate': m['success_rate'],
                    'score': m['score']
                }
                for m in sorted(viable_methods, key=lambda x: x['score'], reverse=True)[1:]
            ]
        }
    
    @classmethod
    def _get_suggestions(cls, debris_size: float, relative_velocity: float) -> List[str]:
        """Get suggestions for handling difficult debris"""
        suggestions = []
        
        if debris_size > 10.0:
            suggestions.append("Consider breaking debris into smaller pieces first")
        
        if relative_velocity > 5.0:
            suggestions.append("Perform velocity matching maneuver before capture")
        
        if not suggestions:
            suggestions.append("Debris parameters exceed all capture method capabilities")
        
        return suggestions
    
    @classmethod
    def calculate_capture_fuel_cost(
        cls,
        method: CaptureMethod,
        base_delta_v: float,
        debris_mass: float = 100.0,  # kg
        spacecraft_mass: float = 1000.0  # kg
    ) -> Dict[str, float]:
        """
        Calculate fuel cost for capture operation
        
        Args:
            method: Selected capture method
            base_delta_v: Base delta-v for rendezvous (m/s)
            debris_mass: Mass of debris (kg)
            spacecraft_mass: Mass of spacecraft (kg)
        
        Returns:
            Dict with fuel calculations
        """
        specs = cls.MECHANISM_SPECS[method]
        
        # Apply method-specific multiplier
        capture_delta_v = base_delta_v * specs.fuel_cost_multiplier
        
        # Additional delta-v for post-capture maneuver (moving combined mass)
        combined_mass = spacecraft_mass + debris_mass
        mass_ratio = combined_mass / spacecraft_mass
        post_capture_delta_v = base_delta_v * 0.5 * mass_ratio
        
        # Total delta-v
        total_delta_v = capture_delta_v + post_capture_delta_v
        
        # Fuel calculation (Tsiolkovsky rocket equation)
        # Assuming Isp = 300s for typical thrusters
        isp = 300.0
        g0 = 9.81
        
        # m_fuel = m_spacecraft * (1 - e^(-dv/(Isp*g0)))
        fuel_fraction = 1 - np.exp(-total_delta_v / (isp * g0))
        fuel_mass = spacecraft_mass * fuel_fraction
        
        return {
            'capture_delta_v': capture_delta_v,
            'post_capture_delta_v': post_capture_delta_v,
            'total_delta_v': total_delta_v,
            'fuel_mass_kg': fuel_mass,
            'fuel_fraction': fuel_fraction,
            'method_multiplier': specs.fuel_cost_multiplier
        }
    
    @classmethod
    def get_all_methods_info(cls) -> List[Dict]:
        """Get information about all capture methods"""
        return [
            {
                'id': method.value,
                'name': specs.name,
                'max_size': specs.max_debris_size,
                'max_velocity': specs.max_relative_velocity,
                'success_rate': specs.success_rate * 100,
                'fuel_multiplier': specs.fuel_cost_multiplier,
                'deployment_time': specs.deployment_time,
                'description': specs.description,
                'requires_metallic': specs.requires_metallic
            }
            for method, specs in cls.MECHANISM_SPECS.items()
        ]

# Example usage
if __name__ == "__main__":
    # Test capture method selection
    print("Testing Capture Mechanism Selection\n")
    
    # Test case 1: Medium debris, moderate velocity
    method, analysis = CaptureMechanism.select_optimal_method(
        debris_size=4.0,
        relative_velocity=1.5,
        is_metallic=False
    )
    print(f"Test 1 - Medium debris (4m, 1.5m/s):")
    print(f"  Selected: {analysis['selected_method']}")
    print(f"  Success rate: {analysis['success_rate']*100:.1f}%\n")
    
    # Test case 2: Metallic debris
    method, analysis = CaptureMechanism.select_optimal_method(
        debris_size=2.0,
        relative_velocity=0.8,
        is_metallic=True
    )
    print(f"Test 2 - Metallic debris (2m, 0.8m/s):")
    print(f"  Selected: {analysis['selected_method']}")
    print(f"  Success rate: {analysis['success_rate']*100:.1f}%\n")
    
    # Test case 3: Fuel calculation
    if method:
        fuel_calc = CaptureMechanism.calculate_capture_fuel_cost(
            method=method,
            base_delta_v=50.0,
            debris_mass=150.0
        )
        print(f"Fuel calculation for {analysis['selected_method']}:")
        print(f"  Total Δv: {fuel_calc['total_delta_v']:.2f} m/s")
        print(f"  Fuel mass: {fuel_calc['fuel_mass_kg']:.2f} kg")

__all__ = ['CaptureMethod', 'CaptureMechanism', 'CaptureSpecs']
