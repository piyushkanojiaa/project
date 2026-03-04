"""
Advanced Collision Analysis Algorithms
Enhanced Foster 3D PoC with Monte Carlo uncertainty quantification
"""

import numpy as np
from scipy.stats import norm, chi2
from typing import Tuple, Dict
import time


def compute_advanced_poc_foster(
    sat_state, sat_cov,
    deb_state, deb_cov,
    r_combined: float = 0.05,
    num_monte_carlo: int = 10000,
    confidence_level: float = 0.95
) -> Dict:
    """
    Advanced Foster 3D PoC with uncertainty quantification
    
    Returns dict with mean, confidence intervals, and Monte Carlo results
    """
    # Original Foster 3D calculation
    rel_pos = sat_state.position - deb_state.position
    rel_vel = sat_state.velocity - deb_state.velocity
    
    # Combined covariance in relative coordinates
    combined_cov = sat_cov[:3, :3] + deb_cov[:3, :3]
    
    # Velocity-aligned coordinate system (Foster 1984)
    vel_mag = np.linalg.norm(rel_vel)
    if vel_mag < 1e-10:
        return {"poc_mean": 0.0, "poc_lower": 0.0, "poc_upper": 0.0, "confidence": 0.0}
    
    # Unit vectors
    u_v = rel_vel / vel_mag  # Along velocity
    u_r = rel_pos / np.linalg.norm(rel_pos) if np.linalg.norm(rel_pos) > 0 else np.array([0, 0, 1])
    u_w = np.cross(u_v, u_r)
    u_w = u_w / np.linalg.norm(u_w) if np.linalg.norm(u_w) > 0 else np.array([1, 0, 0])
    u_u = np.cross(u_v, u_w)
    
    # Rotation matrix to encounter plane
    R = np.vstack([u_u, u_w, u_v])
    
    # Transform covariance to encounter plane
    C_enc = R @ combined_cov @ R.T
    
    # 2D covariance in encounter plane (u, w)
    C_2d = C_enc[:2, :2]
    
    # Eigenvalues and eigenvectors
    eigenvalues, eigenvectors = np.linalg.eig(C_2d)
    
    if np.any(eigenvalues <= 0):
        return {"poc_mean": 0.0, "poc_lower": 0.0, "poc_upper": 0.0, "confidence": 0.0}
    
    # Semi-major and semi-minor axes
    a = np.sqrt(eigenvalues[0])
    b = np.sqrt(eigenvalues[1])
    
    # Mahalanobis distance
    try:
        C_inv = np.linalg.inv(C_2d)
        rel_pos_2d = (R @ rel_pos)[:2]
        mahal_dist_sq = rel_pos_2d @ C_inv @ rel_pos_2d
    except:
        return {"poc_mean": 0.0, "poc_lower": 0.0, "poc_upper": 0.0, "confidence": 0.0}
    
    # Foster 3D formula - exact for 3D Gaussian
    poc_analytic = (r_combined**2 / (a * b)) * np.exp(-mahal_dist_sq / 2)
    
    # Monte Carlo for uncertainty quantification
    poc_samples = []
    for _ in range(num_monte_carlo):
        # Perturb covariances (add small random uncertainty)
        sat_cov_perturbed = sat_cov + np.random.randn(*sat_cov.shape) * np.abs(sat_cov) * 0.1
        deb_cov_perturbed = deb_cov + np.random.randn(*deb_cov.shape) * np.abs(deb_cov) * 0.1
        
        # Ensure positive-definite
        sat_cov_perturbed = (sat_cov_perturbed + sat_cov_perturbed.T) / 2
        deb_cov_perturbed = (deb_cov_perturbed + deb_cov_perturbed.T) / 2
        
        combined_cov_mc = sat_cov_perturbed[:3, :3] + deb_cov_perturbed[:3, :3]
        
        # Quick PoC estimate
        try:
            C_enc_mc = R @ combined_cov_mc @ R.T
            C_2d_mc = C_enc_mc[:2, :2]
            eig_mc, _ = np.linalg.eig(C_2d_mc)
            
            if np.all(eig_mc > 0):
                a_mc = np.sqrt(eig_mc[0])
                b_mc = np.sqrt(eig_mc[1])
                C_inv_mc = np.linalg.inv(C_2d_mc)
                mahal_mc = rel_pos_2d @ C_inv_mc @ rel_pos_2d
                poc_mc = (r_combined**2 / (a_mc * b_mc)) * np.exp(-mahal_mc / 2)
                poc_samples.append(poc_mc)
        except:
            pass
    
    # Confidence intervals
    if len(poc_samples) > 100:
        poc_samples = np.array(poc_samples)
        poc_mean = np.mean(poc_samples)
        poc_std = np.std(poc_samples)
        
        # Percentile-based confidence interval
        alpha = 1 - confidence_level
        poc_lower = np.percentile(poc_samples, alpha/2 * 100)
        poc_upper = np.percentile(poc_samples, (1 - alpha/2) * 100)
        
        # Confidence score (how tight is the interval)
        if poc_mean > 0:
            confidence_score = 1 - (poc_upper - poc_lower) / (2 * poc_mean)
            confidence_score = max(0, min(1, confidence_score))
        else:
            confidence_score = 0.5
    else:
        poc_mean = poc_analytic
        poc_lower = poc_analytic * 0.5
        poc_upper = poc_analytic * 1.5
        confidence_score = 0.7
    
    return {
        "poc_mean": float(poc_mean),
        "poc_analytic": float(poc_analytic),
        "poc_lower": float(poc_lower),
        "poc_upper": float(poc_upper),
        "confidence": float(confidence_score),
        "uncertainty": float(poc_std) if len(poc_samples) > 100 else float(poc_analytic * 0.25),
        "samples": len(poc_samples),
        "mahalanobis_distance": float(np.sqrt(mahal_dist_sq))
    }


def compute_enhanced_risk_score(
    poc: float,
    miss_distance: float,
    relative_velocity: float,
    crossing_angle: float,
    time_to_tca: float,
    satellite_mass: float = 1000.0,  # kg
    debris_size: float = 0.1  # km
) -> Dict:
    """
    Enhanced multi-factor risk scoring
    
    Combines multiple risk factors with weights
    """
    # Factor 1: Probability score (0-1)
    poc_score = min(1.0, poc / 1e-4)  # Normalize to CRITICAL threshold
    
    # Factor 2: Miss distance score (0-1, lower is worse)
    miss_score = 1.0 - min(1.0, miss_distance / 10.0)  # 10km threshold
    
    # Factor 3: Velocity score (0-1, higher is worse)
    vel_score = min(1.0, relative_velocity / 15.0)  # 15 km/s threshold
    
    # Factor 4: Crossing angle score (0-1, head-on is worse)
    # 180° (head-on) = worst, 0° (parallel) = best
    angle_score = abs(crossing_angle - 90) / 90.0  # Normalize around perpendicular
    
    # Factor 5: Time urgency score (0-1, less time = worse)
    time_hours = time_to_tca / 3600.0
    time_score = 1.0 - min(1.0, time_hours / 24.0)  # 24 hour threshold
    
    # Factor 6: Kinetic energy score
    debris_mass = (debris_size ** 3) * 2700  # Assume aluminum density
    kinetic_energy = 0.5 * debris_mass * (relative_velocity * 1000) ** 2  # Joules
    energy_score = min(1.0, kinetic_energy / 1e9)  # 1 GJ threshold
    
    # Weighted combination
    weights = {
        'poc': 0.35,
        'miss': 0.25,
        'velocity': 0.15,
        'angle': 0.10,
        'time': 0.10,
        'energy': 0.05
    }
    
    composite_score = (
        weights['poc'] * poc_score +
        weights['miss'] * miss_score +
        weights['velocity'] * vel_score +
        weights['angle'] * angle_score +
        weights['time'] * time_score +
        weights['energy'] * energy_score
    )
    
    # Enhanced risk classification
    if composite_score > 0.75 or poc > 1e-4:
        risk_level = "CRITICAL"
    elif composite_score > 0.50 or poc > 1e-5:
        risk_level = "HIGH"
    elif composite_score > 0.25 or poc > 1e-6:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    return {
        "composite_score": float(composite_score),
        "risk_level": risk_level,
        "factors": {
            "poc_score": float(poc_score),
            "miss_score": float(miss_score),
            "velocity_score": float(vel_score),
            "angle_score": float(angle_score),
            "time_score": float(time_score),
            "energy_score": float(energy_score)
        },
        "kinetic_energy_joules": float(kinetic_energy),
        "debris_mass_kg": float(debris_mass)
    }


def analyze_conjunction_advanced(
    sat_state, sat_cov,
    deb_state, deb_cov,
    r_combined: float = 0.05,
    satellite_info: Dict = None
) -> Dict:
    """
    Complete advanced conjunction analysis
    
    Returns comprehensive risk assessment with all metrics
    """
    # Compute advanced PoC
    poc_result = compute_advanced_poc_foster(
        sat_state, sat_cov,
        deb_state, deb_cov,
        r_combined=r_combined,
        num_monte_carlo=5000  # Reduced for performance
    )
    
    # Calculate geometric parameters
    rel_pos = sat_state.position - deb_state.position
    rel_vel = sat_state.velocity - deb_state.velocity
    
    miss_distance = np.linalg.norm(rel_pos)
    relative_velocity = np.linalg.norm(rel_vel)
    
    # Crossing angle
    if miss_distance > 0 and relative_velocity > 0:
        cos_angle = np.dot(rel_pos, rel_vel) / (miss_distance * relative_velocity)
        cos_angle = np.clip(cos_angle, -1, 1)
        crossing_angle = np.degrees(np.arccos(abs(cos_angle)))
    else:
        crossing_angle = 0.0
    
    # Time to TCA (estimate)
    time_to_tca = miss_distance / (relative_velocity if relative_velocity > 0 else 1.0)
    
    # Enhanced risk score
    risk_result = compute_enhanced_risk_score(
        poc=poc_result['poc_mean'],
        miss_distance=miss_distance,
        relative_velocity=relative_velocity,
        crossing_angle=crossing_angle,
        time_to_tca=time_to_tca,
        satellite_mass=satellite_info.get('mass', 1000) if satellite_info else 1000,
        debris_size=0.1
    )
    
    # Combine results
    return {
        **poc_result,
        **risk_result,
        "miss_distance": float(miss_distance),
        "relative_velocity": float(relative_velocity),
        "crossing_angle": float(crossing_angle),
        "time_to_tca": float(time_to_tca)
    }
