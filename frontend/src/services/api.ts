import axios from 'axios'
import { Session, Message } from '../types'

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

export const chatApi = {
  send: async (sessionId: string, message: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        message,
      }),
    })
    return response.body
  },
}

export default api
