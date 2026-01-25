import { create } from 'zustand'

interface SettingsState {
  useStreamingChat: boolean
  enableMemory: boolean
  enableToolCalls: boolean
  debugMode: boolean
  toggleStreamingChat: () => void
  toggleMemory: () => void
  toggleToolCalls: () => void
  toggleDebugMode: () => void
}

const useSettingsStore = create<SettingsState>((set) => ({
  useStreamingChat: false,
  enableMemory: false,
  enableToolCalls: true,
  debugMode: false,
  toggleStreamingChat: () =>
    set((state) => ({ useStreamingChat: !state.useStreamingChat })),
  toggleMemory: () =>
    set((state) => ({ enableMemory: !state.enableMemory })),
  toggleToolCalls: () =>
    set((state) => ({ enableToolCalls: !state.enableToolCalls })),
  toggleDebugMode: () =>
    set((state) => ({ debugMode: !state.debugMode })),
}))

export default useSettingsStore
