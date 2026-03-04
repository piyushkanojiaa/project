"""
AI Reasoning Engine - LangChain Integration

Natural language reasoning for conjunction analysis and recommendations
"""

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.llms import Ollama
from langchain.memory import ConversationBufferMemory
from typing import Dict, List, Optional
from datetime import datetime
import json

# ============================================================
# AI Reasoning Engine
# ============================================================

class ConjunctionReasoningEngine:
    """AI-powered reasoning for conjunction events"""
    
    def __init__(self, model: str = "llama3"):
        """Initialize AI reasoning engine"""
        self.llm = Ollama(
            model=model,
            temperature=0.3,  # Lower temperature for more factual responses
            top_p=0.9
        )
        
        # Initialize memory for context
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Create reasoning chain
        self.reasoning_chain = self._create_reasoning_chain()
        self.maneuver_chain = self._create_maneuver_chain()
        self.risk_chain = self._create_risk_assessment_chain()
    
    def _create_reasoning_chain(self) -> LLMChain:
        """Create main reasoning chain"""
        template = """You are an expert space operations analyst specializing in satellite collision avoidance.

Conjunction Event Data:
- Satellite: {satellite_name} (Type: {satellite_type})
- Debris Object: {debris_name}
- Time to Closest Approach (TCA): {time_to_tca} hours
- Miss Distance: {miss_distance} km
- Probability of Collision: {probability:.6f} ({probability_percent}%)
- Relative Velocity: {relative_velocity} km/s
- Current Status: {status}
- Risk Level: {risk_level}

Historical Context:
{historical_data}

Satellite Mission Profile:
{mission_profile}

Based on this information, provide:

1. **Risk Assessment**: Evaluate the severity and urgency
2. **Recommended Action**: What should operators do?
3. **Timing**: When should action be taken?
4. **Maneuver Requirements**: If evasive action needed, specify delta-v
5. **Confidence**: Your confidence level in this recommendation (0-100%)
6. **Alternative Options**: Other possible courses of action
7. **Monitoring Plan**: What to watch for in the next 24-48 hours

Be specific, actionable, and explain your reasoning clearly.

Analysis:"""

        return LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=[
                    "satellite_name", "satellite_type", "debris_name",
                    "time_to_tca", "miss_distance", "probability",
                    "probability_percent", "relative_velocity", "status",
                    "risk_level", "historical_data", "mission_profile"
                ],
                template=template
            )
        )
    
    def _create_maneuver_chain(self) -> LLMChain:
        """Create maneuver planning chain"""
        template = """You are a spacecraft propulsion expert calculating optimal collision avoidance maneuvers.

Conjunction Parameters:
- Miss Distance: {miss_distance} km
- Relative Velocity: {relative_velocity} km/s
- Time Until TCA: {time_to_tca} hours
- Collision Probability: {probability}
- Satellite Mass: {satellite_mass} kg
- Available Propellant: {available_propellant} kg
- Thruster ISP: {thruster_isp} seconds

Calculate and provide:

1. **Required Delta-V**: Minimum velocity change needed (m/s)
2. **Burn Duration**: How long to fire thrusters
3. **Propellant Consumption**: Expected fuel usage (kg)
4. **Optimal Burn Time**: When to execute maneuver (hours before TCA)
5. **Burn Direction**: Which direction to thrust (radial, tangential, normal)
6. **Safety Margin**: Additional delta-v for safety buffer
7. **Post-Maneuver Trajectory**: Expected new orbit parameters
8. **Recovery Plan**: How to return to nominal orbit

Provide calculations and reasoning:"""

        return LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=[
                    "miss_distance", "relative_velocity", "time_to_tca",
                    "probability", "satellite_mass", "available_propellant",
                    "thruster_isp"
                ],
                template=template
            )
        )
    
    def _create_risk_assessment_chain(self) -> LLMChain:
        """Create risk assessment chain"""
        template = """You are a risk analyst evaluating satellite collision scenarios.

Current Situation:
- Conjunction ID: {conjunction_id}
- Satellite: {satellite_name} (Critical Mission: {is_critical})
- Miss Distance: {miss_distance} km
- Probability: {probability}
- Debris Size: {debris_size} (Estimated)

Risk Factors:
{risk_factors}

Similar Historical Events:
{similar_events}

Assess and categorize:

1. **Overall Risk Score**: 0-100 scale
2. **Risk Category**: CRITICAL / HIGH / MEDIUM / LOW
3. **Key Risk Drivers**: What makes this dangerous?
4. **Uncertainty Factors**: What unknowns exist?
5. **Impact Assessment**: What happens if collision occurs?
6. **Decision Urgency**: How quickly must we decide?
7. **Recommended Escalation**: Who needs to be notified?

Risk Analysis:"""

        return LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=[
                    "conjunction_id", "satellite_name", "is_critical",
                    "miss_distance", "probability", "debris_size",
                    "risk_factors", "similar_events"
                ],
                template=template
            )
        )
    
    async def analyze_conjunction(
        self,
        conjunction_data: Dict,
        historical_context: Optional[List[Dict]] = None,
        mission_data: Optional[Dict] = None
    ) -> Dict:
        """
        Perform comprehensive AI analysis of conjunction event
        
        Args:
            conjunction_data: Conjunction event details
            historical_context: Similar past events
            mission_data: Satellite mission information
            
        Returns:
            Detailed analysis with recommendations
        """
        # Prepare historical data summary
        historical_summary = "No similar historical events found."
        if historical_context:
            historical_summary = self._format_historical_data(historical_context)
        
        # Prepare mission profile
        mission_summary = "Standard LEO satellite"
        if mission_data:
            mission_summary = self._format_mission_data(mission_data)
        
        # Calculate probability percentage
        prob_percent = conjunction_data.get('probability', 0) * 100
        
        # Run reasoning chain
        analysis = await self.reasoning_chain.arun(
            satellite_name=conjunction_data.get('satellite_name'),
            satellite_type=conjunction_data.get('satellite_type', 'UNKNOWN'),
            debris_name=conjunction_data.get('debris_name'),
            time_to_tca=conjunction_data.get('time_to_tca_hours'),
            miss_distance=conjunction_data.get('miss_distance'),
            probability=conjunction_data.get('probability'),
            probability_percent=f"{prob_percent:.4f}",
            relative_velocity=conjunction_data.get('relative_velocity'),
            status=conjunction_data.get('status'),
            risk_level=conjunction_data.get('risk_level'),
            historical_data=historical_summary,
            mission_profile=mission_summary
        )
        
        return {
            "conjunction_id": conjunction_data.get('id'),
            "timestamp": datetime.utcnow().isoformat(),
            "analysis": analysis,
            "confidence": self._extract_confidence(analysis),
            "recommended_action": self._extract_action(analysis),
            "reasoning": "AI-powered analysis using LLaMA 3"
        }
    
    async def plan_maneuver(
        self,
        conjunction_data: Dict,
        satellite_specs: Dict
    ) -> Dict:
        """
        Calculate optimal collision avoidance maneuver
        
        Args:
            conjunction_data: Conjunction details
            satellite_specs: Satellite propulsion specifications
            
        Returns:
            Maneuver plan with burn calculations
        """
        maneuver_plan = await self.maneuver_chain.arun(
            miss_distance=conjunction_data.get('miss_distance'),
            relative_velocity=conjunction_data.get('relative_velocity'),
            time_to_tca=conjunction_data.get('time_to_tca_hours'),
            probability=conjunction_data.get('probability'),
            satellite_mass=satellite_specs.get('mass', 1000),
            available_propellant=satellite_specs.get('propellant_kg', 50),
            thruster_isp=satellite_specs.get('isp', 220)
        )
        
        return {
            "conjunction_id": conjunction_data.get('id'),
            "maneuver_plan": maneuver_plan,
            "calculated_at": datetime.utcnow().isoformat(),
            "requires_approval": True
        }
    
    async def assess_risk(
        self,
        conjunction_data: Dict,
        similar_events: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Perform detailed risk assessment
        
        Args:
            conjunction_data: Conjunction details
            similar_events: Historical similar conjunctions
            
        Returns:
            Risk assessment with scoring
        """
        # Format similar events
        similar_summary = "No similar events in database"
        if similar_events:
            similar_summary = "\n".join([
                f"- {e.get('satellite_name')} vs {e.get('debris_name')}: "
                f"Miss {e.get('miss_distance')}km, Outcome: {e.get('outcome')}"
                for e in similar_events[:5]
            ])
        
        # Identify risk factors
        risk_factors = self._identify_risk_factors(conjunction_data)
        
        risk_assessment = await self.risk_chain.arun(
            conjunction_id=conjunction_data.get('id'),
            satellite_name=conjunction_data.get('satellite_name'),
            is_critical=conjunction_data.get('is_critical_mission', False),
            miss_distance=conjunction_data.get('miss_distance'),
            probability=conjunction_data.get('probability'),
            debris_size=conjunction_data.get('debris_size', 'Unknown'),
            risk_factors=risk_factors,
            similar_events=similar_summary
        )
        
        return {
            "conjunction_id": conjunction_data.get('id'),
            "risk_assessment": risk_assessment,
            "assessed_at": datetime.utcnow().isoformat(),
            "risk_score": self._extract_risk_score(risk_assessment)
        }
    
    def _format_historical_data(self, events: List[Dict]) -> str:
        """Format historical events for context"""
        if not events:
            return "No historical data available"
        
        summary = f"Found {len(events)} similar conjunction events:\n"
        for i, event in enumerate(events[:5], 1):
            summary += f"\n{i}. {event.get('satellite_name')} vs {event.get('debris_name')}\n"
            summary += f"   Miss: {event.get('miss_distance')}km, "
            summary += f"PoC: {event.get('probability'):.6f}, "
            summary += f"Outcome: {event.get('outcome', 'SAFE_PASS')}\n"
        
        return summary
    
    def _format_mission_data(self, mission: Dict) -> str:
        """Format mission data for context"""
        return f"""
Mission Type: {mission.get('type', 'Unknown')}
Criticality: {'CRITICAL' if mission.get('is_critical') else 'STANDARD'}
Operational Status: {mission.get('status', 'ACTIVE')}
Maneuver Capability: {mission.get('can_maneuver', 'Unknown')}
Propellant Remaining: {mission.get('propellant_percent', 'Unknown')}%
        """.strip()
    
    def _identify_risk_factors(self, conjunction: Dict) -> str:
        """Identify key risk factors"""
        factors = []
        
        if conjunction.get('miss_distance', 999) < 1.0:
            factors.append("- Very close approach (< 1km)")
        
        if conjunction.get('probability', 0) > 0.0001:
            factors.append("- High collision probability (> 1e-4)")
        
        if conjunction.get('relative_velocity', 0) > 10:
            factors.append("- High relative velocity (> 10 km/s)")
        
        if conjunction.get('time_to_tca_hours', 999) < 24:
            factors.append("- Limited reaction time (< 24 hours)")
        
        if conjunction.get('is_critical_mission'):
            factors.append("- Critical mission satellite")
        
        return "\n".join(factors) if factors else "No significant risk factors identified"
    
    def _extract_confidence(self, analysis: str) -> int:
        """Extract confidence score from analysis text"""
        # Simple extraction - in production, use more robust parsing
        import re
        match = re.search(r'confidence[:\s]+(\d+)%', analysis.lower())
        if match:
            return int(match.group(1))
        return 75  # Default confidence
    
    def _extract_action(self, analysis: str) -> str:
        """Extract recommended action from analysis"""
        # Simple extraction
        if "maneuver" in analysis.lower() or "avoid" in analysis.lower():
            return "MANEUVER_REQUIRED"
        elif "monitor" in analysis.lower():
            return "CONTINUE_MONITORING"
        else:
            return "NO_ACTION_REQUIRED"
    
    def _extract_risk_score(self, assessment: str) -> int:
        """Extract risk score from assessment"""
        import re
        match = re.search(r'risk score[:\s]+(\d+)', assessment.lower())
        if match:
            return int(match.group(1))
        return 50  # Default


# ============================================================
# Simple Reasoning (Fallback without LLM)
# ============================================================

class SimpleReasoningEngine:
    """Rule-based reasoning as fallback"""
    
    @staticmethod
    def analyze_conjunction(conjunction_data: Dict) -> Dict:
        """Simple rule-based analysis"""
        miss_distance = conjunction_data.get('miss_distance', 999)
        probability = conjunction_data.get('probability', 0)
        time_to_tca = conjunction_data.get('time_to_tca_hours', 999)
        
        # Simple decision tree
        if probability > 0.001:  # > 1e-3
            action = "MANEUVER_REQUIRED"
            urgency = "CRITICAL"
        elif probability > 0.0001:  # > 1e-4
            action = "PREPARE_MANEUVER"
            urgency = "HIGH"
        elif miss_distance < 1.0:
            action = "CONTINUE_MONITORING"
            urgency = "MEDIUM"
        else:
            action = "NO_ACTION_REQUIRED"
            urgency = "LOW"
        
        return {
            "recommended_action": action,
            "urgency": urgency,
            "reason": f"Miss: {miss_distance}km, PoC: {probability:.6f}",
            "confidence": 60,
            "timing": "IMMEDIATE" if time_to_tca < 12 else "WITHIN_24H"
        }


# Export
__all__ = ['ConjunctionReasoningEngine', 'SimpleReasoningEngine']
