"""Tests for chatbot_engine.py"""

import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from dotenv import load_dotenv
from langchain.agents import AgentExecutor
from langchain_core.messages import AIMessage, HumanMessage

sys.path.insert(0, str(Path(__file__).parent.parent))
from backend.chatbot_engine import chat_async, chat_async_stream

# Load .env file for real API keys
load_dotenv()


@pytest.fixture
def mock_settings():
    """Use real API keys from .env file"""
    with patch.multiple(
        "backend.config.settings",
        ZHIPUAI_API_KEY=os.getenv("ZHIPUAI_API_KEY"),
        TAVILY_API_KEY=os.getenv("TAVILY_API_KEY"),
        LANGSMITH_API_KEY=os.getenv("LANGSMITH_API_KEY", ""),
        MODEL_NAME="glm-4",
        TEMPERATURE=0.01,
        MAX_ITERATIONS=5,
    ):
        yield


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


@pytest.mark.asyncio
async def test_chat_async_stream_returns_valid_structure(
    mock_settings, mock_langsmith_client, mock_llm, mock_tools
):
    """Test that chat_async_stream returns a dictionary with correct structure"""
    # Mock the agent executor
    mock_agent_executor = MagicMock(spec=AgentExecutor)
    mock_agent_executor.ainvoke = AsyncMock(
        return_value={
            "input": "What is 2 + 2?",
            "output": "The result of 2 + 2 is 4.",
            "intermediate_steps": [
                (
                    [HumanMessage(content="What is 2 + 2?")],
                    "Observation: 4",
                )
            ],
        }
    )

    # Clear the executors cache and inject mock
    import backend.chatbot_engine

    backend.chatbot_engine.executors = {}
    backend.chatbot_engine.get_agent_executor = lambda streaming: mock_agent_executor

    # Call the function
    result = await chat_async_stream("What is 2 + 2?")

    # Verify return structure
    assert isinstance(result, dict), "Result should be a dictionary"
    assert "input" in result, "Result should contain 'input' key"
    assert "output" in result, "Result should contain 'output' key"
    assert "intermediate_steps" in result, (
        "Result should contain 'intermediate_steps' key"
    )

    # Verify values
    assert result["input"] == "What is 2 + 2?"
    assert result["output"] == "The result of 2 + 2 is 4."
    assert isinstance(result["intermediate_steps"], list)

    # Verify ainvoke was called with correct arguments
    mock_agent_executor.ainvoke.assert_called_once_with({"input": "What is 2 + 2?"})


@pytest.mark.asyncio
async def test_chat_async_stream_with_empty_intermediate_steps(
    mock_settings, mock_langsmith_client, mock_llm, mock_tools
):
    """Test chat_async_stream with no intermediate steps"""
    mock_agent_executor = MagicMock(spec=AgentExecutor)
    mock_agent_executor.ainvoke = AsyncMock(
        return_value={
            "input": "Hello",
            "output": "Hi there!",
            "intermediate_steps": [],
        }
    )

    import backend.chatbot_engine

    backend.chatbot_engine.executors = {}
    backend.chatbot_engine.get_agent_executor = lambda streaming: mock_agent_executor

    result = await chat_async_stream("Hello")

    assert result["intermediate_steps"] == []
    assert result["output"] == "Hi there!"


@pytest.mark.asyncio
async def test_chat_async_stream_with_multiple_intermediate_steps(
    mock_settings, mock_langsmith_client, mock_llm, mock_tools
):
    """Test chat_async_stream with multiple intermediate steps"""
    mock_agent_executor = MagicMock(spec=AgentExecutor)
    mock_agent_executor.ainvoke = AsyncMock(
        return_value={
            "input": "What is 5 * 6 + 3?",
            "output": "The result is 33.",
            "intermediate_steps": [
                (
                    [HumanMessage(content="What is 5 * 6?")],
                    "Observation: 30",
                ),
                (
                    [HumanMessage(content="What is 30 + 3?")],
                    "Observation: 33",
                ),
            ],
        }
    )

    import backend.chatbot_engine

    backend.chatbot_engine.executors = {}
    backend.chatbot_engine.get_agent_executor = lambda streaming: mock_agent_executor

    result = await chat_async_stream("What is 5 * 6 + 3?")

    assert len(result["intermediate_steps"]) == 2
    assert result["output"] == "The result is 33."


@pytest.mark.asyncio
async def test_chat_async_stream_calls_with_streaming_flag(
    mock_settings, mock_langsmith_client, mock_llm, mock_tools
):
    """Test that chat_async_stream calls get_agent_executor with streaming=True"""
    mock_agent_executor = MagicMock(spec=AgentExecutor)
    mock_agent_executor.ainvoke = AsyncMock(
        return_value={
            "input": "test",
            "output": "test response",
            "intermediate_steps": [],
        }
    )

    import backend.chatbot_engine

    backend.chatbot_engine.executors = {}

    with patch.object(
        backend.chatbot_engine, "get_agent_executor", return_value=mock_agent_executor
    ) as mock_get_executor:
        await chat_async_stream("test")

        # Verify get_agent_executor was called with streaming=True
        mock_get_executor.assert_called_once_with(streaming=True)


@pytest.mark.asyncio
async def test_chat_async_stream_return_types(
    mock_settings, mock_langsmith_client, mock_llm, mock_tools
):
    """Test that chat_async_stream returns correct types for each field"""
    mock_agent_executor = MagicMock(spec=AgentExecutor)
    mock_agent_executor.ainvoke = AsyncMock(
        return_value={
            "input": "Test question",
            "output": "Test answer",
            "intermediate_steps": [("step1", "result1"), ("step2", "result2")],
        }
    )

    import backend.chatbot_engine

    backend.chatbot_engine.executors = {}
    backend.chatbot_engine.get_agent_executor = lambda streaming: mock_agent_executor

    result = await chat_async_stream("Test question")

    assert isinstance(result["input"], str)
    assert isinstance(result["output"], str)
    assert isinstance(result["intermediate_steps"], list)


# ============================================================================
# Integration Tests (Real API calls)
# ============================================================================


async def _collect_stream_output(stream):
    """Helper: Collect streaming chunks and extract final output.

    Returns:
        tuple: (chunks, final_output) where final_output is extracted from
               either 'output' key or 'messages' with 'Final Answer:' marker.
    """
    chunks = []
    final_output = None

    async for chunk in stream:
        chunks.append(chunk)
        print(
            f"Chunk type: {type(chunk)}, keys: {chunk.keys() if isinstance(chunk, dict) else 'N/A'}"
        )

        # Extract output from 'output' key
        if isinstance(chunk, dict) and "output" in chunk:
            final_output = chunk["output"]

        # Extract final answer from messages
        if isinstance(chunk, dict) and "messages" in chunk:
            for msg in chunk["messages"]:
                if hasattr(msg, "content"):
                    content = msg.content
                    content_str = str(content) if isinstance(content, list) else content
                    if "Final Answer:" in content_str:
                        final_output = content_str
                        print(f"Found final answer: {final_output}")

    return chunks, final_output


@pytest.fixture
def clear_executors_cache():
    """Clear executors cache before each integration test"""
    import backend.chatbot_engine

    backend.chatbot_engine.executors = {}
    yield
    backend.chatbot_engine.executors = {}


@pytest.mark.integration
@pytest.mark.asyncio
async def test_chat_async_stream_real_llm_simple_question(clear_executors_cache):
    """Integration test: Real LLM streaming call with a simple question"""
    question = "What is the capital of China?"

    chunks, final_answer = await _collect_stream_output(chat_async_stream(question))

    # Verify we received streaming chunks
    assert len(chunks) > 0, "Should receive at least one chunk"

    # Verify streaming output contains answer
    assert final_answer is not None, "Should find final answer in stream"
    final_answer_lower = final_answer.lower()
    assert "beijing" in final_answer_lower or "北京" in final_answer

    print(f"\nTotal chunks received: {len(chunks)}")
    print(f"Final answer: {final_answer}")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_chat_async_stream_real_llm_with_calculator(clear_executors_cache):
    """Integration test: Real LLM streaming call with calculator tool"""
    question = "What is 123 * 456?"

    chunks, final_output = await _collect_stream_output(chat_async_stream(question))

    # Verify we received streaming chunks
    assert len(chunks) > 0, "Should receive at least one chunk"

    # Verify we got a final output
    assert final_output is not None, "Should find final output in stream"

    # Verify calculator was used (should contain the correct answer)
    answer = final_output.lower()
    assert "56088" in answer or "56,088" in answer

    print(f"\nTotal chunks received: {len(chunks)}")
    print(f"Final output: {final_output}")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_chat_async_stream_real_llm_with_search(clear_executors_cache):
    """Integration test: Real LLM streaming call with tavily search tool"""
    question = "What is the latest news about AI today?"

    chunks, final_output = await _collect_stream_output(chat_async_stream(question))

    # Verify we received streaming chunks
    assert len(chunks) > 0, "Should receive at least one chunk"

    # Verify we got a final output
    assert final_output is not None, "Should find final output in stream"
    assert isinstance(final_output, str)
    assert len(final_output) > 0

    print(f"\nTotal chunks received: {len(chunks)}")
    print(f"Final output: {final_output}")
