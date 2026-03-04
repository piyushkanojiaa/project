"""
Advanced ML Models - LSTM Trajectory Predictor

Long-term satellite trajectory prediction using LSTM neural networks
"""

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from typing import List, Tuple, Optional
from datetime import datetime, timedelta
import pickle

# ============================================================
# LSTM Model Architecture
# ============================================================

class TrajectoryLSTM(nn.Module):
    """LSTM model for multi-step satellite trajectory prediction"""
    
    def __init__(
        self,
        input_size: int = 6,  # x, y, z, vx, vy, vz
        hidden_size: int = 128,
        num_layers: int = 3,
        output_size: int = 6,
        dropout: float = 0.2
    ):
        super(TrajectoryLSTM, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )
        
        # Fully connected layers
        self.fc1 = nn.Linear(hidden_size, hidden_size // 2)
        self.fc2 = nn.Linear(hidden_size // 2, output_size)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, hidden=None):
        # x shape: (batch, seq_len, input_size)
        
        # LSTM forward
        lstm_out, hidden = self.lstm(x, hidden)
        
        # Take last timestep
        last_output = lstm_out[:, -1, :]
        
        # Fully connected layers
        out = self.fc1(last_output)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out, hidden


# ============================================================
# Trajectory Predictor
# ============================================================

class TrajectoryPredictor:
    """Predict satellite trajectories using trained LSTM model"""
    
    def __init__(
        self,
        model_path: str = "models/trajectory_lstm.pth",
        scaler_path: str = "models/trajectory_scaler.pkl"
    ):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load model
        self.model = TrajectoryLSTM()
        try:
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
            print(f"✓ LSTM model loaded from {model_path}")
        except FileNotFoundError:
            print(f"⚠ Model not found at {model_path}, using untrained model")
        
        # Load scaler
        try:
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
        except FileNotFoundError:
            print(f"⚠ Scaler not found, using identity scaling")
            self.scaler = None
    
    def predict_trajectory(
        self,
        state_history: np.ndarray,
        steps_ahead: int = 168,  # 1 week in hours
        timestep_hours: float = 1.0
    ) -> List[dict]:
        """
        Predict future trajectory positions
        
        Args:
            state_history: Historical state vectors (N, 6) [x, y, z, vx, vy, vz]
            steps_ahead: Number of timesteps to predict
            timestep_hours: Hours between each timestep
        
        Returns:
            List of predicted states with timestamps
        """
        # Ensure we have enough history (at least 10 timesteps)
        if len(state_history) < 10:
            raise ValueError("Need at least 10 historical states")
        
        # Take last 50 timesteps
        history = state_history[-50:]
        
        # Normalize
        if self.scaler:
            history_scaled = self.scaler.transform(history)
        else:
            history_scaled = history
        
        # Convert to tensor
        x = torch.FloatTensor(history_scaled).unsqueeze(0).to(self.device)
        
        predictions = []
        hidden = None
        current_time = datetime.utcnow()
        
        with torch.no_grad():
            for step in range(steps_ahead):
                # Predict next state
                pred, hidden = self.model(x, hidden)
                
                # Denormalize
                if self.scaler:
                    pred_state = self.scaler.inverse_transform(
                        pred.cpu().numpy()
                    ).flatten()
                else:
                    pred_state = pred.cpu().numpy().flatten()
                
                # Create prediction dict
                timestamp = current_time + timedelta(hours=(step + 1) * timestep_hours)
                predictions.append({
                    'timestamp': timestamp.isoformat(),
                    'position': {
                        'x': float(pred_state[0]),
                        'y': float(pred_state[1]),
                        'z': float(pred_state[2])
                    },
                    'velocity': {
                        'vx': float(pred_state[3]),
                        'vy': float(pred_state[4]),
                        'vz': float(pred_state[5])
                    },
                    'timestep': step + 1
                })
                
                # Update input with prediction for next step
                if step < steps_ahead - 1:
                    # Append prediction to history
                    new_state = torch.FloatTensor(pred_state).unsqueeze(0).unsqueeze(0).to(self.device)
                    x = torch.cat([x[:, 1:, :], new_state], dim=1)
        
        return predictions
    
    def compute_uncertainty(
        self,
        state_history: np.ndarray,
        steps_ahead: int = 24,
        n_samples: int = 100
    ) -> List[dict]:
        """
        Compute prediction uncertainty using Monte Carlo dropout
        
        Args:
            state_history: Historical states
            steps_ahead: Prediction horizon
            n_samples: Number of MC samples
        
        Returns:
            Predictions with uncertainty bounds
        """
        # Enable dropout during inference
        self.model.train()
        
        all_predictions = []
        
        for _ in range(n_samples):
            preds = self.predict_trajectory(state_history, steps_ahead)
            all_predictions.append(preds)
        
        # Back to eval mode
        self.model.eval()
        
        # Compute statistics
        results = []
        for step in range(steps_ahead):
            positions = np.array([
                [p[step]['position']['x'], p[step]['position']['y'], p[step]['position']['z']]
                for p in all_predictions
            ])
            
            mean_pos = positions.mean(axis=0)
            std_pos = positions.std(axis=0)
            
            results.append({
                'timestep': step + 1,
                'timestamp': all_predictions[0][step]['timestamp'],
                'position': {
                    'x': float(mean_pos[0]),
                    'y': float(mean_pos[1]),
                    'z': float(mean_pos[2])
                },
                'uncertainty': {
                    'x_std': float(std_pos[0]),
                    'y_std': float(std_pos[1]),
                    'z_std': float(std_pos[2]),
                    'total_std': float(np.linalg.norm(std_pos))
                },
                'confidence': 1.0 - min(np.linalg.norm(std_pos) / 1000.0, 1.0)
            })
        
        return results


# ============================================================
# Ensemble Predictor
# ============================================================

class EnsemblePredictor:
    """Ensemble of multiple models for robust predictions"""
    
    def __init__(self):
        self.lstm = TrajectoryPredictor()
        # Could add XGBoost, Random Forest, etc.
        self.weights = {
            'lstm': 0.7,
            'physics': 0.3  # SGP4 physics-based model
        }
    
    def predict(
        self,
        state_history: np.ndarray,
        tle: Optional[Tuple[str, str]] = None,
        steps_ahead: int = 24
    ) -> List[dict]:
        """
        Weighted ensemble prediction
        
        Args:
            state_history: Historical states
            tle: Two-line element set (optional)
            steps_ahead: Prediction horizon
        
        Returns:
            Ensemble predictions
        """
        # LSTM prediction
        lstm_preds = self.lstm.predict_trajectory(state_history, steps_ahead)
        
        # Physics-based prediction (if TLE available)
        if tle:
            # Use SGP4 propagator
            from examples import propagate_state
            physics_preds = []
            # ... SGP4 propagation logic
        else:
            physics_preds = lstm_preds  # Fallback to LSTM only
        
        # Weighted combination
        ensemble_preds = []
        for i in range(steps_ahead):
            lstm_pos = np.array([
                lstm_preds[i]['position']['x'],
                lstm_preds[i]['position']['y'],
                lstm_preds[i]['position']['z']
            ])
            
            # Weighted average
            final_pos = lstm_pos * self.weights['lstm']
            # + physics_pos * self.weights['physics']  # If physics available
            
            ensemble_preds.append({
                'timestamp': lstm_preds[i]['timestamp'],
                'position': {
                    'x': float(final_pos[0]),
                    'y': float(final_pos[1]),
                    'z': float(final_pos[2])
                },
                'method': 'ensemble',
                'confidence': lstm_preds[i].get('confidence', 0.85)
            })
        
        return ensemble_preds


# ============================================================
# Anomaly Detector
# ============================================================

class AnomalyDetector:
    """Detect anomalous satellite behavior"""
    
    def __init__(self, threshold_sigma: float = 3.0):
        self.threshold = threshold_sigma
        self.predictor = TrajectoryPredictor()
    
    def detect_anomalies(
        self,
        state_history: np.ndarray,
        recent_states: np.ndarray
    ) -> List[dict]:
        """
        Detect anomalies in recent satellite states
        
        Args:
            state_history: Historical normal behavior
            recent_states: Recent observations to check
        
        Returns:
            List of detected anomalies
        """
        # Predict expected behavior
        predictions = self.predictor.predict_trajectory(
            state_history,
            steps_ahead=len(recent_states)
        )
        
        anomalies = []
        
        for i, (pred, actual) in enumerate(zip(predictions, recent_states)):
            pred_pos = np.array([
                pred['position']['x'],
                pred['position']['y'],
                pred['position']['z']
            ])
            
            actual_pos = actual[:3]  # x, y, z
            
            # Compute deviation
            deviation = np.linalg.norm(actual_pos - pred_pos)
            
            # Check if anomalous
            if deviation > self.threshold * 10:  # 10 km threshold per sigma
                anomalies.append({
                    'timestep': i,
                    'timestamp': pred['timestamp'],
                    'deviation_km': float(deviation),
                    'expected_position': pred['position'],
                    'actual_position': {
                        'x': float(actual_pos[0]),
                        'y': float(actual_pos[1]),
                        'z': float(actual_pos[2])
                    },
                    'severity': 'HIGH' if deviation > 50 else 'MEDIUM',
                    'possible_causes': self._diagnose_anomaly(deviation, actual - pred_pos[:6])
                })
        
        return anomalies
    
    def _diagnose_anomaly(self, deviation: float, state_diff: np.ndarray) -> List[str]:
        """Diagnose possible causes of anomaly"""
        causes = []
        
        if deviation > 100:
            causes.append("Possible maneuver or thruster firing")
        
        if abs(state_diff[5]) > 0.5:  # vz change
            causes.append("Altitude change detected")
        
        if np.linalg.norm(state_diff[3:6]) > 1.0:
            causes.append("Significant velocity change")
        
        return causes if causes else ["Unknown anomaly"]


# Export
__all__ = [
    'TrajectoryLSTM',
    'TrajectoryPredictor',
    'EnsemblePredictor',
    'AnomalyDetector'
]
