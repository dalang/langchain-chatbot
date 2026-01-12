import { create } from 'zustand'
import { Message, ToolStep } from '../types'

interface ChatStore {
  sessionId: string
  messages: Message[]
  isLoading: boolean
  currentStreamingMessage: string
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

const useChatStore = create<ChatStore>((set) => ({
  sessionId: '',
  messages: [],
  isLoading: false,
  currentStreamingMessage: '',

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

  setCurrentStreamingMessage: (message) =>
    set({ currentStreamingMessage: message }),

  appendToStreamingMessage: (text) =>
    set((state) => ({
      currentStreamingMessage: state.currentStreamingMessage + text,
    })),

  addToolStepToLastMessage: (step) =>
    set((state) => {
      const newMessages = state.messages.map((msg, index) => {
        const isLastMessage = index === state.messages.length - 1
        const isAssistant = msg.role === 'assistant'

        if (isLastMessage && isAssistant) {
          return {
            ...msg,
            tool_steps: [...(msg.tool_steps || []), step],
          }
        }

        return msg
      })
      return { messages: newMessages }
    }),

  completeStreamingMessage: () =>
    set((state) => {
      if (!state.currentStreamingMessage) return state
      const newMessages = [...state.messages]
      const lastIndex = newMessages.length - 1
      if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: state.currentStreamingMessage,
        }
      }
      return { messages: newMessages, currentStreamingMessage: '' }
    }),
}))

export default useChatStore
