'use client'

import { Bot, Brain, ChevronDown, ChevronRight, User } from 'lucide-react'
import { useMachine } from '@xstate/react'
import { useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { reasoningBlockMachine } from '@worken/shell-web/machines/reasoning-block-machine'
import { BusinessObjectRenderer } from './business-object-renderer'
import type { MessageBlock, ShellMessage } from './types'

function ReasoningBlock({
  block,
  isThinking,
}: {
  block: Extract<MessageBlock, { type: 'reasoning' }>
  isThinking: boolean
}) {
  const [snapshot, send] = useMachine(reasoningBlockMachine)
  const isOpen = snapshot.context.isOpen

  useEffect(() => {
    send({
      type: 'sync',
      isOpen: block.status === 'streaming',
    })
  }, [block.status, send])

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 in-data-[shell-theme='light']:border-zinc-700/80 in-data-[shell-theme='light']:bg-zinc-900/40">
      <button
        type="button"
        onClick={() => send({ type: 'toggle' })}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-zinc-800/40"
      >
        {isOpen ? (
          <ChevronDown size={14} className="shrink-0 text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-zinc-500" />
        )}
        <Brain
          size={14}
          className={cn('shell-accent-text shrink-0', isThinking && 'animate-pulse')}
        />
        <span className="text-xs font-medium text-zinc-400">
          {isThinking ? 'Agent is thinking...' : (block.title ?? 'Reasoning')}
        </span>
        {isThinking ? <span className="shell-thinking-dots ml-auto" aria-hidden="true" /> : null}
      </button>
      {isOpen ? (
        <div className="border-t border-zinc-800/70 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-400">
          {block.text}
        </div>
      ) : null}
    </div>
  )
}

function BlockRenderer({
  block,
  isThinking,
  onSpecRequest,
  onActionRequest,
}: {
  block: MessageBlock
  isThinking: boolean
  onSpecRequest?: (specId: string) => void
  onActionRequest?: (input: { verb: string; entityType?: string }) => void
}) {
  switch (block.type) {
    case 'text':
      return (
        <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{block.text}</p>
      )
    case 'reasoning':
      return <ReasoningBlock block={block} isThinking={isThinking} />
    case 'business-object':
      return (
        <div className="mt-2">
          <BusinessObjectRenderer spec={block.spec} />
        </div>
      )
    case 'action-group':
      return (
        <div className="mt-3 flex flex-wrap gap-2">
          {block.actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                if (action.verb) {
                  onActionRequest?.({ verb: action.verb, entityType: action.entityType })
                  return
                }
                onSpecRequest?.(action.id)
              }}
              className="shell-accent-hover rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              {action.label}
            </button>
          ))}
        </div>
      )
  }
}

export function MessageRenderer({
  message,
  onSpecRequest,
  onActionRequest,
}: {
  message: ShellMessage
  onSpecRequest?: (specId: string) => void
  onActionRequest?: (input: { verb: string; entityType?: string }) => void
}) {
  const isUser = message.role === 'user'
  const isThinking = message.appearance === 'thinking'

  return (
    <div className={cn('shell-message-enter flex gap-3 px-4 py-3', isUser && 'flex-row-reverse')}>
      <Avatar
        className={cn(
          'mt-0.5 h-7 w-7 shrink-0',
          isUser ? 'bg-zinc-800' : 'shell-accent-soft-bg',
          isThinking && 'animate-pulse',
        )}
        style={
          isThinking && !isUser
            ? { boxShadow: '0 0 0 2px rgba(var(--shell-accent-rgb), 0.28)' }
            : undefined
        }
      >
        <AvatarFallback
          className={
            isUser ? 'bg-zinc-800 text-zinc-400' : 'shell-accent-soft-bg shell-accent-text'
          }
        >
          {isUser ? <User size={14} /> : <Bot size={14} />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'min-w-0 space-y-2',
          isUser ? 'max-w-[85%] items-end' : 'max-w-full',
        )}
      >
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm bg-zinc-800/80 px-4 py-2.5">
            {message.blocks.map((block, i) => (
              <BlockRenderer
                key={i}
                block={block}
                isThinking={false}
                onSpecRequest={onSpecRequest}
                onActionRequest={onActionRequest}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {message.blocks.map((block, i) => (
              <BlockRenderer
                key={i}
                block={block}
                isThinking={isThinking}
                onSpecRequest={onSpecRequest}
                onActionRequest={onActionRequest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
