"""
Reinforcement Learning Environment for Collision Avoidance

OpenAI Gym environment for training RL agents to optimize maneuvers
"""

from typing import Dict, List, Tuple, Optional
import numpy as np
from datetime import datetime, timedelta

try:
    import gym
    from gym import spaces
    GYM_AVAILABLE = True
except ImportError:
    GYM_AVAILABLE = False
    print("⚠️  OpenAI Gym not installed. Run: pip install gym")

from maneuvers.fuel_calculator import FuelCalculator, SatelliteFuelModel, CUBESAT_FUEL_MODEL

# ============================================================
# RL Environment
# ============================================================

if GYM_AVAILABLE:
    class CollisionAvoidanceEnv(gym.Env):
        """
        Reinforcement Learning Environment for Maneuver Optimization
        
        State Space (15 dimensions):
        - Satellite position [x, y, z] km
        - Satellite velocity [vx, vy, vz] km/s
        - Debris position [x, y, z] km
        - Debris velocity [vx, vy, vz] km/s
        - Available fuel (kg)
        - Time to closest approach (hours)
        - Current mission phase (0-4)
        
        Action Space (3 dimensions):
        - Delta-V vector [Δvx, Δvy, Δvz] (continuous)
        - Range: -5 to +5 m/s per axis
        
        Reward Function:
        - +100 for safe passage (>5km miss distance)
        - -100 for collision (<1km)
        - -10 per kg of fuel used
        - -5 for large orbital changes
        - +50 for fuel efficiency
        - +20 for achieving exactly minimum safe distance
        """
        
        metadata = {'render.modes': ['human']}
        
        def __init__(
            self,
            fuel_model: Optional[SatelliteFuelModel] = None,
            min_safe_distance_km: float = 5.0,
            max_episode_steps: int = 10
        ):
            """
            Initialize environment
            
            Args:
                fuel_model: Satellite fuel model
                min_safe_distance_km: Minimum safe miss distance
                max_episode_steps: Max steps per episode
            """
            super().__init__()
            
            self.fuel_model = fuel_model or CUBESAT_FUEL_MODEL
            self.min_safe_distance = min_safe_distance_km
            self.max_steps = max_episode_steps
            
            # State space: 15 dimensions
            self.observation_space = spaces.Box(
                low=-np.inf,
                high=np.inf,
                shape=(15,),
                dtype=np.float32
            )
            
            # Action space: 3D delta-v vector (-5 to +5 m/s)
            self.action_space = spaces.Box(
                low=-5.0,
                high=5.0,
                shape=(3,),
                dtype=np.float32
            )
            
            # Episode state
            self.current_step = 0
            self.satellite_pos = np.zeros(3)
            self.satellite_vel = np.zeros(3)
            self.debris_pos = np.zeros(3)
            self.debris_vel = np.zeros(3)
            self.remaining_fuel = 0.0
            self.time_to_tca = 0.0
            self.mission_phase = 0
            
            # Fuel calculator
            self.fuel_calc = FuelCalculator()
            
        def reset(self) -> np.ndarray:
            """
            Reset environment for new episode
            
            Returns:
                Initial state
            """
            # Random scenario generation
            self.current_step = 0
            
            # Satellite initial state (LEO orbit ~ 7.5 km/s)
            self.satellite_pos = np.random.uniform(-7000, 7000, 3)  # km
            self.satellite_vel = np.random.uniform(-8, 8, 3)  # km/s
            
            # Debris on collision course
            # Start close but not too close
            self.debris_pos = self.satellite_pos + np.random.uniform(-50, 50, 3)
            self.debris_vel = self.satellite_vel + np.random.uniform(-2, 2, 3)
            
            # Available fuel
            self.remaining_fuel = self.fuel_model.remaining_fuel_kg
            
            # Time to TCA (6-48 hours)
            self.time_to_tca = np.random.uniform(6, 48)
            
            # Random mission phase (0-4)
            self.mission_phase = np.random.randint(0, 5)
            
            return self._get_state()
        
        def step(self, action: np.ndarray) -> Tuple[np.ndarray, float, bool, dict]:
            """
            Execute maneuver and return next state
            
            Args:
                action: Delta-v vector [Δvx, Δvy, Δvz] m/s
                
            Returns:
                (next_state, reward, done, info)
            """
            self.current_step += 1
            
            # Convert action to m/s
            delta_v = action  # Already in m/s
            
            # Calculate fuel consumed
            delta_v_magnitude = np.linalg.norm(delta_v)
            
            fuel_result = self.fuel_calc.calculate_fuel_for_delta_v(
                delta_v_magnitude,
                self.fuel_model
            )
            
            fuel_used = fuel_result["fuel_kg"]
            
            # Check feasibility
            if fuel_used > self.remaining_fuel:
                # Not enough fuel - penalize heavily
                return self._get_state(), -200, True, {"error": "insufficient_fuel"}
            
            # Update satellite velocity (convert delta_v to km/s)
            self.satellite_vel += (delta_v / 1000.0)
            
            # Update fuel
            self.remaining_fuel -= fuel_used
            
            # Propagate orbits
            time_step_hours = 1.0  # 1 hour time step
            self._propagate_orbits(time_step_hours)
            
            # Update time to TCA
            self.time_to_tca -= time_step_hours
            
            # Calculate current miss distance
            min_distance = self._calculate_min_distance()
            
            # Calculate reward
            reward = self._calculate_reward(min_distance, fuel_used, delta_v_magnitude)
            
            # Check if episode is done
            done = (
                self.time_to_tca <= 0 or  # Reached TCA
                min_distance < 1.0 or  # Collision
                min_distance > 100.0 or  # Very safe
                self.remaining_fuel <= 0 or  # No fuel
                self.current_step >= self.max_steps  # Max steps
            )
            
            info = {
                "miss_distance_km": min_distance,
                "fuel_used_kg": fuel_used,
                "delta_v_ms": delta_v_magnitude,
                "success": min_distance >= self.min_safe_distance and min_distance < 100,
                "remaining_fuel_kg": self.remaining_fuel
            }
            
            return self._get_state(), reward, done, info
        
        def _get_state(self) -> np.ndarray:
            """Get current state vector"""
            state = np.concatenate([
                self.satellite_pos,
                self.satellite_vel,
                self.debris_pos,
                self.debris_vel,
                [self.remaining_fuel],
                [self.time_to_tca],
                [self.mission_phase]
            ])
            
            return state.astype(np.float32)
        
        def _propagate_orbits(self, hours: float):
            """Simple orbital propagation"""
            # Simplified Keplerian propagation
            dt = hours * 3600  # Convert to seconds
            
            # Update positions (v * t)
            self.satellite_pos += self.satellite_vel * (dt / 3600)  # km
            self.debris_pos += self.debris_vel * (dt / 3600)  # km
            
            # Add some noise for realism
            noise = np.random.normal(0, 0.1, 3)
            self.debris_pos += noise
        
        def _calculate_min_distance(self) -> float:
            """Calculate minimum distance between satellite and debris"""
            # Current separation
            distance = np.linalg.norm(self.satellite_pos - self.debris_pos)
            
            return distance
        
        def _calculate_reward(
            self,
            distance_km: float,
            fuel_used_kg: float,
            delta_v_ms: float
        ) -> float:
            """
            Multi-objective reward function
            
            Balances safety, fuel efficiency, and orbital stability
            """
            reward = 0
            
            # Safety reward (most important)
            if distance_km > self.min_safe_distance * 3:
                reward += 150  # Very safe!
            elif distance_km > self.min_safe_distance:
                reward += 100  # Safe!
            elif distance_km > 1.0:
                reward += (distance_km - 1.0) * 20  # Marginal
            else:
                reward -= 200  # Collision!
            
            # Fuel efficiency reward
            reward -= fuel_used_kg * 10  # Penalize fuel usage
            
            # Bonus for low fuel usage
            if fuel_used_kg < 0.05:
                reward += 30  # Very efficient!
            elif fuel_used_kg < 0.1:
                reward += 15  # Efficient
            
            # Large maneuver penalty
            if delta_v_ms > 3.0:
                reward -= 20  # Big maneuver
            elif delta_v_ms > 5.0:
                reward -= 40  # Very big maneuver
            
            # Perfect distance bonus
            if self.min_safe_distance <= distance_km <= self.min_safe_distance + 2:
                reward += 50  # Just right!
            
            # Fuel conservation bonus
            fuel_percent_used = (fuel_used_kg / self.fuel_model.total_fuel_kg) * 100
            if fuel_percent_used < 1.0:
                reward += 25  # Conserved fuel well
            
            return reward
        
        def render(self, mode='human'):
            """Render environment state"""
            if mode == 'human':
                print("=" * 60)
                print(f"Step: {self.current_step}")
                print(f"Satellite: {self.satellite_pos} km")
                print(f"Debris:    {self.debris_pos} km")
                print(f"Distance:  {self._calculate_min_distance():.2f} km")
                print(f"Fuel:      {self.remaining_fuel:.3f} kg")
                print(f"Time to TCA: {self.time_to_tca:.1f} hours")
                print("=" * 60)
        
        def close(self):
            """Clean up"""
            pass

else:
    # Dummy class if Gym not available
    class CollisionAvoidanceEnv:
        def __init__(self, *args, **kwargs):
            raise ImportError("OpenAI Gym required. Install with: pip install gym")


# ============================================================
# Helper Functions
# ============================================================

def create_training_scenarios(n_scenarios: int = 100) -> List[Dict]:
    """
    Generate diverse training scenarios
    
    Returns:
        List of scenario configurations
    """
    scenarios = []
    
    for i in range(n_scenarios):
        scenario = {
            "scenario_id": i,
            "initial_miss_distance_km": np.random.uniform(0.2, 5.0),
            "time_to_tca_hours": np.random.uniform(6, 48),
            "relative_velocity_ms": np.random.uniform(5000, 15000),
            "satellite_type": np.random.choice(["cubesat", "small_sat", "large_sat"]),
            "fuel_available_kg": np.random.uniform(0.1, 10.0),
            "difficulty": "easy" if i < 30 else "medium" if i < 70 else "hard"
        }
        
        scenarios.append(scenario)
    
    return scenarios


def evaluate_policy(env: CollisionAvoidanceEnv, policy, n_episodes: int = 10) -> Dict:
    """
    Evaluate RL policy performance
    
    Args:
        env: Environment
        policy: Trained policy (agent)
        n_episodes: Number of evaluation episodes
        
    Returns:
        Performance metrics
    """
    successes = 0
    total_fuel = 0
    total_delta_v = 0
    distances = []
    
    for episode in range(n_episodes):
        state = env.reset()
        done = False
        episode_fuel = 0
        episode_delta_v = 0
        
        while not done:
            # Get action from policy
            action, _ = policy.predict(state, deterministic=True)
            
            # Step environment
            state, reward, done, info = env.step(action)
            
            episode_fuel += info.get("fuel_used_kg", 0)
            episode_delta_v += info.get("delta_v_ms", 0)
        
        # Check success
        if info.get("success"):
            successes += 1
        
        total_fuel += episode_fuel
        total_delta_v += episode_delta_v
        distances.append(info.get("miss_distance_km", 0))
    
    return {
        "success_rate": successes / n_episodes,
        "avg_fuel_kg": total_fuel / n_episodes,
        "avg_delta_v_ms": total_delta_v / n_episodes,
        "avg_miss_distance_km": np.mean(distances),
        "min_miss_distance_km": np.min(distances),
        "max_miss_distance_km": np.max(distances)
    }


# Export
__all__ = [
    'CollisionAvoidanceEnv',
    'create_training_scenarios',
    'evaluate_policy',
    'GYM_AVAILABLE'
]
