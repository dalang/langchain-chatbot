export interface Session {
  id: string
  user_id: string | null
  title: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  message_count: number
}

export interface Message {
  id: number
  session_id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  tool_calls: Record<string, any> | null
  created_at: string
  model: string | null
  tokens_used: number | null
  tool_steps: ToolStep[]
}

export interface ToolStep {
  id: number
  message_id: number
  step_number: number
  tool_name: string
  tool_input: Record<string, any>
  tool_output: string | null
  tool_error: string | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  status: string
}

export interface ChatState {
  sessionId: string
  messages: Message[]
  isLoading: boolean
  currentStreamingMessage: string
  toolSteps: ToolStep[]
}

export interface SSEEvent {
  type: 'message' | 'tool_start' | 'tool_result' | 'done' | 'error'
  content?: string
  tool?: string
  input?: Record<string, any>
  result?: string
  duration_ms?: number
  message?: string
}
