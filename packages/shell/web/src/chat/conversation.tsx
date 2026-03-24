'use client'

import { ArrowUp, Sparkles } from 'lucide-react'
import { useMachine } from '@xstate/react'
import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useShellSession } from '@worken/shell-web/session/context'
import { conversationInputMachine } from '@worken/shell-web/machines/conversation-input-machine'
import { MessageRenderer } from './message-renderer'

type ConversationProps = {
  disclaimer?: string
}

export function Conversation({ disclaimer }: ConversationProps) {
  const { domain, error, executeSidebarAction, isBusy, messages, navigateToSpec, sendMessage } =
    useShellSession()
  const [inputSnapshot, sendInput] = useMachine(conversationInputMachine)
  const input = inputSnapshot.context.value
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const domainTitle = domain?.title ?? 'Worken OS'

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = useCallback(() => {
    if (isBusy) return

    const text = input.trim()
    if (!text) return

    sendInput({ type: 'input.clear' })
    void sendMessage(text)
  }, [input, isBusy, sendInput, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <div className="relative flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-24 pt-12">
        <div className="mx-auto max-w-5xl py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-32 text-center">
              <div className="shell-accent-soft-bg shell-accent-text mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Sparkles size={24} />
              </div>
              <h2 className="text-lg font-semibold text-zinc-200">Worken OS · {domainTitle}</h2>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                A workspace for people and AI agents. Type a prompt or pick a section in the
                sidebar.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageRenderer
                key={msg.id}
                message={msg}
                onSpecRequest={navigateToSpec}
                onActionRequest={executeSidebarAction}
              />
            ))
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-zinc-800/25 bg-zinc-950/40 px-4 py-3 backdrop-blur-xl transition-[background-color,border-color,backdrop-filter] duration-300 ease-out">
        <div className="mx-auto max-w-5xl">
          <div className="relative flex items-end rounded-2xl border border-zinc-800/40 bg-zinc-900/35 transition-[background-color,border-color] duration-300 ease-out focus-within:border-zinc-700">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => sendInput({ type: 'input.change', value: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder={
                isBusy
                  ? `Agent is connecting to ${domainTitle}...`
                  : `Ask something about ${domainTitle}...`
              }
              rows={1}
              disabled={isBusy}
              className="min-h-[44px] max-h-[200px] flex-1 resize-none bg-transparent px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={isBusy || !input.trim()}
              className={cn(
                'mb-2 mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                !isBusy && input.trim() ? 'shell-accent-button' : 'bg-zinc-800 text-zinc-600',
              )}
            >
              <ArrowUp size={16} />
            </button>
          </div>
          {error ? <p className="mt-2 text-center text-[11px] text-zinc-600">{error}</p> : null}
          {disclaimer ? (
            <p className="mt-1 text-center text-[10px] text-zinc-600">{disclaimer}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
