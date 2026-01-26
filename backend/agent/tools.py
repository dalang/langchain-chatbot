"""Tools module.

This module provides a centralized tool registry for the chatbot.
Tools can be dynamically registered and discovered without modifying chatbot_engine.py.
"""

from typing import Callable, List

from langchain_core.tools import BaseTool


class ToolRegistry:
    """Centralized registry for LangChain tools.

    Provides:
    - Get all registered tools
    - Get tools by name
    - Register custom tools at runtime
    - Clear all custom tools

    This replaces the hardcoded `tools` list in chatbot_engine.py.
    """

    _tools: List[BaseTool] = []

    @classmethod
    def register_tool(cls, tool: BaseTool):
        """Register a tool class for use by the agent.

        Args:
            tool_class: Tool class constructor
        """
        ToolRegistry._tools.append(tool)
        print(f"Registered tool: {tool.name}")
        print(f"{len(ToolRegistry._tools)} tools available now.")
        print(f"{ToolRegistry._tools}")
        return tool

    @classmethod
    def get_tools(cls) -> List[BaseTool]:
        """Get all registered tools including any custom ones.

        Returns:
            List of all available LangChain tools
        """
        return list(ToolRegistry._tools)
