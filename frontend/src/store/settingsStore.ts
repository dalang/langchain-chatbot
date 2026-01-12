import { create } from 'zustand'

interface SettingsState {
  useStreamingChat: boolean
  toggleStreamingChat: () => void
}

const useSettingsStore = create<SettingsState>((set) => ({
  useStreamingChat: false,
  toggleStreamingChat: () =>
    set((state) => ({ useStreamingChat: !state.useStreamingChat })),
}))

export default useSettingsStore
