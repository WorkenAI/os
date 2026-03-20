'use client'

import { ArrowUp, PanelLeftClose, PanelLeftOpen, Sparkles, TerminalSquare } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getDefaultExecutionSignalDefinition } from '@/execution/kernel'
import type { StoredExecutionCase, WorkenAiDelegationPolicy } from '@/execution/types'
import { cn } from '@/lib/utils'
import { MessageRenderer } from '@/shell/chat/message-renderer'
import { buildExecutionPolicyUrl, buildExecutionRunsUrl } from '@/shell/runtime/session/transport'
import { useShellSession } from '@/shell/session/context'

type WorkspaceId = 'docs' | 'runtime' | 'integrations' | 'visuals'

type WorkspaceDefinition = {
  id: WorkspaceId
  title: string
  icon: string
  summary: string
  description: string
  docs: string[]
  targets: string[]
  capabilities: string[]
  prompts: string[]
}

const WORKSPACES: Record<WorkspaceId, WorkspaceDefinition> = {
  docs: {
    id: 'docs',
    title: 'Repo Context',
    icon: '📚',
    summary: 'The agent reads docs and code before proposing a patch.',
    description:
      'The code agent starts from context: it reads architecture, shell contracts, and current domain surfaces so changes stay on Worken OS primitives—not beside them.',
    docs: [
      'docs/architecture/worken-os-shell-runtime.md',
      'docs/apps/worken-os.md',
      'docs/architecture/agents.md',
    ],
    targets: [
      'apps/worken-os/src/domains/',
      'apps/worken-os/src/shell/runtime/',
      'apps/worken-os/src/shell/layout/',
    ],
    capabilities: ['read architecture', 'trace domain semantics', 'map shell slots'],
    prompts: [
      'Explain the current Worken OS architecture and which shell primitives matter here.',
      'Which files should I read before changing the Worken OS runtime?',
      'How should a developer agent read docs and code without breaking shell abstractions?',
    ],
  },
  runtime: {
    id: 'runtime',
    title: 'Patch Planner',
    icon: '🧠',
    summary: 'The agent drafts patches for manifests, slots and surfaces.',
    description:
      'The layer where the code agent ties a change request to concrete primitives: manifest, slots, local surfaces, session flow, and policy.',
    docs: [
      'apps/worken-os/src/domains/manifest.ts',
      'apps/worken-os/src/domains/registry.ts',
      'apps/worken-os/src/shell/runtime/screen/shell-screen.tsx',
    ],
    targets: [
      'DomainDefinition',
      'ShellFrame slots',
      'localOnlyViewIds',
      'session activation flow',
    ],
    capabilities: ['draft patch', 'extend runtime', 'change local surfaces'],
    prompts: [
      'Help me plan a shell runtime patch without breaking the overall Worken OS model.',
      'How do I add a new domain or local surface using existing manifest contracts?',
      'Propose a safe patch plan for changing the session activation flow.',
    ],
  },
  integrations: {
    id: 'integrations',
    title: 'Capability Wiring',
    icon: '🔌',
    summary: 'The agent binds tools, adapters and delivery capabilities.',
    description:
      'This surface connects the code agent to the adapter layer, tool bindings, and workflow hooks—capabilities become part of the OS, not a bolt-on integration.',
    docs: ['docs/architecture/agents.md', 'packages/integrations/', 'packages/platform/'],
    targets: ['tool adapters', 'agent capability registry', 'workflow hooks', 'server routes'],
    capabilities: ['bind adapters', 'wire tools', 'ship capability connectors'],
    prompts: [
      'How do I embed a new integration in Worken OS via the code agent and shell primitives?',
      'Sketch capability wiring between the developer domain and the integrations layer.',
      'How should tool binding look like part of the OS, not a separate service?',
    ],
  },
  visuals: {
    id: 'visuals',
    title: 'Surface Delivery',
    icon: '🎨',
    summary: 'The agent ships visual surfaces through shell primitives.',
    description:
      'Visuals stay in the agent loop: the code agent changes scenes, widgets, and shell-native surfaces—but always through stable operating chrome.',
    docs: [
      'apps/worken-os/src/visualization/landing/registry.tsx',
      'apps/worken-os/src/visualization/landing/use-worken-os.ts',
      'apps/worken-os/src/components/BusinessFlowScene.tsx',
      'apps/worken-os/src/components/ShellPreview.tsx',
      'apps/worken-os/src/app/page.tsx',
    ],
    targets: [
      'landing scene registry',
      'landing interaction controller',
      'scene animations',
      'preview states',
      'domain accents',
      'widget composition',
    ],
    capabilities: ['ship widget', 'patch visual flow', 'extend shell-native surfaces'],
    prompts: [
      'How do I swap the landing scene or change the visual flow without editing page-level runtime?',
      'Suggest a patch for ShellPreview or landing visuals without breaking shell contracts.',
      'Which UI primitives should I reuse for a new visual surface?',
    ],
  },
}

const WORKSPACE_ORDER: WorkspaceId[] = ['docs', 'runtime', 'integrations', 'visuals']

type DeveloperStudioApi = {
  activeWorkspaceId: WorkspaceId
  setActiveWorkspaceId: (workspaceId: WorkspaceId) => void
  workspace: WorkspaceDefinition
}

const DeveloperStudioContext = createContext<DeveloperStudioApi | null>(null)

function useDeveloperStudio() {
  const context = use(DeveloperStudioContext)
  if (!context) {
    throw new Error('Developer Studio components must be used inside DeveloperStudioProvider')
  }
  return context
}

export function DeveloperStudioProvider({ children }: { children: ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId>('docs')

  const api = useMemo<DeveloperStudioApi>(
    () => ({
      activeWorkspaceId,
      setActiveWorkspaceId,
      workspace: WORKSPACES[activeWorkspaceId],
    }),
    [activeWorkspaceId],
  )

  return <DeveloperStudioContext value={api}>{children}</DeveloperStudioContext>
}

export function DeveloperStudioSidebarPanel({
  onToggleCollapse,
  isSidebarCollapsed = false,
}: {
  onToggleCollapse?: () => void
  isSidebarCollapsed?: boolean
}) {
  const { activeWorkspaceId, setActiveWorkspaceId, workspace } = useDeveloperStudio()
  const { isBusy, sendMessage } = useShellSession()

  return (
    <div className="flex h-full flex-col px-3 py-3">
      <div className="shrink-0 rounded-[1.25rem] bg-white/5 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">🧑‍💻</span>
              <span className="text-sm font-medium text-zinc-100">Code Agent</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              Read context, draft patches and ship capabilities through Worken OS primitives.
            </p>
          </div>
          {onToggleCollapse ? (
            <button
              onClick={onToggleCollapse}
              className="hidden rounded-xl p-1.5 text-zinc-500 transition-colors hover:bg-white/8 hover:text-zinc-300 md:flex"
              title={isSidebarCollapsed ? 'Expand left panel' : 'Collapse left panel'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 px-1">
        <div className="rounded-[1.25rem] bg-zinc-900/50 p-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Agent Loop</p>
          <p className="mt-2 text-sm text-zinc-300">
            Read context, chat, draft patch, ship capability.
          </p>
        </div>
      </div>

      <ScrollArea className="mt-3 flex-1 px-1">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Workspaces
            </p>
            <div className="space-y-1">
              {WORKSPACE_ORDER.map((workspaceId) => {
                const workspace = WORKSPACES[workspaceId]
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => setActiveWorkspaceId(workspace.id)}
                    className={cn(
                      'w-full rounded-2xl px-3 py-3 text-left transition-all',
                      activeWorkspaceId === workspace.id
                        ? 'bg-white/10 text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                        : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-base leading-none">{workspace.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{workspace.title}</div>
                        <p
                          className={cn(
                            'mt-1 text-[11px]',
                            activeWorkspaceId === workspace.id ? 'text-zinc-400' : 'text-zinc-500',
                          )}
                        >
                          {workspace.summary}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Quick prompts
            </p>
            <div className="space-y-2">
              {workspace.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isBusy}
                  onClick={() => void sendMessage(prompt)}
                  className={cn(
                    'w-full rounded-2xl bg-zinc-950/40 px-3 py-2.5 text-left text-sm text-zinc-400 transition-all hover:bg-white/5 hover:text-zinc-200',
                    isBusy && 'cursor-not-allowed opacity-50 hover:text-zinc-400',
                  )}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function WorkspaceCard({
  title,
  items,
  badge,
}: {
  title: string
  items: string[]
  badge?: string
}) {
  return (
    <div className="rounded-3xl bg-zinc-900/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        {badge ? (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {badge}
          </Badge>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-black/20 px-3 py-2 text-sm text-zinc-400">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DeveloperStudioConversation({
  disclaimer,
  hint,
}: {
  disclaimer?: string
  hint?: string
}) {
  const { workspace } = useDeveloperStudio()
  const { domain, error, executeSidebarAction, isBusy, messages, navigateToSpec, sendMessage } =
    useShellSession()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const domainTitle = domain?.title ?? 'Developer'

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

    setInput('')
    void sendMessage(text)
  }, [input, isBusy, sendMessage])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-4">
          <div className="rounded-3xl bg-zinc-900/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                {workspace.icon} {workspace.title}
              </Badge>
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                uses useChatUI
              </Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-zinc-100">
              Code agent inside the shell
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">{workspace.description}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <WorkspaceCard title="Read first" items={workspace.docs} badge="docs" />
            <WorkspaceCard title="Change targets" items={workspace.targets} badge="runtime" />
          </div>

          {messages.length === 0 ? (
            <div className="rounded-3xl bg-zinc-950/40 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="shell-accent-soft-bg shell-accent-text mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <TerminalSquare size={22} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100">
                  Worken OS · {domainTitle} Code Agent
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                  This agent runs inside the shell, uses the current chat runtime, and helps read repo
                  context, propose patches, and design capabilities on Worken OS primitives.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {workspace.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isBusy}
                      onClick={() => void sendMessage(prompt)}
                      className={cn(
                        'rounded-full bg-zinc-900/50 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-800/80',
                        isBusy && 'cursor-not-allowed opacity-50 hover:bg-zinc-900/40',
                      )}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {messages.map((message) => (
                <MessageRenderer
                  key={message.id}
                  message={message}
                  onSpecRequest={navigateToSpec}
                  onActionRequest={executeSidebarAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 bg-zinc-950/20 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl">
          <div className="relative flex items-end rounded-3xl bg-zinc-900/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors focus-within:bg-zinc-900/70">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isBusy
                  ? `Code agent is connecting to ${workspace.title}...`
                  : `Ask the code agent about ${workspace.title.toLowerCase()}...`
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
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-zinc-600">
            <span>{error ?? disclaimer}</span>
            {hint ? <span className="shell-accent-text">{hint}</span> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DeveloperStudioInspectorPanel() {
  const { workspace } = useDeveloperStudio()
  const signal = getDefaultExecutionSignalDefinition()
  const [policy, setPolicy] = useState<WorkenAiDelegationPolicy | null>(null)
  const [activeCase, setActiveCase] = useState<StoredExecutionCase | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const resolvedSignalType = activeCase?.signalType ?? signal?.signalType ?? null
  const policyControls = signal?.policyControls ?? []
  const primaryRuntimeDomainId = signal?.defaultDomainId ?? 'sales'
  const primaryRuntimeViewId = signal?.defaultViewId ?? 'pipeline-board'

  const refreshRuntimeState = useCallback(async () => {
    if (!resolvedSignalType) return

    const [policyResponse, caseResponse] = await Promise.all([
      fetch(buildExecutionPolicyUrl(resolvedSignalType), { cache: 'no-store' }),
      fetch(
        buildExecutionRunsUrl({
          signalType: resolvedSignalType,
          domainId: primaryRuntimeDomainId,
          viewId: primaryRuntimeViewId,
          autoStart: false,
        }),
        { cache: 'no-store' },
      ),
    ])

    if (policyResponse.ok) {
      const policyPayload = (await policyResponse.json()) as { policy: WorkenAiDelegationPolicy }
      setPolicy(policyPayload.policy)
    }

    if (caseResponse.ok) {
      const casePayload = (await caseResponse.json()) as { case: StoredExecutionCase | null }
      setActiveCase(casePayload.case)
    }
  }, [primaryRuntimeDomainId, primaryRuntimeViewId, resolvedSignalType])

  useEffect(() => {
    void refreshRuntimeState()
  }, [refreshRuntimeState])

  const updatePolicy = useCallback(
    async (updater: (current: WorkenAiDelegationPolicy) => WorkenAiDelegationPolicy) => {
      if (!policy) return
      const nextPolicy = updater(policy)
      setPolicy(nextPolicy)
      setIsSaving(true)

      try {
        await fetch('/api/shell/execution/policy', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signalType: resolvedSignalType,
            policy: nextPolicy,
          }),
        })
      } finally {
        setIsSaving(false)
      }
    },
    [policy, resolvedSignalType],
  )

  const emitRestartSignal = useCallback(async () => {
    if (!resolvedSignalType) return

    setIsSaving(true)
    try {
      await fetch('/api/shell/execution/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalType: resolvedSignalType,
          domainId: primaryRuntimeDomainId,
          viewId: primaryRuntimeViewId,
          source: 'manual',
          forceRestart: true,
        }),
      })
      await refreshRuntimeState()
    } finally {
      setIsSaving(false)
    }
  }, [primaryRuntimeDomainId, primaryRuntimeViewId, refreshRuntimeState, resolvedSignalType])

  return (
    <div className="flex h-full flex-col bg-zinc-950/20 px-3 py-3">
      <div className="flex items-center justify-between rounded-[1.25rem] bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🛠️</span>
          <span className="text-sm font-medium text-zinc-100">Agent Inspector</span>
        </div>
      </div>

      <ScrollArea className="mt-3 flex-1">
        <div className="space-y-4 px-1 pb-1">
          <div className="rounded-3xl bg-zinc-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">AI autonomy</p>
            <div className="mt-3 space-y-3 text-sm text-zinc-300">
              {policyControls.map((control) => {
                const enabled = policy?.review.requiredFor.includes(control.actionClass) ?? false

                return (
                  <button
                    key={control.actionClass}
                    type="button"
                    onClick={() =>
                      void updatePolicy((current) => ({
                        ...current,
                        review: {
                          ...current.review,
                          requiredFor: enabled
                            ? current.review.requiredFor.filter(
                                (item) => item !== control.actionClass,
                              )
                            : [...current.review.requiredFor, control.actionClass],
                        },
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-left"
                  >
                    <div className="min-w-0">
                      <div>{control.label}</div>
                      <p className="mt-1 text-xs text-zinc-500">{control.description}</p>
                    </div>
                    <span className={enabled ? 'text-cyan-400' : 'text-zinc-500'}>
                      {enabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )
              })}
              <div className="rounded-xl bg-black/20 px-3 py-2">
                <p className="text-zinc-500">Max autonomous steps</p>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      void updatePolicy((current) => ({
                        ...current,
                        maxAutonomousSteps: Math.max(0, current.maxAutonomousSteps - 1),
                      }))
                    }
                    className="rounded-lg bg-zinc-800 px-2 py-1"
                  >
                    −
                  </button>
                  <span className="font-medium text-zinc-100">
                    {policy?.maxAutonomousSteps ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void updatePolicy((current) => ({
                        ...current,
                        maxAutonomousSteps: current.maxAutonomousSteps + 1,
                      }))
                    }
                    className="rounded-lg bg-zinc-800 px-2 py-1"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void emitRestartSignal()}
                className="w-full rounded-xl border border-zinc-700/70 bg-zinc-800/50 px-3 py-2 text-left text-sm text-zinc-200"
              >
                {isSaving ? 'Updating runtime…' : `Restart ${signal?.title ?? 'execution signal'}`}
              </button>
            </div>
          </div>

          <WorkspaceCard title="Agent capabilities" items={workspace.capabilities} badge="impact" />

          <WorkspaceCard
            title="Active durable case"
            items={
              activeCase
                ? [
                    activeCase.state.company,
                    activeCase.state.nextAction,
                    `Signal: ${activeCase.signalType}`,
                    `Status: ${activeCase.status}`,
                  ]
                : ['No active case yet', 'Use restart to spawn a new durable run']
            }
            badge="case"
          />

          <div className="rounded-3xl bg-zinc-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Guardrails</p>
            <div className="mt-3 space-y-2 text-sm text-zinc-400">
              <div className="rounded-xl bg-black/20 px-3 py-2">
                Keep ShellFrame stable while semantics evolve.
              </div>
              <div className="rounded-xl bg-black/20 px-3 py-2">
                Pause on typed checkpoints instead of hidden side effects.
              </div>
              <div className="rounded-xl bg-black/20 px-3 py-2">
                Route all autonomy through manifests, workflow hooks and server-owned policy.
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
