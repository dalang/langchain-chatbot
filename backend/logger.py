"""
Logging configuration and custom LangChain callback handlers.

This module sets up structured logging for the backend application and
provides custom callbacks to capture detailed LLM invocation information.
"""

import logging
import sys
from typing import Any, Dict, List, Optional, Sequence, Union

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import BaseMessage
from langchain_core.outputs import LLMResult

# Configure root logger
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)

# Create logger for this module
logger = logging.getLogger(__name__)


class LLMDetailedCallbackHandler(BaseCallbackHandler):
    """
    Custom callback handler to capture detailed LLM invocation logs.

    Logs prompts, model responses, and metadata for both streaming and
    non-streaming calls.
    """

    def __init__(self, logger_name: str = "langchain.llm"):
        super().__init__()
        self.logger = logging.getLogger(logger_name)
        self.last_token_usage = None

    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        **kwargs: Any,
    ) -> None:
        """Run when LLM starts running."""
        self.logger.info("=" * 80)
        self.logger.info("LLM Start")
        self.logger.info("=" * 80)
        self.logger.debug(f"Serialized: {serialized}")

        for i, prompt in enumerate(prompts, 1):
            self.logger.info(f"Prompt {i}:")
            self.logger.info("-" * 40)
            self.logger.info(prompt)
            self.logger.info("-" * 40)

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Run on new LLM token. Only visible when log level is DEBUG."""
        self.logger.debug(f"Token: {token}")

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Run when LLM ends running."""
        self.logger.info("=" * 80)
        self.logger.info("LLM End")
        self.logger.info("=" * 80)

        # Log generations
        for i, generations in enumerate(response.generations, 1):
            for j, generation in enumerate(generations, 1):
                self.logger.info(f"Generation {i}-{j}:")
                self.logger.info("-" * 40)
                self.logger.info(f"Text: {generation.text}")
                if generation.generation_info:
                    self.logger.info(f"Info: {generation.generation_info}")
                self.logger.info("-" * 40)

        token_usage = None

        for generations in response.generations:
            for generation in generations:
                if (
                    generation.generation_info
                    and "token_usage" in generation.generation_info
                ):
                    token_usage = generation.generation_info["token_usage"]
                    break

        if not token_usage and response.llm_output:
            if "token_usage" in response.llm_output:
                token_usage = response.llm_output["token_usage"]
            elif (
                "prompt_tokens" in response.llm_output
                or "completion_tokens" in response.llm_output
            ):
                token_usage = {
                    "prompt_tokens": response.llm_output.get("prompt_tokens", 0),
                    "completion_tokens": response.llm_output.get(
                        "completion_tokens", 0
                    ),
                    "total_tokens": response.llm_output.get("total_tokens", 0),
                }

        if token_usage:
            self.logger.info(f"Token usage: {token_usage}")
            self.last_token_usage = token_usage

        if response.llm_output:
            self.logger.info(f"LLM output: {response.llm_output}")

    def get_last_token_usage(self) -> Optional[Dict[str, int]]:
        """Get token usage from last LLM invocation.

        Returns:
            Dictionary with 'prompt_tokens', 'completion_tokens', 'total_tokens' or None.
        """
        return self.last_token_usage

    def on_llm_error(
        self,
        error: Union[Exception, KeyboardInterrupt],
        **kwargs: Any,
    ) -> None:
        """Run when LLM errors."""
        self.logger.error("=" * 80)
        self.logger.error("LLM Error")
        self.logger.error("=" * 80)
        self.logger.error(f"Error: {error}", exc_info=True)

    def on_chain_start(
        self,
        serialized: Dict[str, Any],
        inputs: Dict[str, Any],
        **kwargs: Any,
    ) -> None:
        """Run when chain starts running."""
        self.logger.info("=" * 80)
        self.logger.info(f"Chain Start: {serialized.get('name', 'unknown')}")
        self.logger.info("=" * 80)
        self.logger.debug(f"Inputs: {inputs}")

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        """Run when chain ends running."""
        self.logger.info("=" * 80)
        self.logger.info("Chain End")
        self.logger.info("=" * 80)
        self.logger.debug(f"Outputs: {outputs}")

    def on_chain_error(
        self,
        error: Union[Exception, KeyboardInterrupt],
        **kwargs: Any,
    ) -> None:
        """Run when chain errors."""
        self.logger.error("=" * 80)
        self.logger.error("Chain Error")
        self.logger.error("=" * 80)
        self.logger.error(f"Error: {error}", exc_info=True)

    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        **kwargs: Any,
    ) -> None:
        """Run when tool starts running."""
        self.logger.info("=" * 80)
        self.logger.info(f"Tool Start: {serialized.get('name', 'unknown')}")
        self.logger.info("=" * 80)
        self.logger.info(f"Input: {input_str}")

    def on_tool_end(
        self,
        output: str,
        observation_prefix: str = "",
        llm_prefix: str = "",
        **kwargs: Any,
    ) -> None:
        """Run when tool ends running."""
        self.logger.info("=" * 80)
        self.logger.info("Tool End")
        self.logger.info("=" * 80)
        self.logger.info(f"Output: {output}")

    def on_tool_error(
        self,
        error: Union[Exception, KeyboardInterrupt],
        **kwargs: Any,
    ) -> None:
        """Run when tool errors."""
        self.logger.error("=" * 80)
        self.logger.error("Tool Error")
        self.logger.error("=" * 80)
        self.logger.error(f"Error: {error}", exc_info=True)

    def on_agent_action(
        self,
        action: Any,
        color: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """Run on agent action."""
        self.logger.info("=" * 80)
        self.logger.info("Agent Action")
        self.logger.info("=" * 80)
        self.logger.info(f"Tool: {action.tool}")
        self.logger.info(f"Input: {action.tool_input}")
        self.logger.info(f"Log: {action.log}")

    def on_agent_finish(
        self,
        finish: Any,
        color: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """Run on agent end."""
        self.logger.info("=" * 80)
        self.logger.info("Agent Finish")
        self.logger.info("=" * 80)
        self.logger.info(f"Output: {finish.return_values}")
        self.logger.info(f"Log: {finish.log}")


_llm_callback_handler_instance = None


def get_llm_callback_handler() -> LLMDetailedCallbackHandler:
    """
    Get an instance of the detailed LLM callback handler.

    Returns:
        LLMDetailedCallbackHandler: Configured callback handler instance.
    """
    global _llm_callback_handler_instance
    if _llm_callback_handler_instance is None:
        _llm_callback_handler_instance = LLMDetailedCallbackHandler()
    return _llm_callback_handler_instance


def get_last_token_usage() -> Optional[Dict[str, int]]:
    """
    Get the token usage from the last LLM invocation.

    Returns:
        Dictionary with 'prompt_tokens', 'completion_tokens', 'total_tokens' or None.
    """
    handler = get_llm_callback_handler()
    return handler.get_last_token_usage()
