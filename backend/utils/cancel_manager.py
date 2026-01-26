"""Cancellation manager for stopping AI generation tasks per session.

This module provides session-based cancellation support using asyncio events.
Each session gets its own stop event, allowing independent control over
multiple concurrent chat sessions.
"""

import asyncio
from typing import Dict


class CancelManager:
    """Manages cancellation events for active chat sessions.

    This class maintains a mapping of session IDs to asyncio.Event objects.
    When a session's stop event is set, all streaming operations for that
    session should check the event and gracefully stop generation.

    Example:
        manager = CancelManager()

        # Start generation with stop event
        stop_event = manager.get_stop_event("session-123")
        for chunk in generate_response():
            if stop_event.is_set():
                break
            yield chunk

        # Cancel from another endpoint
        manager.stop_session("session-123")
    """

    def __init__(self) -> None:
        """Initialize the cancel manager with empty stop event registry."""
        self._stop_events: Dict[str, asyncio.Event] = {}

    def get_stop_event(self, session_id: str) -> asyncio.Event:
        """Get or create a stop event for the given session.

        Args:
            session_id: The unique identifier for the chat session.

        Returns:
            An asyncio.Event that can be checked during streaming.
        """
        if session_id not in self._stop_events:
            self._stop_events[session_id] = asyncio.Event()
        return self._stop_events[session_id]

    def stop_session(self, session_id: str) -> bool:
        """Signal to stop generation for the specified session.

        Args:
            session_id: The unique identifier for the chat session.

        Returns:
            True if session was found and stopped, False if not found.
        """
        if session_id in self._stop_events:
            self._stop_events[session_id].set()
            return True
        return False

    def cleanup(self, session_id: str) -> None:
        """Remove the stop event for a completed session.

        This should be called after a generation completes (successfully or
        via cancellation) to prevent memory leaks.

        Args:
            session_id: The unique identifier for the chat session.
        """
        if session_id in self._stop_events:
            del self._stop_events[session_id]

    def is_session_stopped(self, session_id: str) -> bool:
        """Check if a session has been stopped.

        Args:
            session_id: The unique identifier for the chat session.

        Returns:
            True if the session's stop event has been set, False otherwise.
        """
        return (
            session_id in self._stop_events and self._stop_events[session_id].is_set()
        )


# Global instance for use across the application
cancel_manager = CancelManager()
