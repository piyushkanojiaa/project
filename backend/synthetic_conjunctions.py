"""
Synthetic Conjunction Data Generator
Generates realistic space debris conjunction events for demonstration

This module creates believable conjunction scenarios with:
- Realistic orbital parameters
- Various risk levels (LOW, MEDIUM, HIGH, CRITICAL)
- Time-based progression (events over next 48 hours)
- Consistent data for demo purposes
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import hashlib


class SyntheticConjunctionGenerator:
    """Generate realistic conjunction events for demonstration"""
    
    def __init__(self, seed: int = 42):
        """Initialize with seed for reproducibility"""
        np.random.seed(seed)
        self.satellites = self._generate_satellites()
        self.debris_objects = self._generate_debris()
        
    def _generate_satellites(self) -> List[Dict]:
        """Generate active satellite catalog"""
        satellites = [
            {"id": "25544", "name": "ISS (ZARYA)", "altitude": 420, "inclination": 51.6},
            {"id": "43013", "name": "STARLINK-1007", "altitude": 550, "inclination": 53.0},
            {"id": "48915", "name": "STARLINK-30043", "altitude": 540, "inclination": 53.2},
            {"id": "20580", "name": "HUBBLE SPACE TELESCOPE", "altitude": 540, "inclination": 28.5},
            {"id": "37849", "name": "TIANGONG", "altitude": 390, "inclination": 41.5},
        ]
        return satellites
    
    def _generate_debris(self) -> List[Dict]:
        """Generate debris object catalog"""
        debris = [
            {"id": "49863", "name": "COSMOS 1408 DEB", "altitude": 485, "size": 0.3},
            {"id": "52950", "name": "FENGYUN 1C DEB", "altitude": 850, "size": 0.15},
            {"id": "40115", "name": "IRIDIUM 33 DEB", "altitude": 790, "size": 0.25},
            {"id": "25730", "name": "SL-16 R/B DEB", "altitude": 520, "size": 0.5},
            {"id": "48078", "name": "COSMOS 2251 DEB", "altitude": 790, "size": 0.2},
            {"id": "91234", "name": "UNKNOWN DEB", "altitude": 450, "size": 0.1},
            {"id": "83456", "name": "ROCKET BODY FRAGMENT", "altitude": 600, "size": 0.35},
        ]
        return debris
    
    def generate_conjunctions(self, count: int = 15) -> List[Dict]:
        """
        Generate realistic conjunction events
        
        Returns list of conjunction dictionaries with:
        - conjunction_id
        - satellite info
        - debris info
        - orbital parameters
        - risk assessment
        - maneuver recommendation
        """
        conjunctions = []
        
        for i in range(count):
            # Select random satellite and debris
            sat = np.random.choice(self.satellites)
            deb = np.random.choice(self.debris_objects)
            
            # Generate realistic parameters
            time_to_tca = np.random.uniform(300, 172800)  # 5 min to 48 hours
            miss_distance = self._generate_miss_distance()
            rel_velocity = np.random.uniform(8, 15)  # km/s
            
            # Calculate PoC using simplified Foster formula
            poc_analytic = self._calculate_foster_poc(miss_distance, rel_velocity, deb["size"])
            
            # ML prediction (slightly different, ~95% agreement)
            poc_ml = poc_analytic * np.random.uniform(0.8, 1.2)
            poc_ml = np.clip(poc_ml, 1e-10, 1.0)
            
            # Risk level
            risk_level = self._determine_risk_level(poc_ml, miss_distance)
            
            # Maneuver requirement
            maneuver_required = risk_level in ["HIGH", "CRITICAL"]
            
            # Generate unique ID
            conjunction_id = self._generate_id(sat["id"], deb["id"], time_to_tca)
            
            conjunction = {
                "conjunction_id": conjunction_id,
                "satellite_id": sat["id"],
                "satellite_name": sat["name"],
                "debris_id": deb["id"],
                "debris_name": deb["name"],
                "time_to_tca": float(time_to_tca),
                "tca_timestamp": (datetime.now() + timedelta(seconds=time_to_tca)).isoformat(),
                "miss_distance": float(miss_distance),
                "relative_velocity": float(rel_velocity),
                "poc_analytic": float(poc_analytic),
                "poc_ml": float(poc_ml),
                "risk_level": risk_level,
                "maneuver_required": maneuver_required,
                # Additional metadata
                "satellite_altitude": sat["altitude"],
                "debris_size": deb.get("size", 0.1),
                "crossing_angle": float(np.random.uniform(30, 150)),
            }
            
            conjunctions.append(conjunction)
        
        # Sort by risk level (CRITICAL first) and then by PoC
        risk_priority = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        conjunctions.sort(key=lambda x: (risk_priority[x["risk_level"]], -x["poc_ml"]))
        
        return conjunctions
    
    def _generate_miss_distance(self) -> float:
        """Generate realistic miss distance with log-normal distribution"""
        # Most conjunctions are safe, few are dangerous
        base = np.random.lognormal(mean=1.5, sigma=1.2)
        return max(0.05, min(base, 50.0))  # 50m to 50km
    
    def _calculate_foster_poc(self, miss_distance: float, rel_velocity: float, 
                              debris_size: float) -> float:
        """Simplified Foster PoC calculation"""
        # Combined radius (satellite assumed 10m, debris variable)
        r_combined = 0.01 + debris_size / 1000  # km
        
        # Position uncertainty (km)
        sigma_pos = 0.1 + miss_distance * 0.05
        
        # Mahalanobis distance
        mahal_dist = miss_distance / sigma_pos
        
        # Volume factor
        volume_factor = (4/3 * np.pi * r_combined**3) / \
                       ((2 * np.pi)**(3/2) * sigma_pos**3)
        
        # PoC
        poc = volume_factor * np.exp(-0.5 * mahal_dist**2)
        
        return np.clip(poc, 1e-10, 1.0)
    
    def _determine_risk_level(self, poc: float, miss_distance: float) -> str:
        """Determine risk level from PoC and miss distance"""
        if poc > 1e-3 or miss_distance < 0.5:
            return "CRITICAL"
        elif poc > 1e-4 or miss_distance < 1.0:
            return "HIGH"
        elif poc > 1e-5 or miss_distance < 5.0:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_id(self, sat_id: str, deb_id: str, tca: float) -> str:
        """Generate unique conjunction ID"""
        combined = f"{sat_id}-{deb_id}-{int(tca)}"
        hash_obj = hashlib.md5(combined.encode())
        return f"CONJ-{hash_obj.hexdigest()[:12].upper()}"


# Global instance for consistent data
_generator = None

def get_generator() -> SyntheticConjunctionGenerator:
    """Get or create global generator instance"""
    global _generator
    if _generator is None:
        _generator = SyntheticConjunctionGenerator(seed=42)
    return _generator


def get_synthetic_conjunctions(count: int = 15) -> List[Dict]:
    """Get synthetic conjunction data"""
    generator = get_generator()
    return generator.generate_conjunctions(count)


if __name__ == "__main__":
    # Test generation
    print("=" * 80)
    print("SYNTHETIC CONJUNCTION DATA GENERATOR TEST")
    print("=" * 80)
    
    conjunctions = get_synthetic_conjunctions(10)
    
    print(f"\nGenerated {len(conjunctions)} conjunction events:\n")
    
    for i, conj in enumerate(conjunctions, 1):
        print(f"{i}. {conj['satellite_name']} vs {conj['debris_name']}")
        print(f"   Risk: {conj['risk_level']} | PoC: {conj['poc_ml']:.2e} | "
              f"Miss: {conj['miss_distance']:.3f}km | TCA: {conj['time_to_tca']/3600:.1f}h")
        if conj['maneuver_required']:
            print(f"   ⚠️  MANEUVER REQUIRED")
        print()
