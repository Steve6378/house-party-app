# Yorru - WebSocket Connection Manager
# Version: 0.0.1
# Based on labb10 reference implementation

from typing import Dict, List
from fastapi import WebSocket
import json


class ConnectionManager:
    """
    Manages WebSocket connections for event-specific chat rooms.

    Each event has its own room, isolating conversations.
    Users can only see messages from the event they're connected to.
    """

    def __init__(self):
        # Map: event_id -> List[WebSocket connections]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, event_id: str):
        """Accept and register a WebSocket connection for a specific event room"""
        await websocket.accept()

        if event_id not in self.active_connections:
            self.active_connections[event_id] = []

        self.active_connections[event_id].append(websocket)

    def disconnect(self, websocket: WebSocket, event_id: str):
        """Remove a WebSocket connection from an event room"""
        if event_id in self.active_connections:
            if websocket in self.active_connections[event_id]:
                self.active_connections[event_id].remove(websocket)

            # Clean up empty rooms
            if len(self.active_connections[event_id]) == 0:
                del self.active_connections[event_id]

    async def broadcast_to_event(self, event_id: str, message: dict):
        """
        Broadcast a message to all connections in a specific event room.

        Args:
            event_id: The event room to broadcast to
            message: Dictionary containing message data
        """
        if event_id not in self.active_connections:
            return

        # Convert message dict to JSON string
        message_json = json.dumps(message)

        # Send to all active connections in this event room
        disconnected = []
        for connection in self.active_connections[event_id]:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                print(f"Error sending message to connection: {e}")
                disconnected.append(connection)

        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection, event_id)

    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send a message to a specific WebSocket connection"""
        message_json = json.dumps(message)
        await websocket.send_text(message_json)

    def get_room_size(self, event_id: str) -> int:
        """Get the number of active connections in an event room"""
        if event_id not in self.active_connections:
            return 0
        return len(self.active_connections[event_id])


# Global instance
manager = ConnectionManager()
