"""Basic API endpoint tests for regression testing during refactoring.

These tests provide a safety net when refactoring main.py routes into separate modules.
"""

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import app

client = TestClient(app)


class TestGeneralEndpoints:
    """Test general endpoints (/, /health, /api/config)"""

    def test_root_endpoint(self):
        """Test root endpoint returns API info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data

    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_config_endpoint(self):
        """Test config endpoint returns public configuration"""
        response = client.get("/api/config")
        assert response.status_code == 200
        data = response.json()
        assert "modelName" in data
        assert "temperature" in data
        assert "maxIterations" in data
        assert "tools" in data


class TestSessionEndpoints:
    """Test session CRUD endpoints"""

    def test_create_session(self):
        """Test creating a new session"""
        response = client.post(
            "/api/sessions", json={"user_id": "test_user", "title": "Test Session"}
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["user_id"] == "test_user"
        assert data["title"] == "Test Session"
        return data["id"]

    def test_create_session_default(self):
        """Test creating a session with defaults"""
        response = client.post("/api/sessions", json={})
        assert response.status_code == 201
        data = response.json()
        assert "id" in data

    def test_get_session(self):
        """Test retrieving a specific session"""
        create_response = client.post("/api/sessions", json={"title": "Get Test"})
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]

        response = client.get(f"/api/sessions/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert "message_count" in data

    def test_get_session_not_found(self):
        """Test retrieving non-existent session returns 404"""
        response = client.get("/api/sessions/nonexistent-id")
        assert response.status_code == 404

    def test_list_sessions(self):
        """Test listing sessions for a user"""
        response = client.get("/api/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_delete_session(self):
        """Test deleting a session"""
        create_response = client.post("/api/sessions", json={"title": "Delete Test"})
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]

        response = client.delete(f"/api/sessions/{session_id}")
        assert response.status_code == 204

        get_response = client.get(f"/api/sessions/{session_id}")
        assert get_response.status_code == 404

    def test_delete_session_not_found(self):
        """Test deleting non-existent session returns 404"""
        response = client.delete("/api/sessions/nonexistent-id")
        assert response.status_code == 404

    def test_clear_session(self):
        """Test clearing messages from a session"""
        create_response = client.post("/api/sessions", json={"title": "Clear Test"})
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]

        response = client.delete(f"/api/sessions/{session_id}/clear")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "deleted_count" in data

    def test_cancel_session(self):
        """Test cancelling a session"""
        create_response = client.post("/api/sessions", json={"title": "Cancel Test"})
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]

        response = client.post(f"/api/sessions/{session_id}/cancel")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data


class TestMessageEndpoints:
    """Test message retrieval endpoints"""

    def test_get_messages(self):
        """Test retrieving messages for a session"""
        create_response = client.post("/api/sessions", json={"title": "Messages Test"})
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]

        response = client.get(f"/api/sessions/{session_id}/messages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_messages_session_not_found(self):
        """Test retrieving messages for non-existent session"""
        response = client.get("/api/sessions/nonexistent-id/messages")
        assert response.status_code == 404


class TestChatEndpoints:
    """Test chat endpoints (non-streaming)"""

    def test_chat_endpoint_exists(self):
        """Test chat endpoint exists and accepts valid request"""
        create_response = client.post("/api/sessions", json={"title": "Chat Test"})
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]

        response = client.post(
            "/api/chat",
            json={
                "sessionId": session_id,
                "message": "Hello",
                "options": {"enableToolCalls": False, "enableMemory": False},
            },
        )
        assert response.status_code != 404

    def test_stream_chat_endpoint_exists(self):
        """Test stream-chat endpoint exists and accepts valid request"""
        create_response = client.post("/api/sessions", json={"title": "Stream Test"})
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]

        response = client.post(
            "/api/stream-chat",
            json={
                "sessionId": session_id,
                "message": "Hello",
                "options": {"enableToolCalls": False, "enableMemory": False},
            },
        )
        assert response.status_code != 404
