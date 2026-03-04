"""
Enhanced Feature Extraction for ML Collision Prediction
Advanced features with dimensionality and physics-based engineering
"""

import numpy as np
from typing import List, Tuple


class AdvancedFeatureExtractor:
    """Extract sophisticated features for ML prediction"""
    
    @staticmethod
    def extract_enhanced_features(
        sat_state, sat_cov,
        deb_state, deb_cov,
        r_combined: float,
        crossing_angle: float,
        altitude: float,
        inclination_diff: float
    ) -> Tuple[List[float], List[str]]:
        """
        Extract 25+ advanced features for ML model
        
        Returns: (features, feature_names)
        """
        features = []
        feature_names = []
        
        # 1-3: Relative position components (normalized)
        rel_pos = sat_state.position - deb_state.position
        pos_mag = np.linalg.norm(rel_pos)
        rel_pos_norm = rel_pos / (pos_mag if pos_mag > 0 else 1.0)
        
        features.extend([
            float(rel_pos_norm[0]),
            float(rel_pos_norm[1]),
            float(rel_pos_norm[2])
        ])
        feature_names.extend(['rel_pos_x_norm', 'rel_pos_y_norm', 'rel_pos_z_norm'])
        
        # 4: Log miss distance (more ML-friendly)
        miss_distance = pos_mag
        features.append(float(np.log10(miss_distance + 1e-10)))
        feature_names.append('log_miss_distance')
        
        # 5-7: Relative velocity components (normalized)
        rel_vel = sat_state.velocity - deb_state.velocity
        vel_mag = np.linalg.norm(rel_vel)
        rel_vel_norm = rel_vel / (vel_mag if vel_mag > 0 else 1.0)
        
        features.extend([
            float(rel_vel_norm[0]),
            float(rel_vel_norm[1]),
            float(rel_vel_norm[2])
        ])
        feature_names.extend(['rel_vel_x_norm', 'rel_vel_y_norm', 'rel_vel_z_norm'])
        
        # 8: Log relative velocity
        features.append(float(np.log10(vel_mag + 1e-10)))
        feature_names.append('log_relative_velocity')
        
        # 9-10: Covariance eigenvalues (position)
        sat_cov_pos = sat_cov[:3, :3]
        deb_cov_pos = deb_cov[:3, :3]
        combined_cov = sat_cov_pos + deb_cov_pos
        
        try:
            eig_vals = np.linalg.eigvalsh(combined_cov)
            features.extend([
                float(np.log10(np.max(eig_vals) + 1e-10)),
                float(np.log10(np.min(eig_vals) + 1e-10))
            ])
        except:
            features.extend([0.0, 0.0])
        
        feature_names.extend(['log_max_eigenvalue', 'log_min_eigenvalue'])
        
        # 11: Covariance eccentricity
        if len(eig_vals) >= 2:
            eccentricity = 1 - (eig_vals[0] / (eig_vals[1] + 1e-10))
            features.append(float(eccentricity))
        else:
            features.append(0.0)
        feature_names.append('covariance_eccentricity')
        
        # 12: Combined radius (normalized)
        features.append(float(r_combined / miss_distance if miss_distance > 0 else 0.0))
        feature_names.append('radius_ratio')
        
        # 13: Crossing angle (radians, normalized)
        features.append(float(np.radians(crossing_angle) / np.pi))
        feature_names.append('crossing_angle_norm')
        
        # 14: Altitude (log-scaled)
        features.append(float(np.log10(altitude + 1e-10)))
        feature_names.append('log_altitude')
        
        # 15: Inclination difference (normalized)
        features.append(float(inclination_diff / 180.0))
        feature_names.append('inclination_diff_norm')
        
        # 16: Mahalanobis distance (if computable)
        try:
            C_inv = np.linalg.inv(combined_cov)
            mahal_dist = np.sqrt(rel_pos @ C_inv @ rel_pos)
            features.append(float(np.log10(mahal_dist + 1e-10)))
        except:
            features.append(0.0)
        feature_names.append('log_mahalanobis_distance')
        
        # 17: Velocity-position alignment
        if pos_mag > 0 and vel_mag > 0:
            alignment = abs(np.dot(rel_pos, rel_vel)) / (pos_mag * vel_mag)
            features.append(float(alignment))
        else:
            features.append(0.0)
        feature_names.append('velocity_position_alignment')
        
        # 18: Kinetic energy (log-scaled)
        # Assume debris mass proportional to size^3
        debris_mass = (0.1 ** 3) * 2700  # kg, aluminum density
        kinetic_energy = 0.5 * debris_mass * (vel_mag * 1000) ** 2  # Joules
        features.append(float(np.log10(kinetic_energy + 1e-10)))
        feature_names.append('log_kinetic_energy')
        
        # 19-20: Orbital energy approximation
        sat_pos_mag = np.linalg.norm(sat_state.position)
        deb_pos_mag = np.linalg.norm(deb_state.position)
        
        mu = 398600.4418  # Earth gravitational parameter (km^3/s^2)
        
        sat_orbital_energy = -mu / (2 * sat_pos_mag) if sat_pos_mag > 0 else 0
        deb_orbital_energy = -mu / (2 * deb_pos_mag) if deb_pos_mag > 0 else 0
        
        features.extend([
            float(sat_orbital_energy / 1000),  # Normalized
            float(deb_orbital_energy / 1000)
        ])
        feature_names.extend(['sat_orbital_energy_norm', 'deb_orbital_energy_norm'])
        
        # 21: Combined uncertainty (trace of covariance)
        uncertainty = np.trace(combined_cov)
        features.append(float(np.log10(uncertainty + 1e-10)))
        feature_names.append('log_combined_uncertainty')
        
        # 22: Position-velocity correlation
        try:
            full_cov = sat_cov + deb_cov
            pos_vel_corr = np.mean(full_cov[0:3, 3:6])
            features.append(float(pos_vel_corr))
        except:
            features.append(0.0)
        feature_names.append('position_velocity_correlation')
        
        # 23: Aspect ratio of uncertainty ellipsoid
        if len(eig_vals) >= 2:
            aspect_ratio = eig_vals[-1] / (eig_vals[0] + 1e-10)
            features.append(float(np.log10(aspect_ratio + 1e-10)))
        else:
            features.append(0.0)
        feature_names.append('log_aspect_ratio')
        
        # 24: Time to closest approach estimate
        tca_estimate = miss_distance / (vel_mag if vel_mag > 0 else 1.0)
        features.append(float(np.log10(tca_estimate + 1e-10)))
        feature_names.append('log_time_to_tca')
        
        # 25: Collision cross-section (geometric)
        collision_cross_section = np.pi * r_combined ** 2
        features.append(float(np.log10(collision_cross_section + 1e-10)))
        feature_names.append('log_collision_cross_section')
        
        return features, feature_names
    
    @staticmethod
    def validate_features(features: List[float]) -> List[float]:
        """
        Validate and clean feature vector
        - Replace NaN/Inf with 0
        - Clip extreme values
        """
        validated = []
        for f in features:
            if np.isnan(f) or np.isinf(f):
                validated.append(0.0)
            else:
                # Clip to reasonable range
                validated.append(float(np.clip(f, -100, 100)))
        
        return validated
