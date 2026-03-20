'use client'

import { applySpecPatch, createMixedStreamParser, type Spec } from '@json-render/core'
import { type ChatMessage, useChatUI } from '@json-render/react'
import { useRouter } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getDomainViewExecution, getViewLabel, isLocalOnlyView } from '@/domains/manifest'
import { DOMAIN_IDS, loadDomain } from '@/domains/registry'
import type { DomainDefinition } from '@/domains/types'
import type { StoredExecutionCase } from '@/execution/types'
import type { ShellMessage } from '@/shell/chat/types'
import { useShellEntityRecord } from '@/shell/entities/mock-data'
import { useShell } from '@/shell/machines/context'
import { usePermissions } from '@/shell/permissions/context'
import { getAllowedViewId } from '@/shell/runtime/policy/selectors'
import { mergeOrderedShellMessages } from '@/shell/runtime/session/messages'
import { buildShellBreadcrumbPath } from '@/shell/runtime/session/navigation'
import {
  buildChatRouteUrl,
  buildExecutionRunsUrl,
  parseJsonError,
} from '@/shell/runtime/session/transport'
import { clearShellSessionDispatcher, setShellSessionDispatcher } from './dispatch'

type SessionStatus = 'idle' | 'loading' | 'bootstrapping' | 'ready' | 'forbidden' | 'error'

type OrderedMessageRef = { source: 'manual' | 'chat'; id: string }

type ShellSessionApi = {
  domain: DomainDefinition | null
  activeView: string | null
  viewTitle: string | null
  executionCase: StoredExecutionCase | null
  messages: ShellMessage[]
  status: SessionStatus
  error: string | null
  isBusy: boolean
  canAccessCurrentDomain: boolean
  activateDomain: (domainId: string) => Promise<void>
  navigateToSpec: (specId: string) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  executeSidebarAction: (input: { verb: string; entityType?: string }) => Promise<void>
  openInspector: (target: { entityType: string; id: string }) => void
  refreshExecutionCase: () => Promise<void>
}

const ShellSessionContext = createContext<ShellSessionApi | null>(null)

export function ShellSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { send: sendShell } = useShell()
  const { currentRole, canAccessDomain, canExecuteEntityAction, canExecuteVerb } = usePermissions()
  const [domain, setDomain] = useState<DomainDefinition | null>(null)
  const [activeView, setActiveView] = useState<string | null>(null)
  const [executionCase, setExecutionCase] = useState<StoredExecutionCase | null>(null)
  const [manualMessages, setManualMessages] = useState<Record<string, ChatMessage>>({})
  const [messageOrder, setMessageOrder] = useState<OrderedMessageRef[]>([])
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isManualStreaming, setIsManualStreaming] = useState(false)
  const manualAbortRef = useRef<AbortController | null>(null)
  const activationRef = useRef(0)
  const knownChatIdsRef = useRef<Set<string>>(new Set())
  const api = useMemo(
    () => buildChatRouteUrl(domain?.id ?? null, activeView),
    [domain?.id, activeView],
  )

  const {
    clear: clearChat,
    isStreaming: isChatStreaming,
    messages: chatMessagesSource,
    send: sendChatMessage,
  } = useChatUI({
    api,
    onError: (err) => setError(err.message),
  })

  const clearConversationState = useCallback(() => {
    manualAbortRef.current?.abort()
    manualAbortRef.current = null
    knownChatIdsRef.current = new Set()
    setManualMessages({})
    setMessageOrder([])
    setExecutionCase(null)
    setError(null)
    clearChat()
  }, [clearChat])

  const upsertManualMessage = useCallback((message: ChatMessage) => {
    setManualMessages((prev) => ({ ...prev, [message.id]: message }))
  }, [])

  const loadExecutionCase = useCallback(
    async (nextDomain: DomainDefinition | null, nextView: string | null) => {
      if (!nextDomain || !nextView) {
        setExecutionCase(null)
        return null
      }

      const execution = getDomainViewExecution(nextDomain, nextView)
      if (!execution) {
        setExecutionCase(null)
        return null
      }

      const response = await fetch(
        buildExecutionRunsUrl({
          signalType: execution.signalType,
          domainId: nextDomain.id,
          viewId: nextView,
          autoStart: execution.autoStart,
        }),
        { cache: 'no-store' },
      )

      if (!response.ok) {
        throw new Error(await parseJsonError(response))
      }

      const payload = (await response.json()) as { case: StoredExecutionCase | null }
      setExecutionCase(payload.case)
      return payload.case
    },
    [],
  )

  const streamAssistantTurn = useCallback(
    async (
      payload: {
        mode: 'bootstrap' | 'view' | 'verb'
        domainId: string
        activeView?: string | null
        specId?: string
        verb?: string
        entityType?: string
        ids?: string[]
      },
      append = true,
    ) => {
      manualAbortRef.current?.abort()
      const controller = new AbortController()
      manualAbortRef.current = controller

      const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        text: '',
        spec: null,
      }

      upsertManualMessage(assistantMessage)
      if (append) {
        setMessageOrder((prev) => [...prev, { source: 'manual', id: assistantId }])
      }
      setIsManualStreaming(true)

      let accumulatedText = ''
      const currentSpec: Spec = { root: '', elements: {} }
      let hasSpec = false

      try {
        const response = await fetch(
          buildChatRouteUrl(payload.domainId, payload.activeView ?? null),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: payload.mode,
              specId: payload.specId,
              verb: payload.verb,
              entityType: payload.entityType,
              ids: payload.ids,
            }),
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error(await parseJsonError(response))
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        const parser = createMixedStreamParser({
          onPatch(patch) {
            hasSpec = true
            applySpecPatch(currentSpec, patch)
            upsertManualMessage({
              id: assistantId,
              role: 'assistant',
              text: accumulatedText,
              spec: {
                root: currentSpec.root,
                elements: { ...currentSpec.elements },
                ...(currentSpec.state ? { state: { ...currentSpec.state } } : {}),
              },
            })
          },
          onText(line) {
            accumulatedText += `${accumulatedText ? '\n' : ''}${line}`
            upsertManualMessage({
              id: assistantId,
              role: 'assistant',
              text: accumulatedText,
              spec: hasSpec
                ? {
                    root: currentSpec.root,
                    elements: { ...currentSpec.elements },
                    ...(currentSpec.state ? { state: { ...currentSpec.state } } : {}),
                  }
                : null,
            })
          },
        })

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          parser.push(decoder.decode(value, { stream: true }))
        }

        parser.flush()
      } catch (streamError) {
        if (!(streamError instanceof Error) || streamError.name !== 'AbortError') {
          setError(streamError instanceof Error ? streamError.message : 'Unknown stream error')
        }
      } finally {
        if (manualAbortRef.current === controller) {
          manualAbortRef.current = null
        }
        setIsManualStreaming(false)
      }
    },
    [upsertManualMessage],
  )

  const activateDomain = useCallback(
    async (domainId: string) => {
      activationRef.current += 1
      const activationId = activationRef.current

      clearConversationState()
      setStatus('loading')

      if (!DOMAIN_IDS.includes(domainId as (typeof DOMAIN_IDS)[number])) {
        setDomain(null)
        setActiveView(null)
        setStatus('error')
        setError(`Unknown domain: ${domainId}`)
        return
      }

      const nextDomain = await loadDomain(domainId)
      if (activationRef.current !== activationId) return

      const nextActiveView = getAllowedViewId(nextDomain, currentRole)
      setDomain(nextDomain)
      setActiveView(nextActiveView)
      sendShell({ type: 'domain.activate', domainId })
      sendShell({
        type: 'breadcrumbs.set',
        path: buildShellBreadcrumbPath(nextDomain, nextActiveView),
      })

      if (!canAccessDomain(domainId)) {
        setStatus('forbidden')
        return
      }

      if (isLocalOnlyView(nextDomain, nextActiveView)) {
        setExecutionCase(null)
        setStatus('ready')
        return
      }

      setStatus('bootstrapping')
      await streamAssistantTurn({
        mode: 'bootstrap',
        domainId,
        activeView: nextActiveView,
      })
      await loadExecutionCase(nextDomain, nextActiveView)

      if (activationRef.current === activationId) {
        setStatus('ready')
      }
    },
    [
      canAccessDomain,
      clearConversationState,
      currentRole,
      loadExecutionCase,
      sendShell,
      streamAssistantTurn,
    ],
  )

  const navigateToSpec = useCallback(
    async (specId: string) => {
      if (!domain) return

      const allowedSpecId = getAllowedViewId(domain, currentRole, specId)
      setActiveView(allowedSpecId)
      sendShell({ type: 'breadcrumbs.set', path: buildShellBreadcrumbPath(domain, allowedSpecId) })

      if (!allowedSpecId) {
        setError(`No accessible sections in ${domain.title} for role ${currentRole.name}`)
        return
      }

      if (isLocalOnlyView(domain, allowedSpecId)) {
        setExecutionCase(null)
        setError(null)
        return
      }

      await streamAssistantTurn({
        mode: 'view',
        domainId: domain.id,
        activeView: allowedSpecId,
        specId,
      })
      await loadExecutionCase(domain, allowedSpecId)
    },
    [currentRole, currentRole.name, domain, loadExecutionCase, sendShell, streamAssistantTurn],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      setError(null)
      await sendChatMessage(text)
      await loadExecutionCase(domain, activeView)
    },
    [activeView, domain, loadExecutionCase, sendChatMessage],
  )

  const executeSidebarAction = useCallback(
    async ({ verb, entityType }: { verb: string; entityType?: string }) => {
      if (!domain) return

      const isAllowed =
        (entityType ? canExecuteEntityAction(domain.id, entityType, verb) : false) ||
        canExecuteVerb(domain.id, verb)

      if (!isAllowed) {
        setError(`Action "${verb}" is not allowed for role ${currentRole.name}`)
        return
      }

      const execution = getDomainViewExecution(domain, activeView)
      if (execution && verb === 'create') {
        const response = await fetch('/api/shell/execution/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signalType: execution.signalType,
            domainId: domain.id,
            viewId: activeView ?? domain.surfaces.defaultViewId,
            source: 'manual',
            forceRestart: true,
          }),
        })
        if (!response.ok) {
          throw new Error(await parseJsonError(response))
        }
        await streamAssistantTurn({
          mode: 'view',
          domainId: domain.id,
          activeView,
        })
        await loadExecutionCase(domain, activeView)
        return
      }

      await streamAssistantTurn({
        mode: 'verb',
        domainId: domain.id,
        activeView,
        verb,
        entityType,
      })
      await loadExecutionCase(domain, activeView)
    },
    [
      activeView,
      canExecuteEntityAction,
      canExecuteVerb,
      currentRole.name,
      domain,
      loadExecutionCase,
      streamAssistantTurn,
    ],
  )

  const openInspector = useCallback(
    ({ entityType, id }: { entityType: string; id: string }) => {
      sendShell({ type: 'inspector.open', entityType, id })
    },
    [sendShell],
  )

  useEffect(() => {
    const unseen = chatMessagesSource.filter((message) => !knownChatIdsRef.current.has(message.id))
    if (unseen.length === 0) return

    setMessageOrder((prev) => [
      ...prev,
      ...unseen.map((message) => ({ source: 'chat' as const, id: message.id })),
    ])

    for (const message of unseen) {
      knownChatIdsRef.current.add(message.id)
    }
  }, [chatMessagesSource])

  useEffect(() => {
    return () => {
      manualAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!domain) return

    if (!canAccessDomain(domain.id)) {
      clearConversationState()
      setStatus('forbidden')
      return
    }

    const allowedSpecId = getAllowedViewId(domain, currentRole, activeView)
    if (allowedSpecId && allowedSpecId !== activeView && status !== 'loading') {
      setActiveView(allowedSpecId)
      if (isLocalOnlyView(domain, allowedSpecId)) {
        setExecutionCase(null)
        setStatus('ready')
        return
      }
      void streamAssistantTurn({
        mode: 'bootstrap',
        domainId: domain.id,
        activeView: allowedSpecId,
      })
      void loadExecutionCase(domain, allowedSpecId)
    }
  }, [
    activeView,
    canAccessDomain,
    clearConversationState,
    currentRole,
    domain,
    loadExecutionCase,
    status,
    streamAssistantTurn,
  ])

  useEffect(() => {
    setShellSessionDispatcher({
      navigateToPath: (path) => router.push(path),
      openInspector,
      selectEntities: ({ entityType, ids }) => {
        const firstId = ids[0]
        if (firstId) {
          openInspector({ entityType, id: firstId })
        }
      },
      executeVerb: ({ verb, entityType, ids }) => {
        if (
          entityType &&
          ids.length > 0 &&
          canExecuteEntityAction(domain?.id ?? '', entityType, verb)
        ) {
          void executeSidebarAction({ verb, entityType })
          return
        }

        if (domain?.id && canExecuteVerb(domain.id, verb)) {
          void executeSidebarAction({ verb, entityType })
        }
      },
    })

    return () => clearShellSessionDispatcher()
  }, [
    canExecuteEntityAction,
    canExecuteVerb,
    domain?.id,
    executeSidebarAction,
    openInspector,
    router,
  ])

  const combinedMessages = useMemo(
    () =>
      mergeOrderedShellMessages({
        chatMessagesSource,
        manualMessages,
        messageOrder,
      }),
    [chatMessagesSource, manualMessages, messageOrder],
  )

  const viewTitle = useMemo(
    () => (domain ? getViewLabel(domain, activeView) : null),
    [activeView, domain],
  )

  const apiValue = useMemo<ShellSessionApi>(
    () => ({
      domain,
      activeView,
      viewTitle,
      executionCase,
      messages: combinedMessages,
      status,
      error,
      isBusy:
        isManualStreaming || isChatStreaming || status === 'loading' || status === 'bootstrapping',
      canAccessCurrentDomain: domain ? canAccessDomain(domain.id) : false,
      activateDomain,
      navigateToSpec,
      sendMessage,
      executeSidebarAction,
      openInspector,
      refreshExecutionCase: async () => {
        await loadExecutionCase(domain, activeView)
      },
    }),
    [
      activateDomain,
      activeView,
      canAccessDomain,
      isChatStreaming,
      combinedMessages,
      domain,
      error,
      executionCase,
      executeSidebarAction,
      isManualStreaming,
      loadExecutionCase,
      navigateToSpec,
      openInspector,
      sendMessage,
      status,
      viewTitle,
    ],
  )

  return <ShellSessionContext value={apiValue}>{children}</ShellSessionContext>
}

export function useShellSession() {
  const context = use(ShellSessionContext)
  if (!context) {
    throw new Error('useShellSession must be used inside ShellSessionProvider')
  }
  return context
}

export function useCurrentInspectorEntity() {
  const { state } = useShell()

  if (!state.inspectorTarget) return null

  return useShellEntityRecord(state.inspectorTarget.entityType, state.inspectorTarget.id)
}
