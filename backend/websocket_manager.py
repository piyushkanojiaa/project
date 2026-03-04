"""
WebSocket Real-Time Conjunction Updates
Provides live streaming of collision alerts to connected clients
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Set
import asyncio
import json
from datetime import datetime


class ConnectionManager:
    """Manage WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"✓ Client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)
        print(f"✗ Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific client"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_conjunction(self, conjunction: dict):
        """Broadcast new conjunction event"""
        message = {
            'type': 'conjunction',
            'timestamp': datetime.now().isoformat(),
            'data': conjunction
        }
        await self.broadcast(message)
    
    async def broadcast_alert(self, alert_level: str, message_text: str, conjunction_id: str = None):
        """Broadcast alert notification"""
        message = {
            'type': 'alert',
            'level': alert_level,
            'message': message_text,
            'conjunction_id': conjunction_id,
            'timestamp': datetime.now().isoformat()
        }
        await self.broadcast(message)
    
    async def send_status(self, websocket: WebSocket, status: str, details: dict = None):
        """Send status update to client"""
        message = {
            'type': 'status',
            'status': status,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        await self.send_personal_message(message, websocket)


# Global connection manager instance
manager = ConnectionManager()


async def conjunction_monitor_task(get_conjunctions_func):
    """
    Background task to monitor conjunctions and push updates
    
    Args:
        get_conjunctions_func: Function to fetch current conjunctions
    """
    last_critical_ids = set()
    
    while True:
        try:
            # Check for new conjunctions
            conjunctions = await get_conjunctions_func()
            
            # Find new CRITICAL/HIGH risk events
            current_critical = {
                c['conjunction_id']: c 
                for c in conjunctions 
                if c['risk_level'] in ['CRITICAL', 'HIGH']
            }
            
            current_ids = set(current_critical.keys())
            new_critical_ids = current_ids - last_critical_ids
            
            # Broadcast new critical events
            for conj_id in new_critical_ids:
                conjunction = current_critical[conj_id]
                await manager.broadcast_conjunction(conjunction)
                
                # Send alert
                alert_msg = f"{conjunction['satellite_name']} vs {conjunction['debris_name']} - PoC: {conjunction['poc_ml']:.2e}"
                await manager.broadcast_alert(
                    alert_level=conjunction['risk_level'],
                    message_text=alert_msg,
                    conjunction_id=conj_id
                )
            
            last_critical_ids = current_ids
            
            # Wait before next check (10 seconds)
            await asyncio.sleep(10)
            
        except Exception as e:
            print(f"Error in conjunction monitor: {e}")
            await asyncio.sleep(10)


# WebSocket endpoint handler
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time conjunction updates
    
    Usage from frontend:
        const ws = new WebSocket('ws://localhost:8000/ws/conjunctions');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);
        };
    """
    await manager.connect(websocket)
    
    # Send welcome message
    await manager.send_status(websocket, 'connected', {
        'message': 'Connected to Orbital Guard AI real-time stream',
        'active_connections': len(manager.active_connections)
    })
    
    try:
        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()
            
            # Handle client heartbeat
            if data == 'ping':
                await manager.send_personal_message({'type': 'pong'}, websocket)
            else:
                # Echo back for testing
                await manager.send_personal_message({
                    'type': 'echo',
                    'received': data
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)
