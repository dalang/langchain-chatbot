"""Agent factory module.

This module provides a factory pattern for creating AgentExecutor
instances with different configurations (streaming, tools, memory).

Uses a class-based cache to avoid re-initializing agents on each request.
"""

import os

from backend.agent.callback_handler import get_llm_callback_handler
from backend.agent.tools import ToolRegistry
from backend.config import settings
from backend.prompts import (
    custom_json_prompt,
    custom_json_prompt_with_memory,
    custom_no_tools_prompt,
    custom_no_tools_prompt_with_memory,
    react_prompt,
)
from langchain_classic.agents import (
    AgentExecutor,
    create_json_chat_agent,
    create_react_agent,
)
from langchain_community.chat_models.zhipuai import ChatZhipuAI
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from langchain_core.runnables import RunnableLambda

os.environ["ZHIPUAI_API_KEY"] = settings.ZHIPUAI_API_KEY
os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY


class AgentFactory:
    """Factory for creating and caching AgentExecutor instances.

    This factory implements a Strategy pattern to handle different
    agent configurations:
    - Streaming vs non-streaming
    - With tools vs without tools
    - With memory vs without memory

    Executors are cached by configuration key for reuse across requests.
    """

    _cache: dict[str, AgentExecutor | RunnableLambda] = {}

    @staticmethod
    def get_executor(
        streaming: bool = False,
        enable_tools: bool = True,
        enable_memory: bool = False,
    ) -> AgentExecutor | RunnableLambda:
        """Get or create a cached AgentExecutor for given configuration.

        Args:
            streaming: Whether to use streaming responses
            enable_tools: Whether to enable tool calls
            enable_memory: Whether to include chat history

        Returns:
            Cached AgentExecutor or RunnableLambda instance
        """
        key = f"streaming_{streaming}_tools_{enable_tools}_memory_{enable_memory}"

        if key in AgentFactory._cache:
            return AgentFactory._cache[key]

        tools = ToolRegistry.get_tools() if enable_tools else []
        default_prompt_template = (
            custom_no_tools_prompt_with_memory
            if enable_memory
            else custom_no_tools_prompt
        )
        agent = None

        if streaming:
            llm = ChatZhipuAI(
                model=settings.MODEL_NAME,
                temperature=settings.TEMPERATURE,
                streaming=True,
                callbacks=[
                    StreamingStdOutCallbackHandler(),
                    get_llm_callback_handler(),
                ],
            )
            if enable_tools:
                agent = create_react_agent(llm=llm, tools=tools, prompt=react_prompt)
            else:
                agent = default_prompt_template | llm
        else:
            llm = ChatZhipuAI(
                model=settings.MODEL_NAME,
                temperature=settings.TEMPERATURE,
                callbacks=[get_llm_callback_handler()],
            )
            if enable_tools:
                prompt_template = (
                    custom_json_prompt_with_memory
                    if enable_memory
                    else custom_json_prompt
                )
                agent = create_json_chat_agent(llm, tools, prompt_template)
            else:
                agent = default_prompt_template | llm

        if enable_tools:
            agent_executor = AgentExecutor(
                agent=agent,
                tools=tools,
                verbose=True,
                handle_parsing_errors=True,
                max_iterations=settings.MAX_ITERATIONS,
                return_intermediate_steps=True,
                callbacks=[get_llm_callback_handler()],
            )
        else:

            async def simple_executor(inputs):
                result = await agent.ainvoke(inputs)
                return {
                    "input": inputs.get("input", ""),
                    "output": result,
                    "intermediate_steps": [],
                }

            agent_executor = RunnableLambda(simple_executor)

        AgentFactory._cache[key] = agent_executor
        return agent_executor
