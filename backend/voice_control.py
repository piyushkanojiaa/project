"""
Voice Control System for Orbital Guard AI
Enables natural language mission control operations
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
import re
import json
from datetime import datetime

router = APIRouter()

class VoiceCommandParser:
    """Parse natural language commands into API calls"""
    
    COMMAND_PATTERNS = {
        'get_satellites': [
            r'(show|display|get|list)\s+(all\s+)?(the\s+)?satellites?',
            r'what\s+satellites?\s+(are|do\s+we\s+have)',
        ],
        'get_conjunctions': [
            r'(show|display|get|list)\s+(all\s+)?(the\s+)?conjunctions?',
            r'(what|show)\s+(are\s+)?(the\s+)?collision\s+risks?',
            r'(show|get)\s+close\s+approaches?',
        ],
        'analyze_risk': [
            r'analyze\s+risk\s+for\s+(\w+)',
            r'what\s+is\s+the\s+risk\s+for\s+(\w+)',
            r'check\s+(\w+)\s+risk',
        ],
        'plan_maneuver': [
            r'plan\s+(a\s+)?maneuver\s+for\s+(\w+)',
            r'calculate\s+maneuver\s+for\s+(\w+)',
            r'avoid\s+collision\s+for\s+(\w+)',
        ],
        'get_status': [
            r'(what|show)\s+(is\s+)?(the\s+)?status',
            r'system\s+status',
            r'health\s+check',
        ],
        'get_analytics': [
            r'(show|display|get)\s+(the\s+)?analytics',
            r'show\s+(me\s+)?(the\s+)?statistics',
        ],
        'help': [
            r'help',
            r'what\s+can\s+(i|you)\s+do',
            r'available\s+commands',
        ],
    }
    
    def parse(self, text: str) -> Dict[str, Any]:
        """Parse voice command into structured command"""
        text = text.lower().strip()
        
        for command, patterns in self.COMMAND_PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    return {
                        'command': command,
                        'params': list(match.groups()) if match.groups() else [],
                        'raw_text': text,
                        'timestamp': datetime.now().isoformat()
                    }
        
        return {
            'command': 'unknown',
            'raw_text': text,
            'timestamp': datetime.now().isoformat()
        }

class VoiceCommandExecutor:
    """Execute parsed voice commands"""
    
    @staticmethod
    async def execute(parsed: Dict[str, Any]) -> Dict[str, Any]:
        """Execute parsed voice command and return response"""
        command = parsed['command']
        params = parsed.get('params', [])
        
        if command == 'get_satellites':
            return {
                'status': 'success',
                'action': 'fetch_satellites',
                'message': 'Fetching satellite data',
                'endpoint': '/api/satellites',
                'speech': 'Displaying all satellites'
            }
        
        elif command == 'get_conjunctions':
            return {
                'status': 'success',
                'action': 'fetch_conjunctions',
                'message': 'Fetching conjunction data',
                'endpoint': '/api/conjunctions',
                'speech': 'Showing collision risks'
            }
        
        elif command == 'analyze_risk':
            satellite_id = params[0] if params else 'unknown'
            return {
                'status': 'success',
                'action': 'analyze_risk',
                'message': f'Analyzing risk for {satellite_id}',
                'satellite_id': satellite_id,
                'speech': f'Analyzing risk for satellite {satellite_id}'
            }
        
        elif command == 'plan_maneuver':
            satellite_id = params[0] if params else 'unknown'
            return {
                'status': 'success',
                'action': 'plan_maneuver',
                'message': f'Planning maneuver for {satellite_id}',
                'satellite_id': satellite_id,
                'speech': f'Calculating optimal maneuver for {satellite_id}'
            }
        
        elif command == 'get_status':
            return {
                'status': 'success',
                'action': 'show_status',
                'message': 'Displaying system status',
                'speech': 'System operational. All services running normally.'
            }
        
        elif command == 'get_analytics':
            return {
                'status': 'success',
                'action': 'show_analytics',
                'message': 'Displaying analytics',
                'endpoint': '/analytics',
                'speech': 'Opening analytics dashboard'
            }
        
        elif command == 'help':
            return {
                'status': 'success',
                'action': 'show_help',
                'message': 'Available commands',
                'commands': [
                    'Show satellites',
                    'Get conjunctions',
                    'Analyze risk for [satellite]',
                    'Plan maneuver for [satellite]',
                    'System status',
                    'Show analytics'
                ],
                'speech': 'Available commands: Show satellites, Get conjunctions, Analyze risk, Plan maneuver, System status, and Show analytics'
            }
        
        else:
            return {
                'status': 'error',
                'action': 'unknown',
                'message': 'Command not recognized',
                'speech': 'Sorry, I did not understand that command. Say help for available commands.'
            }

@router.websocket("/ws/voice")
async def voice_control_websocket(websocket: WebSocket):
    """WebSocket endpoint for voice control"""
    await websocket.accept()
    parser = VoiceCommandParser()
    executor = VoiceCommandExecutor()
    
    print("✓ Voice control WebSocket connected")
    
    try:
        while True:
            # Receive voice command text from frontend
            data = await websocket.receive_json()
            command_text = data.get('text', '')
            
            print(f"Voice command received: {command_text}")
            
            # Parse command
            parsed = parser.parse(command_text)
            
            # Execute command
            response = await executor.execute(parsed)
            
            # Send response back to frontend
            await websocket.send_json(response)
            
            print(f"Voice response sent: {response['action']}")
    
    except WebSocketDisconnect:
        print("Voice control WebSocket disconnected")
    except Exception as e:
        print(f"Voice control error: {e}")
        try:
            await websocket.send_json({
                'status': 'error',
                'message': str(e),
                'speech': 'An error occurred processing your command'
            })
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass

@router.get("/voice/commands")
async def get_available_commands():
    """Get list of available voice commands"""
    return {
        'commands': [
            {
                'command': 'Show satellites',
                'examples': ['Show all satellites', 'List satellites', 'What satellites do we have']
            },
            {
                'command': 'Get conjunctions',
                'examples': ['Show conjunctions', 'What are the collision risks', 'Get close approaches']
            },
            {
                'command': 'Analyze risk',
                'examples': ['Analyze risk for ISS', 'What is the risk for Hubble', 'Check ISS risk']
            },
            {
                'command': 'Plan maneuver',
                'examples': ['Plan maneuver for ISS', 'Calculate maneuver for Hubble', 'Avoid collision for ISS']
            },
            {
                'command': 'System status',
                'examples': ['What is the status', 'System status', 'Health check']
            },
            {
                'command': 'Show analytics',
                'examples': ['Show analytics', 'Display statistics', 'Get analytics']
            },
            {
                'command': 'Help',
                'examples': ['Help', 'What can you do', 'Available commands']
            }
        ]
    }

# Export router
__all__ = ['router', 'VoiceCommandParser', 'VoiceCommandExecutor']
