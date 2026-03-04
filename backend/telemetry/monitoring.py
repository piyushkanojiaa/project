"""
Real-Time Telemetry Monitoring

Stream and analyze satellite health telemetry in real-time
"""

import asyncio
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from pydantic import BaseModel
import json

# ============================================================
# Telemetry Models
# ============================================================

class TelemetryData(BaseModel):
    """Satellite telemetry data point"""
    satellite_id: str
    satellite_name: str
    timestamp: datetime
    
    # Power subsystem
    battery_voltage: float  # Volts
    battery_current: float  # Amps
    battery_temperature: float  # Celsius
    battery_level: float  # Percentage 0-100
    solar_panel_output: float  # Watts
    
    # Thermal subsystem
    cpu_temperature: float  # Celsius
    battery_temp: float  # Celsius
    payload_temp: float  # Celsius
    
    # Attitude subsystem
    attitude_x: float  # degrees
    attitude_y: float  # degrees
    attitude_z: float  # degrees
    angular_velocity_x: float  # deg/s
    angular_velocity_y: float  # deg/s
    angular_velocity_z: float  # deg/s
    
    # Communication
    signal_strength: float  # dBm
    packet_loss_rate: float  # Percentage
    
    # Position
    altitude: float  # km
    latitude: float  # degrees
    longitude: float  # degrees
    velocity: float  # km/s
    
    # Health status
    health_status: str  # NOMINAL, DEGRADED, CRITICAL
    anomalies_detected: List[str] = []


class HealthThresholds(BaseModel):
    """Health monitoring thresholds"""
    battery_min: float = 15.0  # %
    battery_max_temp: float = 45.0  # C
    cpu_max_temp: float = 85.0  # C
    signal_min: float = -90.0  # dBm
    packet_loss_max: float = 5.0  # %


# ============================================================
# Telemetry Monitor
# ============================================================

class TelemetryMonitor:
    """Real-time satellite health monitoring"""
    
    def __init__(self, thresholds: Optional[HealthThresholds] = None):
        """Initialize telemetry monitor"""
        self.thresholds = thresholds or HealthThresholds()
        self.subscribers: List[Callable] = []
        self.anomaly_history: Dict[str, List[Dict]] = {}
        self.health_scores: Dict[str, float] = {}
    
    def subscribe(self, callback: Callable):
        """Subscribe to telemetry updates"""
        self.subscribers.append(callback)
    
    async def process_telemetry(
        self,
        telemetry: TelemetryData
    ) -> Dict:
        """
        Process incoming telemetry data
        
        Args:
            telemetry: Telemetry data point
            
        Returns:
            Health assessment
        """
        # Check for anomalies
        anomalies = self._detect_anomalies(telemetry)
        
        # Calculate health score
        health_score = self._calculate_health_score(telemetry)
        
        # Store health score
        self.health_scores[telemetry.satellite_id] = health_score
        
        # Update anomaly history
        if anomalies:
            if telemetry.satellite_id not in self.anomaly_history:
                self.anomaly_history[telemetry.satellite_id] = []
            
            self.anomaly_history[telemetry.satellite_id].append({
                "timestamp": telemetry.timestamp.isoformat(),
                "anomalies": anomalies,
                "health_score": health_score
            })
        
        # Notify subscribers
        assessment = {
            "satellite_id": telemetry.satellite_id,
            "satellite_name": telemetry.satellite_name,
            "timestamp": telemetry.timestamp.isoformat(),
            "health_score": health_score,
            "health_status": self._determine_status(health_score),
            "anomalies": anomalies,
            "recommendations": self._generate_recommendations(telemetry, anomalies)
        }
        
        await self._notify_subscribers(assessment)
        
        return assessment
    
    def _detect_anomalies(self, telemetry: TelemetryData) -> List[str]:
        """Detect telemetry anomalies"""
        anomalies = []
        
        # Battery checks
        if telemetry.battery_level < self.thresholds.battery_min:
            anomalies.append(f"LOW_BATTERY:{telemetry.battery_level:.1f}%")
        
        if telemetry.battery_temperature > self.thresholds.battery_max_temp:
            anomalies.append(f"HIGH_BATTERY_TEMP:{telemetry.battery_temperature:.1f}°C")
        
        # Thermal checks
        if telemetry.cpu_temperature > self.thresholds.cpu_max_temp:
            anomalies.append(f"HIGH_CPU_TEMP:{telemetry.cpu_temperature:.1f}°C")
        
        # Communication checks
        if telemetry.signal_strength < self.thresholds.signal_min:
            anomalies.append(f"WEAK_SIGNAL:{telemetry.signal_strength:.1f}dBm")
        
        if telemetry.packet_loss_rate > self.thresholds.packet_loss_max:
            anomalies.append(f"HIGH_PACKET_LOSS:{telemetry.packet_loss_rate:.1f}%")
        
        # Power generation check
        if telemetry.solar_panel_output < 10 and telemetry.battery_level < 50:
            anomalies.append("LOW_POWER_GENERATION")
        
        # Attitude check (rapid tumbling)
        angular_rate = (
            telemetry.angular_velocity_x ** 2 +
            telemetry.angular_velocity_y ** 2 +
            telemetry.angular_velocity_z ** 2
        ) ** 0.5
        
        if angular_rate > 10:  # > 10 deg/s
            anomalies.append(f"TUMBLING:{angular_rate:.1f}deg/s")
        
        return anomalies
    
    def _calculate_health_score(self, telemetry: TelemetryData) -> float:
        """
        Calculate overall health score (0-100)
        
        Args:
            telemetry: Telemetry data
            
        Returns:
            Health score (0-100, higher is better)
        """
        score = 100.0
        
        # Battery health (25% weight)
        battery_score = min(telemetry.battery_level / 100, 1.0) * 25
        score -= (25 - battery_score)
        
        # Thermal health (20% weight)
        cpu_temp_penalty = max(0, (telemetry.cpu_temperature - 60) / 25) * 20
        score -= cpu_temp_penalty
        
        # Communication health (20% weight)
        signal_score = min((telemetry.signal_strength + 100) / 40, 1.0) * 20
        score -= (20 - signal_score)
        
        packet_loss_penalty = (telemetry.packet_loss_rate / 10) * 10
        score -= min(packet_loss_penalty, 10)
        
        # Power generation (15% weight)
        power_score = min(telemetry.solar_panel_output / 50, 1.0) * 15
        score -= (15 - power_score)
        
        # Attitude stability (20% weight)
        angular_rate = (
            telemetry.angular_velocity_x ** 2 +
            telemetry.angular_velocity_y ** 2 +
            telemetry.angular_velocity_z ** 2
        ) ** 0.5
        attitude_penalty = min(angular_rate / 10, 1.0) * 20
        score -= attitude_penalty
        
        return max(0, min(100, score))
    
    def _determine_status(self, health_score: float) -> str:
        """Determine health status from score"""
        if health_score >= 80:
            return "NOMINAL"
        elif health_score >= 60:
            return "DEGRADED"
        elif health_score >= 40:
            return "WARNING"
        else:
            return "CRITICAL"
    
    def _generate_recommendations(
        self,
        telemetry: TelemetryData,
        anomalies: List[str]
    ) -> List[str]:
        """Generate operational recommendations"""
        recommendations = []
        
        if telemetry.battery_level < 20:
            recommendations.append("Reduce power consumption - enter safe mode")
        
        if telemetry.cpu_temperature > 80:
            recommendations.append("Reduce processing load")
        
        if any("TUMBLING" in a for a in anomalies):
            recommendations.append("Execute attitude control maneuver")
        
        if telemetry.signal_strength < -95:
            recommendations.append("Adjust antenna orientation")
        
        if not recommendations:
            recommendations.append("Continue nominal operations")
        
        return recommendations
    
    async def _notify_subscribers(self, assessment: Dict):
        """Notify all subscribers of health assessment"""
        tasks = [subscriber(assessment) for subscriber in self.subscribers]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def get_satellite_health_summary(self, satellite_id: str) -> Dict:
        """Get health summary for satellite"""
        recent_anomalies = self.anomaly_history.get(satellite_id, [])[:-10]
        current_health = self.health_scores.get(satellite_id, 100.0)
        
        return {
            "satellite_id": satellite_id,
            "current_health_score": current_health,
            "recent_anomaly_count": len(recent_anomalies),
            "recent_anomalies": recent_anomalies,
            "status": self._determine_status(current_health)
        }


# ============================================================
# Telemetry Stream Simulator (for testing)
# ============================================================

class TelemetrySimulator:
    """Simulate satellite telemetry streams"""
    
    @staticmethod
    async def generate_telemetry(
        satellite_id: str,
        satellite_name: str,
        duration_seconds: int = 60,
        interval_seconds: float = 1.0,
        inject_anomalies: bool = False
    ):
        """
        Generate simulated telemetry stream
        
        Args:
            satellite_id: Satellite ID
            satellite_name: Satellite name
            duration_seconds: How long to generate data
            interval_seconds: Time between data points
            inject_anomalies: Whether to inject anomalies
        """
        import random
        
        monitor = TelemetryMonitor()
        
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(seconds=duration_seconds)
        
        while datetime.utcnow() < end_time:
            # Generate telemetry
            telemetry = TelemetryData(
                satellite_id=satellite_id,
                satellite_name=satellite_name,
                timestamp=datetime.utcnow(),
                
                # Normal values with some variation
                battery_voltage=random.uniform(3.6, 4.2),
                battery_current=random.uniform(0.5, 2.0),
                battery_temperature=random.uniform(15, 35),
                battery_level=random.uniform(60, 95) if not inject_anomalies else random.uniform(10, 95),
                solar_panel_output=random.uniform(20, 45),
                
                cpu_temperature=random.uniform(40, 75) if not inject_anomalies else random.uniform(40, 90),
                battery_temp=random.uniform(15, 35),
                payload_temp=random.uniform(20, 40),
                
                attitude_x=random.uniform(-5, 5),
                attitude_y=random.uniform(-5, 5),
                attitude_z=random.uniform(-5, 5),
                angular_velocity_x=random.uniform(-1, 1) if not inject_anomalies else random.uniform(-15, 15),
                angular_velocity_y=random.uniform(-1, 1),
                angular_velocity_z=random.uniform(-1, 1),
                
                signal_strength=random.uniform(-85, -70),
                packet_loss_rate=random.uniform(0, 2),
                
                altitude=random.uniform(400, 410),
                latitude=random.uniform(-90, 90),
                longitude=random.uniform(-180, 180),
                velocity=random.uniform(7.5, 7.8),
                
                health_status="NOMINAL"
            )
            
            # Process
            assessment = await monitor.process_telemetry(telemetry)
            print(f"[{telemetry.timestamp.isoformat()}] {satellite_name}: "
                  f"Health={assessment['health_score']:.1f}, "
                  f"Anomalies={len(assessment['anomalies'])}")
            
            await asyncio.sleep(interval_seconds)
        
        return monitor.get_satellite_health_summary(satellite_id)


# Export
__all__ = [
    'TelemetryData',
    'HealthThresholds',
    'TelemetryMonitor',
    'TelemetrySimulator'
]
