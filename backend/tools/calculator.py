from langchain_core.tools import tool


@tool
def calculator(expression: str) -> str:
    """执行数学表达式计算。输入一个数学表达式字符串，返回计算结果。"""
    try:
        result = eval(expression)
        return str(result)
    except Exception as e:
        return f"计算错误: {str(e)}"
