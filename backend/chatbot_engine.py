import os
from sys import exec_prefix

from backend.config import settings
from backend.logger import get_llm_callback_handler

os.environ["ZHIPUAI_API_KEY"] = settings.ZHIPUAI_API_KEY
os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY

import langchain
from backend.tools.calculator import calculator
from backend.tools.tavily_search import tavily_search
from langchain_classic.agents import (
    AgentExecutor,
    create_json_chat_agent,
    create_react_agent,
)
from langchain_community.chat_models.zhipuai import ChatZhipuAI
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langsmith import Client

# Enable detailed LLM logging
langchain.debug = True
llm_callback_handler = get_llm_callback_handler()


# 创建自定义 JSON prompt，明确要求转义引号
custom_json_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Assistant is a large language model trained by OpenAI.
Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.
Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.
Overall, Assistant is a powerful system that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.
IMPORTANT: When outputting JSON, you MUST:
- Use only standard ASCII double quotes (")
- NEVER use Chinese quotes (" ")
- If you need quotes within a string value, escape them as backslash-double-quote (\\")
- CORRECT: "This is a \\"quoted\\" word"
- INCORRECT: "This is a "quoted" word"
- INCORRECT: "This is a "quoted" word" """,
        ),
        (
            "human",
            """TOOLS
------
Assistant can ask the user to use tools to look up information that may be helpful in answering the users original question. The tools the human can use are:
{tools}
RESPONSE FORMAT INSTRUCTIONS
----------------------------
When responding to me, please output a response in one of two formats:
**Option 1:**
Use this if you want the human to use a tool.
Markdown code snippet formatted in the following schema:
```json
{{
    "action": string, \\ The action to take. Must be one of {tool_names}
    "action_input": string \\ The input to the action
}}
```
**Option #2:**
Use this if you want to respond directly to the human. Markdown code snippet formatted in the following schema:
```json
{{
    "action": "Final Answer",
    "action_input": string \\ You should put what you want to return to use here
}}
```
CRITICAL: In the action_input field, if your response contains ANY quotes (including Chinese quotes), you MUST escape them with backslash.
- Example: \\"你好\\" (correct)
- Example: "你好" (WRONG - will cause parse error)
USER'S INPUT
--------------------
Here is the user's input (remember to respond with a markdown code snippet of a json blob with a single action, and NOTHING else):
{input}""",
        ),
        MessagesPlaceholder("agent_scratchpad"),
    ]
)

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

# No-tools prompt for when tools are disabled
no_tools_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Assistant is a large language model trained by OpenAI.
Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.
Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.
Overall, Assistant is a powerful system that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.
IMPORTANT: You do not have access to any tools. Always provide a direct answer without attempting to use tools. Your response should be a helpful, conversational answer to the user's question.""",
        ),
        (
            "human",
            "{input}",
        ),
    ]
)

executors = {}


def get_agent_executor(streaming: bool = False, enable_tools: bool = True):
    key = f"streaming_{streaming}_tools_{enable_tools}"

    agent_executor = executors.get(key)
    if not agent_executor:
        agent = None
        current_tools = tools

        if streaming:
            # Use react_prompt for ReAct agent with streaming
            llm = ChatZhipuAI(
                model=settings.MODEL_NAME,
                temperature=settings.TEMPERATURE,
                streaming=True,
                callbacks=[StreamingStdOutCallbackHandler(), llm_callback_handler],
            )
            if enable_tools:
                agent = create_react_agent(
                    llm=llm, tools=current_tools, prompt=react_prompt
                )
            else:
                # For streaming without tools, use simple prompt template
                agent = no_tools_prompt | llm
        else:
            # Use json_prompt for JSON chat agent
            llm = ChatZhipuAI(
                model=settings.MODEL_NAME,
                temperature=settings.TEMPERATURE,
                callbacks=[llm_callback_handler],
            )
            if enable_tools:
                agent = create_json_chat_agent(llm, current_tools, custom_json_prompt)
            else:
                # For non-streaming without tools, use simple prompt template
                agent = no_tools_prompt | llm

        if enable_tools:
            agent_executor = AgentExecutor(
                agent=agent,
                tools=current_tools,
                verbose=True,
                handle_parsing_errors=True,
                max_iterations=settings.MAX_ITERATIONS,
                return_intermediate_steps=True,
                callbacks=[llm_callback_handler],
            )
        else:
            # When tools are disabled, we don't need AgentExecutor
            # Just create a simple executor wrapper
            from langchain_core.runnables import RunnableLambda

            async def simple_executor(inputs):
                result = await agent.ainvoke(inputs)
                return {
                    "input": inputs.get("input", ""),
                    "output": result,
                    "intermediate_steps": [],
                }

            agent_executor = RunnableLambda(simple_executor)

        executors[key] = agent_executor
    return agent_executor


async def chat_async(question: str, enable_tools: bool = True):
    agent_executor = get_agent_executor(streaming=False, enable_tools=enable_tools)
    result = await agent_executor.ainvoke({"input": question})
    return result


async def chat_async_stream(question: str, enable_tools: bool = True):
    """Stream chat responses using ReAct agent with streaming.

    Yields chunks of the response as they are generated.

    Args:
        question: The user's question
        enable_tools: Whether to enable tool calls (default: True)

    Yields:
        Chunks from the agent execution stream
    """
    agent_executor = get_agent_executor(streaming=True, enable_tools=enable_tools)
    async for chunk in agent_executor.astream({"input": question}):
        yield chunk
