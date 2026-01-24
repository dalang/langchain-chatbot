"""Tests for tool toggle functionality in chatbot_engine.py"""

import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, MagicMock as Mock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

# Create a mock settings module
mock_settings = Mock()
mock_settings.ZHIPUAI_API_KEY = "test_key"
mock_settings.TAVILY_API_KEY = "test_key"
mock_settings.LANGSMITH_API_KEY = ""
mock_settings.MODEL_NAME = "glm-4"
mock_settings.TEMPERATURE = 0.01
mock_settings.MAX_ITERATIONS = 5

# Patch sys.modules to inject mock settings before importing
sys.modules["backend.config"] = Mock(settings=mock_settings)

from backend.chatbot_engine import (
    chat_async,
    chat_async_stream,
    get_agent_executor,
)

# Restore sys.modules after import
del sys.modules["backend.config"]


@pytest.fixture
def mock_langsmith_client():
    """Mock LangSmith client"""
    with patch("backend.chatbot_engine.Client") as mock_client:
        mock_prompt = MagicMock()
        mock_client.return_value = mock_client
        mock_client.pull_prompt.return_value = mock_prompt
        yield mock_client


@pytest.fixture
def mock_llm():
    """Mock LLM"""
    with patch("backend.chatbot_engine.ChatZhipuAI") as mock_chat:
        mock_llm_instance = MagicMock()
        mock_chat.return_value = mock_llm_instance
        yield mock_llm_instance


@pytest.fixture
def mock_tools():
    """Mock tools"""
    with patch.multiple(
        "backend.chatbot_engine",
        calculator=MagicMock(),
        tavily_search=MagicMock(),
    ):
        yield


@pytest.fixture
def clear_executors_cache():
    """Clear executors cache before each test"""
    import backend.chatbot_engine

    backend.chatbot_engine.executors = {}
    yield
    backend.chatbot_engine.executors = {}


def test_get_agent_executor_with_tools_enabled(clear_executors_cache):
    """Test that get_agent_executor creates executor with tools when enable_tools=True"""
    executor = get_agent_executor(streaming=False, enable_tools=True)

    # Should return a valid executor
    assert executor is not None
    # For tools enabled, we should have an AgentExecutor
    from langchain_classic.agents import AgentExecutor

    assert isinstance(executor, AgentExecutor)


def test_get_agent_executor_with_tools_disabled(clear_executors_cache):
    """Test that get_agent_executor creates executor without tools when enable_tools=False"""
    executor = get_agent_executor(streaming=False, enable_tools=False)

    # Should return a valid executor
    assert executor is not None
    # For tools disabled, we should have a RunnableLambda wrapper
    from langchain_core.runnables import RunnableLambda

    assert isinstance(executor, RunnableLambda)


def test_get_agent_executor_caching_with_tools(clear_executors_cache):
    """Test that executors are cached correctly when tools are enabled"""
    executor1 = get_agent_executor(streaming=False, enable_tools=True)
    executor2 = get_agent_executor(streaming=False, enable_tools=True)

    # Should be the same instance (cached)
    assert executor1 is executor2


def test_get_agent_executor_caching_without_tools(clear_executors_cache):
    """Test that executors are cached correctly when tools are disabled"""
    executor1 = get_agent_executor(streaming=False, enable_tools=False)
    executor2 = get_agent_executor(streaming=False, enable_tools=False)

    # Should be the same instance (cached)
    assert executor1 is executor2


def test_get_agent_executor_different_caches(clear_executors_cache):
    """Test that tool-enabled and tool-disabled executors are cached separately"""
    executor_with_tools = get_agent_executor(streaming=False, enable_tools=True)
    executor_without_tools = get_agent_executor(streaming=False, enable_tools=False)

    # Should be different instances
    assert executor_with_tools is not executor_without_tools

    # From cache
    executor_with_tools_2 = get_agent_executor(streaming=False, enable_tools=True)
    executor_without_tools_2 = get_agent_executor(streaming=False, enable_tools=False)

    assert executor_with_tools is executor_with_tools_2
    assert executor_without_tools is executor_without_tools_2


@pytest.mark.asyncio
async def test_chat_async_with_tools_enabled(
    clear_executors_cache, mock_langsmith_client, mock_llm, mock_tools
):
    """Test that chat_async with enable_tools=True can use tools"""
    from langchain_classic.agents import AgentExecutor

    mock_agent_executor = MagicMock(spec=AgentExecutor)
    mock_agent_executor.ainvoke = AsyncMock(
        return_value={
            "input": "What is 2 + 2?",
            "output": "The result of 2 + 2 is 4.",
            "intermediate_steps": [],
        }
    )

    import backend.chatbot_engine

    backend.chatbot_engine.get_agent_executor = (
        lambda streaming, enable_tools: mock_agent_executor
    )

    result = await chat_async("What is 2 + 2?", enable_tools=True)

    # Verify structure
    assert result["output"] == "The result of 2 + 2 is 4."
    assert result["input"] == "What is 2 + 2?"


@pytest.mark.asyncio
async def test_chat_async_with_tools_disabled(
    clear_executors_cache, mock_langsmith_client, mock_llm, mock_tools
):
    """Test that chat_async with enable_tools=False returns response without tools"""
    from langchain_core.runnables import RunnableLambda

    mock_executor = MagicMock(spec=RunnableLambda)
    mock_executor.ainvoke = AsyncMock(
        return_value={
            "input": "Hello",
            "output": "Direct answer without tools.",
            "intermediate_steps": [],
        }
    )

    import backend.chatbot_engine

    backend.chatbot_engine.get_agent_executor = (
        lambda streaming, enable_tools: mock_executor
    )

    result = await chat_async("Hello", enable_tools=False)

    # Verify structure
    assert result["output"] == "Direct answer without tools."
    assert result["input"] == "Hello"
    # No intermediate steps when tools are disabled
    assert result["intermediate_steps"] == []


@pytest.mark.asyncio
async def test_chat_async_stream_with_tools_enabled(
    clear_executors_cache, mock_langsmith_client, mock_llm, mock_tools
):
    """Test that chat_async_stream with enable_tools=True streams tool actions"""
    from langchain_classic.agents import AgentExecutor

    mock_agent_executor = MagicMock(spec=AgentExecutor)

    async def mock_stream_generator(input_dict):
        yield {"output": "Using tools: 4"}

    mock_agent_executor.astream = mock_stream_generator

    import backend.chatbot_engine

    backend.chatbot_engine.get_agent_executor = (
        lambda streaming, enable_tools: mock_agent_executor
    )

    chunks = []
    async for chunk in chat_async_stream("What is 2 + 2?", enable_tools=True):
        chunks.append(chunk)

    assert len(chunks) > 0
    assert any(chunk.get("output") == "Using tools: 4" for chunk in chunks)


@pytest.mark.asyncio
async def test_chat_async_stream_with_tools_disabled(
    clear_executors_cache, mock_langsmith_client, mock_llm, mock_tools
):
    """Test that chat_async_stream with enable_tools=False returns direct response"""
    from langchain_core.runnables import RunnableLambda

    mock_executor = MagicMock(spec=RunnableLambda)

    async def mock_stream_generator(input_dict):
        yield "Direct streaming answer"

    mock_executor.astream = mock_stream_generator

    import backend.chatbot_engine

    backend.chatbot_engine.get_agent_executor = (
        lambda streaming, enable_tools: mock_executor
    )

    chunks = []
    async for chunk in chat_async_stream("Hello", enable_tools=False):
        chunks.append(chunk)

    assert len(chunks) > 0
    assert "Direct streaming answer" in chunks


def test_get_agent_executor_streaming_caching(clear_executors_cache):
    """Test that streaming and non-streaming executors are cached separately"""
    streaming_executor = get_agent_executor(streaming=True, enable_tools=True)
    non_streaming_executor = get_agent_executor(streaming=False, enable_tools=True)

    # Should be different instances
    assert streaming_executor is not non_streaming_executor

    # From cache
    streaming_executor_2 = get_agent_executor(streaming=True, enable_tools=True)
    non_streaming_executor_2 = get_agent_executor(streaming=False, enable_tools=True)

    assert streaming_executor is streaming_executor_2
    assert non_streaming_executor is non_streaming_executor_2


# ============================================================================
# Integration Tests (Real API calls - optional, requires valid API keys)
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_real_api_tools_enabled(
    clear_executors_cache,
):
    """Integration test: Real API call with tools enabled"""
    if not os.getenv("ZHIPUAI_API_KEY"):
        pytest.skip("ZHIPUAI_API_KEY not set")

    # Test with a simple calculation question
    question = "What is 15 + 27?"
    result = await chat_async(question, enable_tools=True)

    assert "output" in result
    output = result["output"].lower()
    # Calculator should be used and answer should be correct
    assert "42" in output or "42" in result["output"]
    # Should have intermediate steps when using tools
    assert len(result.get("intermediate_steps", [])) > 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_real_api_tools_disabled(
    clear_executors_cache,
):
    """Integration test: Real API call with tools disabled"""
    if not os.getenv("ZHIPUAI_API_KEY"):
        pytest.skip("ZHIPUAI_API_KEY not set")

    # Test with a simple question that doesn't need tools
    question = "What is the capital of China?"
    result = await chat_async(question, enable_tools=False)

    assert "output" in result
    output = result["output"].lower()
    # Should answer directly
    assert "beijing" in output or "北京" in result["output"]
    # Should not have intermediate steps when tools are disabled
    assert len(result.get("intermediate_steps", [])) == 0
