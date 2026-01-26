"""Message converter utilities."""

from langchain_core.messages import AIMessage, HumanMessage


class MessageConverter:
    """Converts database message objects to LangChain Message objects.

    This utility provides a clean separation between database models
    and LangChain's message format requirements.
    """

    @staticmethod
    def to_langchain_messages(messages):
        """Convert database messages to LangChain BaseMessage objects.

        Args:
            messages: List of database Message objects

        Returns:
            List of LangChain BaseMessage objects (HumanMessage, AIMessage)

        Skips:
            - System messages
            - Tool messages
        """
        langchain_messages = []
        for msg in messages:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content or ""))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content or ""))
        return langchain_messages
