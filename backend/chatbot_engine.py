import os
from sys import exec_prefix

from backend.config import settings

os.environ["ZHIPUAI_API_KEY"] = settings.ZHIPUAI_API_KEY
os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY

from backend.tools.calculator import calculator
from backend.tools.tavily_search import tavily_search
from langchain.agents import (
    AgentExecutor,
    create_json_chat_agent,
    create_react_agent,
)
from langchain_community.chat_models.zhipuai import ChatZhipuAI
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from langsmith import Client

try:
    client = Client(api_key=settings.LANGSMITH_API_KEY)
    # Pull different prompts for different agent types
    json_prompt = client.pull_prompt("hwchase17/react-chat-json")
    react_prompt = client.pull_prompt("hwchase17/react")
except Exception as e:
    print(f"无法从 LangSmith 获取 prompt: {e}")
    print("请确保已配置 LANGSMITH_API_KEY 并联网")
    raise

tools = [calculator, tavily_search]
executors = {}


def get_agent_executor(streaming: bool = False):
    key = "streaming" if streaming else "non_streaming"

    agent_executor = executors.get(key)
    if not agent_executor:
        agent = None
        if streaming:
            # Use react_prompt for ReAct agent with streaming
            llm = ChatZhipuAI(
                model=settings.MODEL_NAME,
                temperature=settings.TEMPERATURE,
                streaming=True,
                callbacks=[StreamingStdOutCallbackHandler()],
            )
            agent = create_react_agent(llm=llm, tools=tools, prompt=react_prompt)
        else:
            # Use json_prompt for JSON chat agent
            llm = ChatZhipuAI(
                model=settings.MODEL_NAME, temperature=settings.TEMPERATURE
            )
            agent = create_json_chat_agent(llm, tools, json_prompt)

        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=settings.MAX_ITERATIONS,
            return_intermediate_steps=True,
        )
        executors[key] = agent_executor
    return agent_executor


async def chat_async(question: str):
    agent_executor = get_agent_executor()
    result = await agent_executor.ainvoke({"input": question})
    return result


async def chat_async_stream(question: str):
    """Stream chat responses using ReAct agent with streaming.

    Yields chunks of the response as they are generated.

    Args:
        question: The user's question

    Yields:
        Chunks from the agent execution stream
    """
    agent_executor = get_agent_executor(streaming=True)
    async for chunk in agent_executor.astream({"input": question}):
        yield chunk
