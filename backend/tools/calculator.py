from types import LambdaType

from langchain_core.tools import tool


@tool
def calculator(expression: str) -> str:
    """执行数学表达式计算。输入一个数学表达式字符串，返回计算结果。"""
    try:
        # GitHub Issue #12645: "MRKL agent is passing 'Observation' text to tools when using non-OpenAI LLMs"
        # Fix: Non-OpenAI LLMs (ZhipuAI) may include "Observation" in tool input
        parts = expression.split("\n")
        if len(parts) > 1 and "Observation:".startswith(parts[-1]):
            expression = "\n".join(parts[:-1])
        result = eval(expression)
        return str(result)
    except Exception as e:
        return f"计算错误: {str(e)}"
