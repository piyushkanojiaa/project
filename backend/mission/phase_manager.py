"""
Mission Phase Manager

Manages satellite mission phases and enforces phase-specific policies
"""

from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel
import yaml
import os

# ============================================================
# Mission Phase Definitions
# ============================================================

class MissionPhase(str, Enum):
    """Satellite mission phases"""
    LAUNCH = "launch"
    DEPLOYMENT = "deployment"
    NOMINAL_OPS = "nominal_ops"
    PAYLOAD_OPS = "payload_ops"
    SAFE_MODE = "safe_mode"


class ActionType(str, Enum):
    """Types of actions that can be taken"""
    LOG_ONLY = "log_only"
    ALERT = "alert"
    STABILIZE = "stabilize"
    RECOVER = "recover"
    OPTIMIZE = "optimize"
    FULL_RECOVERY = "full_recovery"
    PAYLOAD_SAFE = "payload_safe"
    SURVIVAL_ONLY = "survival_only"


# ============================================================
# Phase Policy
# ============================================================

class PhasePolicy(BaseModel):
    """Policy configuration for a mission phase"""
    phase: MissionPhase
    description: str
    priority: str  # What's most important in this phase
    constraint: str  # What's limited in this phase
    
    # Action limits
    max_actions: int  # Max actions per hour (0 = unlimited if -1)
    allowed_actions: List[ActionType]
    
    # Resource limits
    power_change_limit: float  # Max % change in power consumption
    attitude_change_allowed: bool  # Can satellite attitude change?
    maneuver_allowed: bool  # Can perform orbital maneuvers?
    payload_operations_allowed: bool  # Can operate payload?
    
    # Safety settings
    require_ground_approval: bool  # Require operator approval?
    auto_recovery_enabled: bool  # Allow automatic recovery?


# ============================================================
# Satellite Phase State
# ============================================================

class SatellitePhaseState(BaseModel):
    """Current phase state for a satellite"""
    satellite_id: str
    satellite_name: str
    current_phase: MissionPhase
    phase_start_time: datetime
    phase_duration_hours: float
    actions_taken_this_hour: int
    last_action_time: Optional[datetime] = None
    override_active: bool = False  # Emergency override
    override_reason: Optional[str] = None


# ============================================================
# Phase Manager
# ============================================================

class MissionPhaseManager:
    """
    Manages mission phases for satellites
    Enforces phase-specific policies
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize phase manager
        
        Args:
            config_path: Path to phases.yaml config file
        """
        self.satellite_states: Dict[str, SatellitePhaseState] = {}
        self.policies: Dict[MissionPhase, PhasePolicy] = {}
        
        # Load policies from config or use defaults
        if config_path and os.path.exists(config_path):
            self._load_policies_from_file(config_path)
        else:
            self._load_default_policies()
    
    def _load_default_policies(self):
        """Load default phase policies"""
        self.policies = {
            MissionPhase.LAUNCH: PhasePolicy(
                phase=MissionPhase.LAUNCH,
                description="T-0 to orbit insertion",
                priority="System survival",
                constraint="Minimal actions to avoid destabilization",
                max_actions=0,
                allowed_actions=[ActionType.LOG_ONLY],
                power_change_limit=0.0,
                attitude_change_allowed=False,
                maneuver_allowed=False,
                payload_operations_allowed=False,
                require_ground_approval=True,
                auto_recovery_enabled=False
            ),
            
            MissionPhase.DEPLOYMENT: PhasePolicy(
                phase=MissionPhase.DEPLOYMENT,
                description="Orbit insertion to systems checkout",
                priority="Safe deployment of components",
                constraint="Limited responses, avoid disruption",
                max_actions=3,
                allowed_actions=[ActionType.LOG_ONLY, ActionType.ALERT, ActionType.STABILIZE],
                power_change_limit=10.0,
                attitude_change_allowed=True,
                maneuver_allowed=False,
                payload_operations_allowed=False,
                require_ground_approval=True,
                auto_recovery_enabled=True
            ),
            
            MissionPhase.NOMINAL_OPS: PhasePolicy(
                phase=MissionPhase.NOMINAL_OPS,
                description="Normal operational phase",
                priority="Performance optimization",
                constraint="None (full autonomy)",
                max_actions=-1,  # Unlimited
                allowed_actions=[
                    ActionType.LOG_ONLY,
                    ActionType.ALERT,
                    ActionType.RECOVER,
                    ActionType.OPTIMIZE,
                    ActionType.FULL_RECOVERY
                ],
                power_change_limit=50.0,
                attitude_change_allowed=True,
                maneuver_allowed=True,
                payload_operations_allowed=True,
                require_ground_approval=False,
                auto_recovery_enabled=True
            ),
            
            MissionPhase.PAYLOAD_OPS: PhasePolicy(
                phase=MissionPhase.PAYLOAD_OPS,
                description="Active science/mission operations",
                priority="Science data collection",
                constraint="Careful with power/attitude changes",
                max_actions=5,
                allowed_actions=[
                    ActionType.LOG_ONLY,
                    ActionType.ALERT,
                    ActionType.PAYLOAD_SAFE
                ],
                power_change_limit=20.0,
                attitude_change_allowed=False,  # Don't disrupt pointing
                maneuver_allowed=False,
                payload_operations_allowed=True,
                require_ground_approval=True,
                auto_recovery_enabled=True
            ),
            
            MissionPhase.SAFE_MODE: PhasePolicy(
                phase=MissionPhase.SAFE_MODE,
                description="Critical failure or emergency",
                priority="System survival only",
                constraint="Minimal subsystem activation",
                max_actions=1,
                allowed_actions=[ActionType.LOG_ONLY, ActionType.SURVIVAL_ONLY],
                power_change_limit=5.0,
                attitude_change_allowed=False,
                maneuver_allowed=False,
                payload_operations_allowed=False,
                require_ground_approval=True,
                auto_recovery_enabled=True
            )
        }
    
    def _load_policies_from_file(self, config_path: str):
        """Load policies from YAML file"""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            for phase_name, policy_data in config.get('phases', {}).items():
                phase = MissionPhase(phase_name.lower())
                self.policies[phase] = PhasePolicy(
                    phase=phase,
                    **policy_data
                )
        except Exception as e:
            print(f"⚠️  Failed to load config, using defaults: {e}")
            self._load_default_policies()
    
    def register_satellite(
        self,
        satellite_id: str,
        satellite_name: str,
        initial_phase: MissionPhase = MissionPhase.NOMINAL_OPS
    ):
        """Register a satellite for phase tracking"""
        self.satellite_states[satellite_id] = SatellitePhaseState(
            satellite_id=satellite_id,
            satellite_name=satellite_name,
            current_phase=initial_phase,
            phase_start_time=datetime.utcnow(),
            phase_duration_hours=0,
            actions_taken_this_hour=0
        )
        
        print(f"✓ Registered {satellite_name} in {initial_phase.value} phase")
    
    def set_phase(
        self,
        satellite_id: str,
        new_phase: MissionPhase,
        reason: Optional[str] = None
    ):
        """
        Change satellite mission phase
        
        Args:
            satellite_id: Satellite ID
            new_phase: New mission phase
            reason: Reason for phase change
        """
        if satellite_id not in self.satellite_states:
            raise ValueError(f"Satellite {satellite_id} not registered")
        
        state = self.satellite_states[satellite_id]
        old_phase = state.current_phase
        
        state.current_phase = new_phase
        state.phase_start_time = datetime.utcnow()
        state.phase_duration_hours = 0
        state.actions_taken_this_hour = 0
        
        print(f"✓ {state.satellite_name}: {old_phase.value} → {new_phase.value}")
        if reason:
            print(f"  Reason: {reason}")
    
    def can_take_action(
        self,
        satellite_id: str,
        action_type: ActionType
    ) -> tuple[bool, Optional[str]]:
        """
        Check if action is allowed in current phase
        
        Args:
            satellite_id: Satellite ID
            action_type: Type of action
            
        Returns:
            (allowed, reason_if_not_allowed)
        """
        if satellite_id not in self.satellite_states:
            return False, "Satellite not registered"
        
        state = self.satellite_states[satellite_id]
        
        # Check for emergency override
        if state.override_active:
            return True, None
        
        # Get policy for current phase
        policy = self.policies[state.current_phase]
        
        # Check if action type is allowed
        if action_type not in policy.allowed_actions:
            return False, f"Action {action_type.value} not allowed in {state.current_phase.value} phase"
        
        # Check action rate limit
        if policy.max_actions > 0:
            if state.actions_taken_this_hour >= policy.max_actions:
                return False, f"Max actions ({policy.max_actions}/hour) exceeded"
        
        return True, None
    
    def record_action(
        self,
        satellite_id: str,
        action_type: ActionType
    ):
        """Record that an action was taken"""
        if satellite_id in self.satellite_states:
            state = self.satellite_states[satellite_id]
            state.actions_taken_this_hour += 1
            state.last_action_time = datetime.utcnow()
    
    def activate_emergency_override(
        self,
        satellite_id: str,
        reason: str
    ):
        """
        Activate emergency override to bypass phase restrictions
        
        Args:
            satellite_id: Satellite ID
            reason: Reason for override
        """
        if satellite_id in self.satellite_states:
            state = self.satellite_states[satellite_id]
            state.override_active = True
            state.override_reason = reason
            
            print(f"🚨 EMERGENCY OVERRIDE activated for {state.satellite_name}")
            print(f"   Reason: {reason}")
    
    def deactivate_override(self, satellite_id: str):
        """Deactivate emergency override"""
        if satellite_id in self.satellite_states:
            state = self.satellite_states[satellite_id]
            state.override_active = False
            state.override_reason = None
            
            print(f"✓ Override deactivated for {state.satellite_name}")
    
    def get_phase_constraints(
        self,
        satellite_id: str
    ) -> Optional[PhasePolicy]:
        """Get policy constraints for satellite's current phase"""
        if satellite_id not in self.satellite_states:
            return None
        
        state = self.satellite_states[satellite_id]
        return self.policies[state.current_phase]
    
    def get_satellite_state(
        self,
        satellite_id: str
    ) -> Optional[SatellitePhaseState]:
        """Get current phase state for satellite"""
        return self.satellite_states.get(satellite_id)
    
    def get_all_states(self) -> Dict[str, SatellitePhaseState]:
        """Get all satellite phase states"""
        return self.satellite_states.copy()
    
    def get_phase_summary(self) -> str:
        """Generate human-readable phase summary"""
        if not self.satellite_states:
            return "No satellites registered"
        
        lines = []
        lines.append("=" * 70)
        lines.append("MISSION PHASE STATUS")
        lines.append("=" * 70)
        
        for state in self.satellite_states.values():
            policy = self.policies[state.current_phase]
            
            lines.append(f"\n{state.satellite_name} ({state.satellite_id})")
            lines.append(f"  Phase: {state.current_phase.value.upper()}")
            lines.append(f"  Priority: {policy.priority}")
            lines.append(f"  Constraint: {policy.constraint}")
            lines.append(f"  Actions This Hour: {state.actions_taken_this_hour}/{policy.max_actions if policy.max_actions > 0 else '∞'}")
            
            if state.override_active:
                lines.append(f"  ⚠️  EMERGENCY OVERRIDE: {state.override_reason}")
            
            lines.append(f"  Allowed Actions: {', '.join(a.value for a in policy.allowed_actions)}")
        
        lines.append("\n" + "=" * 70)
        
        return "\n".join(lines)


# ============================================================
# Global Phase Manager
# ============================================================

global_phase_manager = MissionPhaseManager()


# Export
__all__ = [
    'MissionPhase',
    'ActionType',
    'PhasePolicy',
    'SatellitePhaseState',
    'MissionPhaseManager',
    'global_phase_manager'
]
