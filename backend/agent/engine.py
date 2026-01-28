import asyncio
from typing import List, Optional

from backend.agent.callback_handler import get_llm_callback_handler
from backend.agent.factory import AgentFactory
from langchain_core.messages import BaseMessage

llm_callback_handler = get_llm_callback_handler()


async def chat_async(
    question: str,
    enable_tools: bool = True,
    enable_memory: bool = False,
    chat_history: Optional[List[BaseMessage]] = None,
    stop_event=None,
):
    agent_executor = AgentFactory.get_executor(
        streaming=False,
        enable_tools=enable_tools,
        enable_memory=enable_memory,
    )
    inputs = {"input": question}
    if enable_memory:
        inputs["chat_history"] = chat_history

    if stop_event is not None:
        invoke_task = asyncio.create_task(agent_executor.ainvoke(inputs))

        done, pending = await asyncio.wait(
            [invoke_task, asyncio.create_task(stop_event.wait())],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()

        if stop_event.is_set():
            if not invoke_task.done():
                invoke_task.cancel()
            raise asyncio.CancelledError("Chat generation cancelled by user")

        result = await invoke_task
    else:
        result = await agent_executor.ainvoke(inputs)

    return result


async def chat_async_stream(
    question: str,
    enable_tools: bool = True,
    enable_memory: bool = False,
    chat_history: Optional[List[BaseMessage]] = None,
):
    agent_executor = AgentFactory.get_executor(
        streaming=True,
        enable_tools=enable_tools,
        enable_memory=enable_memory,
    )
    inputs = {"input": question}
    if enable_memory:
        inputs["chat_history"] = chat_history

    async for chunk in agent_executor.astream(inputs):
        yield chunk
