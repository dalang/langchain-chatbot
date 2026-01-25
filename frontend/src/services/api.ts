import axios from 'axios'
import { Session, Message, ChatResponse } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const sessionApi = {
  create: async (userId: string = 'default') => {
    const response = await api.post<Session>('/sessions', {
      user_id: userId,
      title: null,
    })
    return response.data
  },

  getById: async (sessionId: string) => {
    const response = await api.get<Session>(`/sessions/${sessionId}`)
    return response.data
  },

  list: async (userId: string = 'default') => {
    const response = await api.get<Session[]>('/sessions', {
      params: { user_id: userId },
    })
    return response.data
  },

  delete: async (sessionId: string) => {
    await api.delete(`/sessions/${sessionId}`)
  },

  clear: async (sessionId: string) => {
    await api.delete(`/sessions/${sessionId}/clear`)
  },

  getMessages: async (sessionId: string) => {
    const response = await api.get<Message[]>(
      `/sessions/${sessionId}/messages`
    )
    return response.data
  },
}

export interface ConfigInfo {
  modelName: string
  temperature: number
  maxIterations: number
  tools: string[]
}

export const chatApi = {
  send: async (
    sessionId: string,
    message: string,
    useStreaming: boolean = false,
    enableToolCalls: boolean = true,
    enableMemory: boolean = false
  ): Promise<ReadableStream<Uint8Array> | ChatResponse> => {
    const endpoint = useStreaming ? '/api/stream-chat' : '/api/chat'

    if (useStreaming) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message,
          options: { enableToolCalls, enableMemory },
        }),
      })
      return response.body!
    } else {
      const response = await axios.post<ChatResponse>(endpoint, {
        sessionId,
        message,
        options: { enableToolCalls, enableMemory },
      })
      return response.data
    }
  },

  getConfig: async (): Promise<ConfigInfo> => {
    const response = await api.get<ConfigInfo>('/config')
    return response.data
  },
}

export default api
