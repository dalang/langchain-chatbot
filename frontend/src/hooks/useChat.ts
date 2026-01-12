import { useEffect, useCallback } from 'react'
import useChatStore from '../store/chatStore'
import useSettingsStore from '../store/settingsStore'
import { SSEEvent, ToolStep } from '../types'
import { chatApi, sessionApi } from '../services/api'
import { message } from 'antd'

export const useChat = () => {
  const {
    sessionId,
    messages,
    isLoading,
    currentStreamingMessage,
    setSessionId,
    addMessage,
    clearMessages: storeClearMessages,
    setLoading,
    setCurrentStreamingMessage,
    appendToStreamingMessage,
    updateLastAssistantMessage,
    addToolStepToLastMessage,
    completeStreamingMessage,
  } = useChatStore()

  const useStreamingChat = useSettingsStore((state) => state.useStreamingChat)

  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId || !message.trim()) return

      addMessage({
        id: Date.now(),
        session_id: sessionId,
        role: 'user',
        content: message,
        thought: null,
        thought_duration_ms: null,
        thought_start_time: null,
        tool_calls: null,
        created_at: new Date().toISOString(),
        model: null,
        tokens_used: null,
        tool_steps: [],
      })

      addMessage({
        id: Date.now() + 1,
        session_id: sessionId,
        role: 'assistant',
        content: null,
        thought: null,
        thought_duration_ms: null,
        thought_start_time: Date.now(),
        tool_calls: null,
        created_at: new Date().toISOString(),
        model: null,
        tokens_used: null,
        tool_steps: [],
      })

      setLoading(true)
      setCurrentStreamingMessage('')

      try {
        const response = await chatApi.send(sessionId, message, useStreamingChat)

        if (!response) {
          throw new Error('No response body')
        }

        const reader = response.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as SSEEvent

                switch (data.type) {
                  case 'message':
                    appendToStreamingMessage(data.content || '')
                    break
                  case 'thought':
                    updateLastAssistantMessage({
                      thought: data.content || '',
                    })
                    break
                  case 'stream_chunk':
                    appendToStreamingMessage(data.content || '')
                    break
                  case 'tool_start': {
                    const step: ToolStep = {
                      id: Date.now(),
                      message_id: Date.now(),
                      step_number: 1,
                      tool_name: data.tool || '',
                      tool_input: data.input || {},
                      tool_output: null,
                      tool_error: null,
                      started_at: new Date().toISOString(),
                      completed_at: null,
                      duration_ms: null,
                      status: 'running',
                    }
                    addToolStepToLastMessage(step)
                    break
                  }
                  case 'tool_result': {
                    const messages = useChatStore.getState().messages
                    const lastMsg = messages[messages.length - 1]
                    if (lastMsg && lastMsg.tool_steps && lastMsg.tool_steps.length > 0) {
                      const lastStep = lastMsg.tool_steps[lastMsg.tool_steps.length - 1]
                      const updatedSteps = [...lastMsg.tool_steps]
                      updatedSteps[updatedSteps.length - 1] = {
                        ...lastStep,
                        tool_output: data.result || '',
                        completed_at: new Date().toISOString(),
                        duration_ms: data.duration_ms || 0,
                        status: 'completed',
                      }
                      updateLastAssistantMessage({ tool_steps: updatedSteps })
                    }
                    break
                  }
                  case 'done': {
                    const messages = useChatStore.getState().messages
                    const lastMsg = messages[messages.length - 1]
                    if (lastMsg && lastMsg.thought_start_time) {
                      updateLastAssistantMessage({
                        thought_duration_ms: Date.now() - lastMsg.thought_start_time,
                      })
                    }
                    completeStreamingMessage()
                    setLoading(false)
                    break
                  }
                  case 'error':
                    console.error('Chat error:', data.message)
                    setLoading(false)
                    break
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e)
              }
            }
          }
        }
      } catch (error) {
        console.error('Chat error:', error)
        setLoading(false)
      }
    },
    [
      sessionId,
      useStreamingChat,
      addMessage,
      setLoading,
      setCurrentStreamingMessage,
      appendToStreamingMessage,
      updateLastAssistantMessage,
      addToolStepToLastMessage,
      completeStreamingMessage,
    ]
  )

  const clearMessages = useCallback(async () => {
    if (!sessionId) return

    try {
      await sessionApi.clear(sessionId)
      storeClearMessages()
      setCurrentStreamingMessage('')
      message.success('已清空对话')
    } catch (error) {
      console.error('Failed to clear messages:', error)
      message.error('清空失败')
    }
  }, [sessionId, storeClearMessages, setCurrentStreamingMessage])

  const initializeSession = useCallback(async () => {
    const newSession = await sessionApi.create('default')
    setSessionId(newSession.id)
  }, [setSessionId])

  useEffect(() => {
    if (!sessionId) {
      initializeSession()
    }
  }, [sessionId, initializeSession])

  return {
    sessionId,
    messages,
    isLoading,
    currentStreamingMessage,
    sendMessage,
    clearMessages,
    initializeSession,
  }
}

export default useChat
