import { create } from 'zustand'
import { Message, ToolStep } from '../types'

interface ChatStore {
  sessionId: string
  messages: Message[]
  isLoading: boolean
  currentStreamingMessage: string
  _pendingStreamingText: string // 待更新的文本缓冲区
  _rafId: number | null // requestAnimationFrame ID
  setSessionId: (id: string) => void
  addMessage: (message: Message) => void
  updateLastAssistantMessage: (updates: Partial<Message>) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setCurrentStreamingMessage: (message: string) => void
  appendToStreamingMessage: (text: string) => void
  addToolStepToLastMessage: (step: ToolStep) => void
  completeStreamingMessage: () => void
}

const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: '',
  messages: [],
  isLoading: false,
  currentStreamingMessage: '',
  _pendingStreamingText: '',
  _rafId: null,

  setSessionId: (id) => set({ sessionId: id }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastAssistantMessage: (updates) =>
    set((state) => {
      const newMessages = state.messages.map((msg, index) => {
        const isLastMessage = index === state.messages.length - 1
        const isAssistant = msg.role === 'assistant'

        if (isLastMessage && isAssistant) {
          return { ...msg, ...updates }
        }

        return msg
      })
      return { messages: newMessages }
    }),

  clearMessages: () => set({ messages: [] }),

  setLoading: (loading) => set({ isLoading: loading }),

  setCurrentStreamingMessage: (message) => {
    // 清除待处理的 RAF 更新
    const state = get()
    if (state._rafId !== null) {
      cancelAnimationFrame(state._rafId)
    }
    set({ currentStreamingMessage: message, _pendingStreamingText: '', _rafId: null })
  },

  appendToStreamingMessage: (text) => {
    const state = get()

    const newPendingText = state._pendingStreamingText + text

    if (state._rafId !== null) {
      set({ _pendingStreamingText: newPendingText })
      return
    }

    const newRafId = requestAnimationFrame(() => {
      const currentState = get()
      if (currentState._pendingStreamingText) {
        set((prev) => ({
          currentStreamingMessage: prev.currentStreamingMessage + currentState._pendingStreamingText,
          _pendingStreamingText: '',
          _rafId: null,
        }))
      }
    })

    set({ _pendingStreamingText: newPendingText, _rafId: newRafId })
  },

  addToolStepToLastMessage: (step) =>
    set((state) => {
      const newMessages = state.messages.map((msg, index) => {
        const isLastMessage = index === state.messages.length - 1
        const isAssistant = msg.role === 'assistant'

        if (isLastMessage && isAssistant) {
          const newToolSteps = [...(msg.tool_steps || []), step]
          console.log('Adding tool step to message:', { messageId: msg.id, step, newToolSteps })
          return {
            ...msg,
            tool_steps: newToolSteps,
          }
        }

        return msg
      })
      return { messages: newMessages }
    }),

  completeStreamingMessage: () => {
    set((prevState) => {
      // 清除待处理的 RAF 更新
      if (prevState._rafId !== null) {
        cancelAnimationFrame(prevState._rafId)
      }

      // 将待处理文本合并到当前流式消息中
      const finalStreamingContent =
        prevState.currentStreamingMessage + prevState._pendingStreamingText

      if (!finalStreamingContent) return { _rafId: null }

      const newMessages = [...prevState.messages]
      const lastIndex = newMessages.length - 1
      if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: finalStreamingContent,
        }
      }

      return {
        messages: newMessages,
        currentStreamingMessage: '',
        _pendingStreamingText: '',
        _rafId: null,
      }
    })
  },
}))

export default useChatStore
