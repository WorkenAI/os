export type MessageBlock =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string; title?: string; status?: 'streaming' | 'complete' }
  | { type: 'business-object'; spec: Record<string, unknown> }
  | {
      type: 'action-group'
      actions: Array<{ id: string; label: string; verb: string; entityType?: string }>
    }

export type ShellMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  appearance?: 'default' | 'thinking'
  blocks: MessageBlock[]
  timestamp: number
}
