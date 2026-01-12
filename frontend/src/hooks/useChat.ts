import { useEffect, useCallback, useRef } from 'react'
import useChatStore from '../store/chatStore'
import { SSEEvent } from '../types'
import { chatApi, sessionApi } from '../services/api'

export const useChat = () => {
  const {
    sessionId,
    messages,
    isLoading,
    currentStreamingMessage,
    toolSteps,
    setSessionId,
    addMessage,
    clearMessages,
    setLoading,
    setCurrentStreamingMessage,
    appendToStreamingMessage,
    addToolStep,
    clearToolSteps,
  } = useChatStore()

  const eventSourceRef = useRef<EventSource | null>(null)

  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId || !message.trim()) return

      addMessage({
        id: Date.now(),
        session_id: sessionId,
        role: 'user',
        content: message,
        tool_calls: null,
        created_at: new Date().toISOString(),
        model: null,
        tokens_used: null,
        tool_steps: [],
      })

      setLoading(true)
      setCurrentStreamingMessage('')
      clearToolSteps()

      try {
        const response = await chatApi.send(sessionId, message)

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
                const data = JSON.parse(
                  line.slice(6)
                ) as SSEEvent

                switch (data.type) {
                  case 'message':
                    appendToStreamingMessage(data.content || '')
                    break
                  case 'tool_start':
                    addToolStep({
                      id: Date.now(),
                      message_id: Date.now(),
                      step_number: toolSteps.length + 1,
                      tool_name: data.tool || '',
                      tool_input: data.input || {},
                      tool_output: null,
                      tool_error: null,
                      started_at: new Date().toISOString(),
                      completed_at: null,
                      duration_ms: null,
                      status: 'running',
                    })
                    break
                  case 'tool_result':
                    if (toolSteps.length > 0) {
                      const updatedStep = {
                        ...toolSteps[toolSteps.length - 1],
                        tool_output: data.result || '',
                        completed_at: new Date().toISOString(),
                        duration_ms: data.duration_ms || 0,
                        status: 'completed',
                      }
                      addToolStep(updatedStep)
                    }
                    break
                  case 'done':
                    // Get the latest streaming message content from store
                    const finalMessage = useChatStore.getState().currentStreamingMessage
                    if (finalMessage) {
                      addMessage({
                        id: Date.now(),
                        session_id: sessionId,
                        role: 'assistant',
                        content: finalMessage,
                        tool_calls: null,
                        created_at: new Date().toISOString(),
                        model: null,
                        tokens_used: null,
                        tool_steps: [],
                      })
                    }
                    setCurrentStreamingMessage('')
                    clearToolSteps()
                    setLoading(false)
                    break
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
      messages,
      currentStreamingMessage,
      toolSteps,
      setSessionId,
      addMessage,
      clearMessages,
      setLoading,
      setCurrentStreamingMessage,
      appendToStreamingMessage,
      addToolStep,
      clearToolSteps,
    ]
  )

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
    toolSteps,
    sendMessage,
    initializeSession,
  }
}

export default useChat
