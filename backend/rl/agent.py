"""
Reinforcement Learning Agent

 PPO agent for learning optimal collision avoidance maneuvers
"""

from typing import Dict, Optional
import numpy as np
from datetime import datetime
import os

try:
    from stable_baselines3 import PPO
    from stable_baselines3.common.vec_env import DummyVecEnv
    from stable_baselines3.common.callbacks import EvalCallback, CheckpointCallback
    SB3_AVAILABLE = True
except ImportError:
    SB3_AVAILABLE = False
    print("⚠️  Stable-Baselines3 not installed. Run: pip install stable-baselines3")

from rl.environment import CollisionAvoidanceEnv, GYM_AVAILABLE

# ============================================================
# PPO Agent
# ============================================================

class ManeuverOptimizationAgent:
    """
    Proximal Policy Optimization Agent for Maneuver Optimization
    
    Why PPO:
    - Continuous action space (delta-v vectors)
    - Sample efficient
    - Stable training
    - State-of-the-art algorithm
    - Works well with multi-objective rewards
    """
    
    def __init__(
        self,
        env: Optional[CollisionAvoidanceEnv] = None,
        learning_rate: float = 3e-4,
        n_steps: int = 2048,
        batch_size: int = 64
    ):
        """
        Initialize PPO agent
        
        Args:
            env: Collision avoidance environment
            learning_rate: Learning rate for optimizer
            n_steps: Steps per update
            batch_size: Mini-batch size
        """
        if not SB3_AVAILABLE or not GYM_AVAILABLE:
            raise ImportError("Stable-Baselines3 and Gym required")
        
        # Create environment
        if env is None:
            env = CollisionAvoidanceEnv()
        
        self.env = DummyVecEnv([lambda: env])
        
        # Create PPO model
        self.model = PPO(
            "MlpPolicy",  # Multi-layer perceptron policy
            self.env,
            learning_rate=learning_rate,
            n_steps=n_steps,
            batch_size=batch_size,
            n_epochs=10,
            gamma=0.99,  # Discount factor
            gae_lambda=0.95,
            clip_range=0.2,
            verbose=1,
            tensorboard_log="./rl_logs/"
        )
        
        self.training_history = []
    
    def train(
        self,
        total_timesteps: int = 100000,
        eval_freq: int = 10000,
        save_path: str = "backend/rl/models/trained_agent"
    ):
        """
        Train agent on collision avoidance scenarios
        
        Args:
            total_timesteps: Total training steps
            eval_freq: Evaluation frequency
            save_path: Path to save model
        """
        print(f"🚀 Starting training for {total_timesteps} timesteps...")
        
        # Create evaluation environment
        eval_env = DummyVecEnv([lambda: CollisionAvoidanceEnv()])
        
        # Evaluation callback
        eval_callback = EvalCallback(
            eval_env,
            best_model_save_path=save_path,
            log_path="./rl_logs/",
            eval_freq=eval_freq,
            deterministic=True,
            render=False
        )
        
        # Checkpoint callback
        checkpoint_callback = CheckpointCallback(
            save_freq=eval_freq,
            save_path=save_path + "/checkpoints/",
            name_prefix="rl_model"
        )
        
        # Train
        self.model.learn(
            total_timesteps=total_timesteps,
            callback=[eval_callback, checkpoint_callback]
        )
        
        print(f"✅ Training complete!")
        
        # Save final model
        self.save(save_path + "/final_model.zip")
    
    def predict_maneuver(
        self,
        state: np.ndarray,
        deterministic: bool = True
    ) -> np.ndarray:
        """
        Predict optimal maneuver for given state
        
        Args:
            state: Current state vector
            deterministic: Use deterministic policy
            
        Returns:
            Delta-v vector [Δvx, Δvy, Δvz] m/s
        """
        action, _ = self.model.predict(state, deterministic=deterministic)
        return action
    
    def save(self, path: str):
        """Save trained agent"""
        self.model.save(path)
        print(f"✅ Model saved to {path}")
    
    def load(self, path: str):
        """Load trained agent"""
        if not os.path.exists(path + ".zip"):
            raise FileNotFoundError(f"Model not found: {path}")
        
        self.model = PPO.load(path)
        print(f"✅ Model loaded from {path}")
    
    def evaluate(self, n_episodes: int = 10) -> Dict:
        """
        Evaluate agent performance
        
        Args:
            n_episodes: Number of evaluation episodes
            
        Returns:
            Performance metrics
        """
        print(f"📊 Evaluating agent over {n_episodes} episodes...")
        
        from rl.environment import evaluate_policy
        
        metrics = evaluate_policy(
            self.env.envs[0],
            self.model,
            n_episodes=n_episodes
        )
        
        print(f"\n📈 Performance Metrics:")
        print(f"  Success Rate:     {metrics['success_rate']:.1%}")
        print(f"  Avg Fuel Used:    {metrics['avg_fuel_kg']:.3f} kg")
        print(f"  Avg Delta-v:      {metrics['avg_delta_v_ms']:.2f} m/s")
        print(f"  Avg Miss Distance: {metrics['avg_miss_distance_km']:.2f} km")
        
        return metrics
    
    def fine_tune(
        self,
        expert_demonstrations: list,
        n_epochs: int = 5
    ):
        """
        Fine-tune agent using expert demonstrations
        
        Args:
            expert_demonstrations: List of (state, action) pairs
            n_epochs: Number of fine-tuning epochs
        """
        print("🎓 Fine-tuning with expert demonstrations...")
        
        # TODO: Implement behavior cloning fine-tuning
        # For now, just continue training
        self.train(total_timesteps=10000)


# ============================================================
# Training Pipeline
# ============================================================

def train_new_agent(
    total_timesteps: int = 1_000_000,
    save_path: str = "backend/rl/models/trained_agent"
) -> ManeuverOptimizationAgent:
    """
    Complete training pipeline for new agent
    
    Args:
        total_timesteps: Total training steps
        save_path: Save location
        
    Returns:
        Trained agent
    """
    print("=" * 70)
    print("REINFORCEMENT LEARNING TRAINING PIPELINE")
    print("=" * 70)
    print(f"Total Timesteps: {total_timesteps:,}")
    print(f"Algorithm: PPO (Proximal Policy Optimization)")
    print(f"Save Path: {save_path}")
    print("=" * 70)
    
    # Create agent
    agent = ManeuverOptimizationAgent()
    
    # Train
    agent.train(
        total_timesteps=total_timesteps,
        save_path=save_path
    )
    
    # Evaluate
    metrics = agent.evaluate(n_episodes=100)
    
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE!")
    print("=" * 70)
    print(f"Final Success Rate: {metrics['success_rate']:.1%}")
    print(f"Final Fuel Efficiency: {metrics['avg_fuel_kg']:.3f} kg/maneuver")
    print("=" * 70)
    
    return agent


def load_trained_agent(path: str = "backend/rl/models/trained_agent/final_model") -> ManeuverOptimizationAgent:
    """
    Load pre-trained agent
    
    Args:
        path: Model path
        
    Returns:
        Loaded agent
    """
    agent = ManeuverOptimizationAgent()
    agent.load(path)
    
    return agent


# ============================================================
# Integration with System
# ============================================================

async def calculate_rl_maneuver(
    conjunction_data: Dict,
    satellite_id: str
) -> Dict:
    """
    Use trained RL agent to calculate optimal maneuver
    
    Args:
        conjunction_data: Conjunction event data
        satellite_id: Satellite ID
        
    Returns:
        Maneuver recommendation
    """
    try:
        # Load trained agent
        agent = load_trained_agent()
        
        # Prepare state vector
        state = _prepare_state_from_conjunction(conjunction_data, satellite_id)
        
        # Get optimal delta-v
        delta_v = agent.predict_maneuver(state)
        
        # Calculate fuel required
        from maneuvers.fuel_calculator import FuelCalculator, get_fuel_model
        
        fuel_model = get_fuel_model(satellite_id)
        
        if fuel_model:
            fuel_calc = FuelCalculator.calculate_fuel_for_maneuver_vector(
                delta_v.tolist(),
                fuel_model
            )
            
            return {
                "delta_v_vector": delta_v.tolist(),
                "delta_v_magnitude": np.linalg.norm(delta_v),
                "fuel_kg": fuel_calc["fuel_kg"],
                "method": "reinforcement_learning",
                "confidence": 0.95,
                "feasible": fuel_calc["feasible"]
            }
        else:
            return {
                "error": "Fuel model not found",
                "satellite_id": satellite_id
            }
    
    except Exception as e:
        return {
            "error": str(e),
            "fallback": "use_heuristic"
        }


def _prepare_state_from_conjunction(conjunction_data: Dict, satellite_id: str) -> np.ndarray:
    """Convert conjunction data to RL state vector"""
    # Extract relevant data
    sat_pos = conjunction_data.get("satellite_position", [0, 0, 0])
    sat_vel = conjunction_data.get("satellite_velocity", [0, 0, 0])
    debris_pos = conjunction_data.get("debris_position", [0, 0, 0])
    debris_vel = conjunction_data.get("debris_velocity", [0, 0, 0])
    fuel = conjunction_data.get("remaining_fuel_kg", 1.0)
    time_to_tca = conjunction_data.get("time_to_tca_hours", 12.0)
    phase = conjunction_data.get("mission_phase", 2)  # Default to NOMINAL_OPS
    
    # Create state vector
    state = np.array([
        *sat_pos,
        *sat_vel,
        *debris_pos,
        *debris_vel,
        fuel,
        time_to_tca,
        phase
    ], dtype=np.float32)
    
    return state


# Export
__all__ = [
    'ManeuverOptimizationAgent',
    'train_new_agent',
    'load_trained_agent',
    'calculate_rl_maneuver',
    'SB3_AVAILABLE'
]
