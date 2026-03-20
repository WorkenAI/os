'use client'

import {
  Activity,
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  Eye,
  Link2,
  MessageSquare,
  Pencil,
  Plus,
  Reply,
  ScrollText,
  Settings,
  Shield,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { createContext, type ReactNode, use, useCallback, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { MessageRenderer } from '@/shell/chat/message-renderer'
import { useShellSession } from '@/shell/session/context'

// ─── Types ──────────────────────────────────────────────────────

type AgentDefinition = {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'disabled'
  roleId: string
  domainIds: string[]
  allowedActions: string[]
  deniedActions: string[]
  instruction: {
    systemPrompt: string
    personality?: string
    constraints: string[]
  }
  chatBindings: ChatBinding[]
  auditSummary: {
    totalActions: number
    lastActiveAt: string | null
  }
}

type ChatBinding = {
  channelId: string
  vendor: string
  direction: 'inbound' | 'outbound' | 'both'
  permissions: ChatPermissions
  autoReply: boolean
}

type ChatPermissions = {
  canRead: boolean
  canReply: boolean
  canInitiate: boolean
}

type AuditEntry = {
  id: string
  timestamp: string
  actorKind: 'ai' | 'human' | 'system'
  actorId: string
  kind: string
  objectId: string
  objectType: string
  verb?: string
  description: string
}

// ─── Demo data ──────────────────────────────────────────────────

const DEMO_AGENTS: AgentDefinition[] = [
  {
    id: 'agent-sales-1',
    name: 'Sales AI Agent',
    description: 'Inbound lead handling, data enrichment, proposal prep',
    status: 'active',
    roleId: 'sales-agent',
    domainIds: ['sales'],
    allowedActions: ['capture', 'enrich', 'assign', 'update', 'review', 'sync', 'close'],
    deniedActions: ['approve'],
    instruction: {
      systemPrompt:
        'You are a sales assistant. Process inbound leads, enrich data, prepare proposals.',
      personality: 'Professional, concise, data-driven.',
      constraints: [
        'Never approve your own work',
        'Never disclose pricing until lead is qualified',
        'Always enrich before assigning',
      ],
    },
    chatBindings: [
      {
        channelId: 'telegram-sales',
        vendor: 'telegram',
        direction: 'both',
        permissions: { canRead: true, canReply: true, canInitiate: false },
        autoReply: true,
      },
      {
        channelId: 'web-widget',
        vendor: 'worken',
        direction: 'inbound',
        permissions: { canRead: true, canReply: false, canInitiate: false },
        autoReply: false,
      },
    ],
    auditSummary: { totalActions: 47, lastActiveAt: '2026-03-17T10:30:00Z' },
  },
  {
    id: 'agent-support-1',
    name: 'Support AI Agent',
    description: 'First-line ticket triage, classification, and routing',
    status: 'paused',
    roleId: 'support-agent',
    domainIds: ['hr'],
    allowedActions: ['capture', 'assign', 'update', 'escalate', 'review'],
    deniedActions: ['approve', 'close'],
    instruction: {
      systemPrompt: 'You are a support agent. Triage, classify, and route tickets.',
      constraints: ['Never close tickets directly', 'Always escalate critical issues'],
    },
    chatBindings: [],
    auditSummary: { totalActions: 12, lastActiveAt: '2026-03-16T15:00:00Z' },
  },
]

const DEMO_AUDIT: AuditEntry[] = [
  {
    id: 'a-1',
    timestamp: '2026-03-17T10:30:00Z',
    actorKind: 'ai',
    actorId: 'agent-sales-1',
    kind: 'state_changed',
    objectId: 'obj-42',
    objectType: 'lead',
    verb: 'capture',
    description: 'Captured lead TechCorp (draft → open)',
  },
  {
    id: 'a-2',
    timestamp: '2026-03-17T10:31:00Z',
    actorKind: 'ai',
    actorId: 'agent-sales-1',
    kind: 'action_performed',
    objectId: 'obj-42',
    objectType: 'lead',
    verb: 'enrich',
    description: 'Enriched data: industry=fintech, budget=$150k',
  },
  {
    id: 'a-3',
    timestamp: '2026-03-17T10:32:00Z',
    actorKind: 'ai',
    actorId: 'agent-sales-1',
    kind: 'state_changed',
    objectId: 'obj-42',
    objectType: 'lead',
    verb: 'review',
    description: 'Requested review from Maria (in_progress → waiting_review)',
  },
  {
    id: 'a-4',
    timestamp: '2026-03-17T10:35:00Z',
    actorKind: 'human',
    actorId: 'human-maria',
    kind: 'state_changed',
    objectId: 'obj-42',
    objectType: 'lead',
    verb: 'approve',
    description: 'Maria approved the proposal (waiting_review → approved)',
  },
  {
    id: 'a-5',
    timestamp: '2026-03-17T10:36:00Z',
    actorKind: 'ai',
    actorId: 'agent-sales-1',
    kind: 'ownership_transferred',
    objectId: 'obj-42',
    objectType: 'lead',
    description: 'Transferred ownership AI → Maria for final check',
  },
]

// ─── Context ────────────────────────────────────────────────────

type InspectorTab = 'config' | 'audit' | 'chats'

type AgentManagerApi = {
  agents: AgentDefinition[]
  selectedAgentId: string | null
  inspectorTab: InspectorTab
  audit: AuditEntry[]
  selectAgent: (id: string) => void
  setInspectorTab: (tab: InspectorTab) => void
}

const AgentManagerContext = createContext<AgentManagerApi | null>(null)

function useAgentManager() {
  const ctx = use(AgentManagerContext)
  if (!ctx) throw new Error('AgentManager components require AgentManagerProvider')
  return ctx
}

// ─── Provider ───────────────────────────────────────────────────

export function AgentManagerProvider({ children }: { children: ReactNode }) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(DEMO_AGENTS[0]?.id ?? null)
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('config')

  const api = useMemo<AgentManagerApi>(
    () => ({
      agents: DEMO_AGENTS,
      selectedAgentId,
      inspectorTab,
      audit: DEMO_AUDIT,
      selectAgent: setSelectedAgentId,
      setInspectorTab,
    }),
    [selectedAgentId, inspectorTab],
  )

  return <AgentManagerContext value={api}>{children}</AgentManagerContext>
}

// ─── Sidebar ────────────────────────────────────────────────────

function StatusDot({ status }: { status: AgentDefinition['status'] }) {
  const colors = {
    active: 'bg-emerald-400',
    paused: 'bg-amber-400',
    disabled: 'bg-zinc-500',
  }
  return <span className={cn('inline-block h-2 w-2 rounded-full', colors[status])} />
}

export function AgentManagerSidebarPanel() {
  const { agents, selectedAgentId, selectAgent } = useAgentManager()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-zinc-400" />
          <span className="text-sm font-medium text-zinc-200">AI agents</span>
        </div>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800/50 text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-zinc-200"
        >
          <Plus size={14} />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => selectAgent(agent.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                selectedAgentId === agent.id
                  ? 'bg-zinc-800/70 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200',
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800/70 bg-zinc-900/70">
                <Bot size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{agent.name}</span>
                  <StatusDot status={agent.status} />
                </div>
                <p className="truncate text-xs text-zinc-500">{agent.description}</p>
                <div className="mt-1 flex gap-2 text-[10px] text-zinc-600">
                  <span>{agent.domainIds.join(', ')}</span>
                  <span>·</span>
                  <span>{agent.auditSummary.totalActions} actions</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── Conversation ───────────────────────────────────────────────

export function AgentManagerConversation({ disclaimer }: { disclaimer: string }) {
  const { messages, isBusy, sendMessage } = useShellSession()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(() => {
    const text = inputRef.current?.value.trim()
    if (!text || isBusy) return
    void sendMessage(text)
    if (inputRef.current) inputRef.current.value = ''
  }, [isBusy, sendMessage])

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((msg) => (
            <MessageRenderer key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/50 px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about agent configuration..."
            className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isBusy}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          >
            <ArrowUp size={14} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-zinc-600">{disclaimer}</p>
      </div>
    </div>
  )
}

// ─── Inspector: tab bar ─────────────────────────────────────────

const TABS: { id: InspectorTab; label: string; icon: typeof Settings }[] = [
  { id: 'config', label: 'Config', icon: Settings },
  { id: 'audit', label: 'Audit', icon: ScrollText },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
]

export function AgentManagerInspectorPanel() {
  const { agents, selectedAgentId, inspectorTab, setInspectorTab } = useAgentManager()
  const agent = agents.find((a) => a.id === selectedAgentId)

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-600">
        Select an agent
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Agent header */}
      <div className="border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800/70 bg-zinc-900/70">
            <Bot size={20} className="text-zinc-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-zinc-100">{agent.name}</h3>
              <Badge
                variant={agent.status === 'active' ? 'default' : 'secondary'}
                className="text-[10px]"
              >
                {agent.status}
              </Badge>
            </div>
            <p className="truncate text-xs text-zinc-500">{agent.roleId}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800/70">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setInspectorTab(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs transition-colors',
              inspectorTab === tab.id
                ? 'border-b-2 border-zinc-300 text-zinc-200'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <ScrollArea className="flex-1">
        {inspectorTab === 'config' && <AgentConfigTab agent={agent} />}
        {inspectorTab === 'audit' && <AgentAuditTab agentId={agent.id} />}
        {inspectorTab === 'chats' && <AgentChatsTab agent={agent} />}
      </ScrollArea>
    </div>
  )
}

// ─── Config tab ─────────────────────────────────────────────────

function AgentConfigTab({ agent }: { agent: AgentDefinition }) {
  return (
    <div className="space-y-4 p-4">
      <Section title="Instructions">
        <p className="text-xs text-zinc-400">{agent.instruction.systemPrompt}</p>
        {agent.instruction.personality ? (
          <p className="mt-1 text-xs text-zinc-500">Personality: {agent.instruction.personality}</p>
        ) : null}
      </Section>

      <Section title="Constraints">
        {agent.instruction.constraints.map((c) => (
          <div key={c} className="flex items-start gap-2 py-1">
            <Shield size={10} className="mt-0.5 shrink-0 text-amber-400/70" />
            <span className="text-xs text-zinc-400">{c}</span>
          </div>
        ))}
      </Section>

      <Section title="Domains">
        <div className="flex flex-wrap gap-1.5">
          {agent.domainIds.map((d) => (
            <Badge key={d} variant="outline" className="text-[10px]">
              {d}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Allowed actions">
        <div className="flex flex-wrap gap-1.5">
          {agent.allowedActions.map((a) => (
            <Badge key={a} variant="secondary" className="text-[10px]">
              <Check size={8} className="mr-0.5" />
              {a}
            </Badge>
          ))}
        </div>
      </Section>

      {agent.deniedActions.length > 0 ? (
        <Section title="Denied actions">
          <div className="flex flex-wrap gap-1.5">
            {agent.deniedActions.map((a) => (
              <Badge key={a} variant="destructive" className="text-[10px]">
                <X size={8} className="mr-0.5" />
                {a}
              </Badge>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  )
}

// ─── Audit tab ──────────────────────────────────────────────────

function AuditKindBadge({ kind }: { kind: string }) {
  const variants: Record<string, { color: string; label: string }> = {
    state_changed: { color: 'text-blue-400', label: 'State' },
    action_performed: { color: 'text-emerald-400', label: 'Action' },
    ownership_transferred: { color: 'text-amber-400', label: 'Handoff' },
    object_created: { color: 'text-violet-400', label: 'Created' },
  }
  const v = variants[kind] ?? { color: 'text-zinc-400', label: kind }
  return <span className={cn('text-[10px] font-medium', v.color)}>{v.label}</span>
}

function AgentAuditTab({ agentId }: { agentId: string }) {
  const { audit } = useAgentManager()
  const entries = audit.filter((e) => e.actorId === agentId || e.objectId)

  return (
    <div className="p-4">
      {entries.length === 0 ? (
        <p className="text-center text-xs text-zinc-600">No entries</p>
      ) : (
        <div className="space-y-0">
          {entries.map((entry, i) => (
            <div key={entry.id} className="relative flex gap-3 pb-4">
              {/* Timeline line */}
              {i < entries.length - 1 ? (
                <div className="absolute top-5 left-[11px] h-full w-px bg-zinc-800/70" />
              ) : null}
              {/* Dot */}
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  entry.actorKind === 'ai'
                    ? 'border-blue-500/30 bg-blue-500/10'
                    : entry.actorKind === 'human'
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-zinc-700 bg-zinc-800/50',
                )}
              >
                {entry.actorKind === 'ai' ? (
                  <Bot size={10} className="text-blue-400" />
                ) : entry.actorKind === 'human' ? (
                  <Activity size={10} className="text-emerald-400" />
                ) : (
                  <Zap size={10} className="text-zinc-500" />
                )}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <AuditKindBadge kind={entry.kind} />
                  {entry.verb ? (
                    <span className="text-[10px] text-zinc-500">{entry.verb}</span>
                  ) : null}
                  <span className="text-[10px] text-zinc-600">
                    {new Date(entry.timestamp).toLocaleTimeString('en-US')}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-400">{entry.description}</p>
                <p className="text-[10px] text-zinc-600">
                  {entry.objectType} · {entry.objectId}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Chats tab ──────────────────────────────────────────────────

function PermissionToggle({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Eye
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] transition-colors',
        value
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-zinc-800/50 text-zinc-600 hover:text-zinc-400',
      )}
    >
      <Icon size={10} />
      {label}
    </button>
  )
}

function AgentChatsTab({ agent }: { agent: AgentDefinition }) {
  return (
    <div className="space-y-3 p-4">
      {agent.chatBindings.length === 0 ? (
        <div className="text-center">
          <p className="text-xs text-zinc-600">No linked channels</p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700/50"
          >
            <Link2 size={10} />
            Link channel
          </button>
        </div>
      ) : (
        agent.chatBindings.map((binding) => (
          <div
            key={binding.channelId}
            className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-zinc-400" />
                <span className="text-sm text-zinc-200">{binding.channelId}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {binding.vendor}
              </Badge>
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {binding.direction === 'both'
                  ? '↔ both'
                  : binding.direction === 'inbound'
                    ? '← inbound'
                    : '→ outbound'}
              </Badge>
              {binding.autoReply ? (
                <Badge variant="secondary" className="text-[10px]">
                  <Zap size={8} className="mr-0.5" />
                  auto-reply
                </Badge>
              ) : null}
            </div>

            <Separator className="my-2 bg-zinc-800/50" />

            <p className="mb-1.5 text-[10px] font-medium text-zinc-500">Channel permissions</p>
            <div className="flex flex-wrap gap-1.5">
              <PermissionToggle
                icon={Eye}
                label="Read"
                value={binding.permissions.canRead}
                onChange={() => undefined}
              />
              <PermissionToggle
                icon={Reply}
                label="Reply"
                value={binding.permissions.canReply}
                onChange={() => undefined}
              />
              <PermissionToggle
                icon={MessageSquare}
                label="Initiate"
                value={binding.permissions.canInitiate}
                onChange={() => undefined}
              />
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-800/70 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400"
      >
        <Plus size={12} />
        Add channel
      </button>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h4>
      {children}
    </div>
  )
}
