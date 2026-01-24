import { create } from 'zustand'

interface SettingsState {
  useStreamingChat: boolean
  enableMemory: boolean
  enableToolCalls: boolean
  toggleStreamingChat: () => void
  toggleMemory: () => void
  toggleToolCalls: () => void
}

const useSettingsStore = create<SettingsState>((set) => ({
  useStreamingChat: false,
  enableMemory: false,
  enableToolCalls: true,
  toggleStreamingChat: () =>
    set((state) => ({ useStreamingChat: !state.useStreamingChat })),
  toggleMemory: () =>
    set((state) => ({ enableMemory: !state.enableMemory })),
  toggleToolCalls: () =>
    set((state) => ({ enableToolCalls: !state.enableToolCalls })),
}))

export default useSettingsStore
