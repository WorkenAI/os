import type { ChatMessage } from '@json-render/react'
import type { MessageBlock, ShellMessage } from '@/shell/chat/types'

const REASONING_OPEN = '[[reasoning'
const REASONING_CLOSE = '[[/reasoning]]'

function parseReasoningHeader(text: string) {
  const headerEnd = text.indexOf(']]')
  if (!text.startsWith(REASONING_OPEN) || headerEnd === -1) {
    return null
  }

  const header = text.slice(2, headerEnd)
  const title = header.includes(':') ? header.slice(header.indexOf(':') + 1).trim() : undefined

  return {
    title,
    bodyStart: headerEnd + 2,
  }
}

function parseAssistantText(text: string): MessageBlock[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const header = parseReasoningHeader(trimmed)
  if (!header) {
    return [{ type: 'text', text: trimmed }]
  }

  const remainder = trimmed.slice(header.bodyStart).replace(/^\n+/, '')
  const closeIndex = remainder.indexOf(REASONING_CLOSE)

  if (closeIndex === -1) {
    return [
      {
        type: 'reasoning',
        title: header.title,
        text: remainder.trim(),
        status: 'streaming',
      },
    ]
  }

  const reasoningText = remainder.slice(0, closeIndex).trim()
  const trailingText = remainder.slice(closeIndex + REASONING_CLOSE.length).trim()
  const blocks: MessageBlock[] = [
    {
      type: 'reasoning',
      title: header.title,
      text: reasoningText,
      status: 'complete',
    },
  ]

  if (trailingText) {
    blocks.push({ type: 'text', text: trailingText })
  }

  return blocks
}

export function toReasoningEnvelope({ title, body }: { title?: string; body: string }) {
  const normalizedTitle = title?.trim()
  const open = normalizedTitle ? `[[reasoning:${normalizedTitle}]]` : '[[reasoning]]'
  return `${open}\n${body.trim()}\n${REASONING_CLOSE}`
}

export function mapChatMessageToShellMessage(message: ChatMessage): ShellMessage {
  const isUser = message.role === 'user'
  const blocks: MessageBlock[] = isUser ? [] : parseAssistantText(message.text)

  if (isUser && message.text.trim()) {
    blocks.push({ type: 'text', text: message.text.trim() })
  }

  if (message.spec) {
    blocks.push({
      type: 'business-object',
      spec: message.spec as unknown as Record<string, unknown>,
    })
  }

  return {
    id: message.id,
    role: message.role,
    appearance:
      !isUser && blocks.some((block) => block.type === 'reasoning' && block.status === 'streaming')
        ? 'thinking'
        : 'default',
    blocks,
    timestamp: Date.now(),
  }
}
