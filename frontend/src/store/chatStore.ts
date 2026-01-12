import { create } from 'zustand'
import { ChatState, Message, ToolStep } from '../types'

interface ChatStore extends ChatState {
  setSessionId: (id: string) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setCurrentStreamingMessage: (message: string) => void
  appendToStreamingMessage: (text: string) => void
  setCurrentThought: (thought: string) => void
  addToolStep: (step: ToolStep) => void
  clearToolSteps: () => void
}

const useChatStore = create<ChatStore>((set) => ({
  sessionId: '',
  messages: [],
  isLoading: false,
  currentStreamingMessage: '',
  currentThought: '',
  toolSteps: [],

  setSessionId: (id) => set({ sessionId: id }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  clearMessages: () => set({ messages: [] }),

  setLoading: (loading) => set({ isLoading: loading }),

  setCurrentStreamingMessage: (message) =>
    set({ currentStreamingMessage: message }),

  appendToStreamingMessage: (text) =>
    set((state) => ({
      currentStreamingMessage: state.currentStreamingMessage + text,
    })),

  setCurrentThought: (thought) =>
    set({ currentThought: thought }),

  addToolStep: (step) =>
    set((state) => ({
      toolSteps: [...state.toolSteps, step],
    })),

  clearToolSteps: () => set({ toolSteps: [] }),
}))

export default useChatStore
