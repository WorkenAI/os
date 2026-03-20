import type { ChatMessage } from '@json-render/react'
import type { ShellMessage } from '@/shell/chat/types'
import { mapChatMessageToShellMessage } from '@/shell/session/message-format'

type OrderedMessageRef = { source: 'manual' | 'chat'; id: string }

export function mergeOrderedShellMessages(input: {
  chatMessagesSource: ChatMessage[]
  manualMessages: Record<string, ChatMessage>
  messageOrder: OrderedMessageRef[]
}) {
  const chatMessages = new Map(
    input.chatMessagesSource.map((message) => [message.id, mapChatMessageToShellMessage(message)]),
  )
  const manualTurns = new Map(
    Object.entries(input.manualMessages).map(([id, message]) => [
      id,
      mapChatMessageToShellMessage(message),
    ]),
  )

  return input.messageOrder
    .map((entry) =>
      entry.source === 'chat' ? chatMessages.get(entry.id) : manualTurns.get(entry.id),
    )
    .filter((message): message is ShellMessage => {
      if (!message) return false
      return message.role === 'user' || message.blocks.length > 0
    })
}
