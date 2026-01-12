import os

from backend.config import settings

os.environ["ZHIPUAI_API_KEY"] = settings.ZHIPUAI_API_KEY
os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY

from backend.tools.calculator import calculator
from backend.tools.tavily_search import tavily_search
from langchain.agents import AgentExecutor, create_json_chat_agent
from langchain_community.chat_models.zhipuai import ChatZhipuAI
from langchain_core.tools import tool
from langsmith import Client

try:
    client = Client(api_key=settings.LANGSMITH_API_KEY)
    prompt = client.pull_prompt("hwchase17/react-chat-json")
except Exception as e:
    print(f"无法从 LangSmith 获取 prompt: {e}")
    print("请确保已配置 LANGSMITH_API_KEY 并联网")
    raise

tools = [calculator, tavily_search]

llm = ChatZhipuAI(model=settings.MODEL_NAME, temperature=settings.TEMPERATURE)

agent = create_json_chat_agent(llm, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=settings.MAX_ITERATIONS,
    return_intermediate_steps=True,
)


async def chat_async(question: str):
    result = await agent_executor.ainvoke({"input": question})
    return result
