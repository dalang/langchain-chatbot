import { useEffect, useCallback } from 'react'
import useChatStore from '../store/chatStore'
import useSettingsStore from '../store/settingsStore'
import { SSEEvent, ToolStep, ChatResponse } from '../types'
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

        if (useStreamingChat) {
          const reader = (response as ReadableStream<Uint8Array>).getReader()
          const decoder = new TextDecoder()
          let textBuffer = ''
          let bufferTimeout: number | null = null

          const flushBuffer = () => {
            if (textBuffer) {
              appendToStreamingMessage(textBuffer)
              textBuffer = ''
            }
          }

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
                    case 'stream_chunk': {
                      const content = data.content || ''
                      if (!content) break

                      textBuffer += content

                      if (bufferTimeout) {
                        clearTimeout(bufferTimeout)
                      }

                      bufferTimeout = window.setTimeout(() => {
                        flushBuffer()
                      }, 16)

                      break
                    }
                    case 'thought':
                      updateLastAssistantMessage({
                        thought: data.content || '',
                      })
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
                      console.log('Tool result received:', { lastMsg, data })
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
                        console.log('Updating tool steps:', updatedSteps)
                        updateLastAssistantMessage({ tool_steps: updatedSteps })
                      } else {
                        console.warn('Cannot update tool step:', { lastMsg, toolSteps: lastMsg?.tool_steps })
                      }
                      break
                    }
                    case 'done': {
                      console.log('Done event received, completing streaming')
                      flushBuffer()
                      if (bufferTimeout) {
                        clearTimeout(bufferTimeout)
                      }
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
        } else {
          const chatResponse = response as ChatResponse

          if (chatResponse.tool_steps && chatResponse.tool_steps.length > 0) {
            const updatedToolSteps = chatResponse.tool_steps.map((ts) => ({
              id: Date.now(),
              message_id: Date.now(),
              step_number: 1,
              tool_name: ts.tool_name,
              tool_input: ts.tool_input,
              tool_output: ts.tool_output,
              tool_error: null,
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              duration_ms: ts.duration_ms,
              status: ts.status,
            }))
            updateLastAssistantMessage({ tool_steps: updatedToolSteps })
          }

          updateLastAssistantMessage({ content: chatResponse.output })
          updateLastAssistantMessage({
            thought_duration_ms: Date.now() - useChatStore.getState().messages[useChatStore.getState().messages.length - 1].thought_start_time!,
          })
          completeStreamingMessage()
          setLoading(false)
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
