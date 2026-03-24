'use client'

import {
  ArrowLeftRight,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Database,
  Link2,
  Plus,
  Settings,
  Zap,
} from 'lucide-react'
import { useMachine } from '@xstate/react'
import { createContext, type ReactNode, use, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createCrmManagerMachine } from '@worken/shell-web/machines/crm-manager-machine'

// ─── Types ──────────────────────────────────────────────────────

type FieldMapping = {
  id: string
  crmFieldId: string
  crmFieldName: string
  crmFieldType: string
  workenFieldName: string
  workenFieldLabel: string
  direction: 'crm_to_worken' | 'worken_to_crm' | 'bidirectional'
  required: boolean
}

type StatusMapping = {
  crmStatusId: string
  crmStatusName: string
  crmStatusColor: string
  workenPhase: string
}

type StatusTrigger = {
  id: string
  crmStatusId: string
  crmStatusName: string
  agentId: string
  agentName: string
  action: string
  enabled: boolean
  autoCreate: boolean
}

type CrmBinding = {
  id: string
  vendor: string
  vendorLabel: string
  name: string
  enabled: boolean
  pipelineName: string
  entityType: string
  workenDomain: string
  workenEntity: string
  fieldMappings: FieldMapping[]
  statusMappings: StatusMapping[]
  statusTriggers: StatusTrigger[]
  lastSyncAt: string | null
}

// ─── Demo data ──────────────────────────────────────────────────

const DEMO_BINDINGS: CrmBinding[] = [
  {
    id: 'binding-bitrix-1',
    vendor: 'bitrix',
    vendorLabel: 'Bitrix24',
    name: 'Primary funnel',
    enabled: true,
    pipelineName: 'Sales',
    entityType: 'lead',
    workenDomain: 'sales',
    workenEntity: 'lead',
    fieldMappings: [
      {
        id: 'f1',
        crmFieldId: 'TITLE',
        crmFieldName: 'Title',
        crmFieldType: 'string',
        workenFieldName: 'company',
        workenFieldLabel: 'Company',
        direction: 'bidirectional',
        required: true,
      },
      {
        id: 'f2',
        crmFieldId: 'NAME',
        crmFieldName: 'Contact name',
        crmFieldType: 'string',
        workenFieldName: 'contactName',
        workenFieldLabel: 'Name',
        direction: 'crm_to_worken',
        required: true,
      },
      {
        id: 'f3',
        crmFieldId: 'EMAIL',
        crmFieldName: 'Email',
        crmFieldType: 'email',
        workenFieldName: 'contactEmail',
        workenFieldLabel: 'Email',
        direction: 'bidirectional',
        required: false,
      },
      {
        id: 'f4',
        crmFieldId: 'OPPORTUNITY',
        crmFieldName: 'Deal amount',
        crmFieldType: 'number',
        workenFieldName: 'estimatedBudget',
        workenFieldLabel: 'Budget',
        direction: 'bidirectional',
        required: false,
      },
      {
        id: 'f5',
        crmFieldId: 'UF_CRM_INDUSTRY',
        crmFieldName: 'Industry',
        crmFieldType: 'select',
        workenFieldName: 'industry',
        workenFieldLabel: 'Industry',
        direction: 'crm_to_worken',
        required: false,
      },
    ],
    statusMappings: [
      {
        crmStatusId: 'NEW',
        crmStatusName: 'New',
        crmStatusColor: '#4fc3f7',
        workenPhase: 'draft',
      },
      {
        crmStatusId: 'IN_PROCESS',
        crmStatusName: 'In progress',
        crmStatusColor: '#ffb74d',
        workenPhase: 'in_progress',
      },
      {
        crmStatusId: 'PROCESSED',
        crmStatusName: 'Processed',
        crmStatusColor: '#81c784',
        workenPhase: 'approved',
      },
      {
        crmStatusId: 'WON',
        crmStatusName: 'Won',
        crmStatusColor: '#66bb6a',
        workenPhase: 'completed',
      },
      {
        crmStatusId: 'LOSE',
        crmStatusName: 'Lost',
        crmStatusColor: '#ef5350',
        workenPhase: 'cancelled',
      },
    ],
    statusTriggers: [
      {
        id: 't1',
        crmStatusId: 'NEW',
        crmStatusName: 'New',
        agentId: 'agent-sales-1',
        agentName: 'Sales AI Agent',
        action: 'capture',
        enabled: true,
        autoCreate: true,
      },
      {
        id: 't2',
        crmStatusId: 'IN_PROCESS',
        crmStatusName: 'In progress',
        agentId: 'agent-sales-1',
        agentName: 'Sales AI Agent',
        action: 'enrich',
        enabled: true,
        autoCreate: false,
      },
    ],
    lastSyncAt: '2026-03-17T10:30:00Z',
  },
  {
    id: 'binding-amo-1',
    vendor: 'amocrm',
    vendorLabel: 'AmoCRM',
    name: 'Inbound leads',
    enabled: true,
    pipelineName: 'Primary',
    entityType: 'lead',
    workenDomain: 'sales',
    workenEntity: 'lead',
    fieldMappings: [
      {
        id: 'a1',
        crmFieldId: 'name',
        crmFieldName: 'Title',
        crmFieldType: 'text',
        workenFieldName: 'company',
        workenFieldLabel: 'Company',
        direction: 'bidirectional',
        required: true,
      },
      {
        id: 'a2',
        crmFieldId: 'price',
        crmFieldName: 'Budget',
        crmFieldType: 'numeric',
        workenFieldName: 'estimatedBudget',
        workenFieldLabel: 'Budget',
        direction: 'bidirectional',
        required: false,
      },
    ],
    statusMappings: [
      {
        crmStatusId: '142',
        crmStatusName: 'First contact',
        crmStatusColor: '#99ccff',
        workenPhase: 'draft',
      },
      {
        crmStatusId: '143',
        crmStatusName: 'Negotiation',
        crmStatusColor: '#ffcc66',
        workenPhase: 'in_progress',
      },
      {
        crmStatusId: '142',
        crmStatusName: 'Decision',
        crmStatusColor: '#ff9966',
        workenPhase: 'waiting_review',
      },
    ],
    statusTriggers: [
      {
        id: 'at1',
        crmStatusId: '142',
        crmStatusName: 'First contact',
        agentId: 'agent-sales-1',
        agentName: 'Sales AI Agent',
        action: 'capture',
        enabled: true,
        autoCreate: true,
      },
    ],
    lastSyncAt: '2026-03-17T09:15:00Z',
  },
]

// ─── Context ────────────────────────────────────────────────────

type InspectorSection = 'fields' | 'statuses' | 'triggers'

type CrmManagerApi = {
  bindings: CrmBinding[]
  selectedBindingId: string | null
  inspectorSection: InspectorSection
  selectBinding: (id: string) => void
  setInspectorSection: (s: InspectorSection) => void
}

const CrmManagerContext = createContext<CrmManagerApi | null>(null)

function useCrmManager() {
  const ctx = use(CrmManagerContext)
  if (!ctx) throw new Error('CrmManager requires CrmManagerProvider')
  return ctx
}

// ─── Provider ───────────────────────────────────────────────────

export function CrmManagerProvider({ children }: { children: ReactNode }) {
  const crmMachine = useMemo(
    () => createCrmManagerMachine(DEMO_BINDINGS[0]?.id ?? null),
    [],
  )
  const [snapshot, send] = useMachine(crmMachine)
  const selectedBindingId = snapshot.context.selectedBindingId
  const inspectorSection = snapshot.context.inspectorSection

  const api = useMemo<CrmManagerApi>(
    () => ({
      bindings: DEMO_BINDINGS,
      selectedBindingId,
      inspectorSection,
      selectBinding: (id) => send({ type: 'binding.select', id }),
      setInspectorSection: (s) => send({ type: 'inspector.section', section: s }),
    }),
    [inspectorSection, selectedBindingId, send],
  )

  return <CrmManagerContext value={api}>{children}</CrmManagerContext>
}

// ─── Sidebar ────────────────────────────────────────────────────

function VendorLogo({ vendor }: { vendor: string }) {
  const labels: Record<string, string> = { bitrix: 'B24', amocrm: 'Amo' }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800/70 bg-zinc-900/70 text-[10px] font-bold text-zinc-400">
      {labels[vendor] ?? vendor.slice(0, 3)}
    </div>
  )
}

export function CrmManagerSidebarPanel() {
  const { bindings, selectedBindingId, selectBinding } = useCrmManager()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-zinc-400" />
          <span className="text-sm font-medium text-zinc-200">CRM integrations</span>
        </div>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
        >
          <Plus size={14} />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {bindings.map((binding) => (
            <button
              key={binding.id}
              type="button"
              onClick={() => selectBinding(binding.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                selectedBindingId === binding.id
                  ? 'bg-zinc-800/70 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200',
              )}
            >
              <VendorLogo vendor={binding.vendor} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{binding.vendorLabel}</span>
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      binding.enabled ? 'bg-emerald-400' : 'bg-zinc-500',
                    )}
                  />
                </div>
                <p className="truncate text-xs text-zinc-500">{binding.name}</p>
                <div className="mt-1 flex gap-2 text-[10px] text-zinc-600">
                  <span>{binding.entityType}</span>
                  <span>→</span>
                  <span>
                    {binding.workenDomain}.{binding.workenEntity}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── Inspector ──────────────────────────────────────────────────

const SECTIONS: { id: InspectorSection; label: string; icon: typeof Settings }[] = [
  { id: 'fields', label: 'Fields', icon: ArrowLeftRight },
  { id: 'statuses', label: 'Statuses', icon: ChevronDown },
  { id: 'triggers', label: 'Triggers', icon: Zap },
]

export function CrmManagerInspectorPanel() {
  const { bindings, selectedBindingId, inspectorSection, setInspectorSection } = useCrmManager()
  const binding = bindings.find((b) => b.id === selectedBindingId)

  if (!binding) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-600">
        Select an integration
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <VendorLogo vendor={binding.vendor} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-zinc-100">{binding.vendorLabel}</h3>
              <Badge variant={binding.enabled ? 'default' : 'secondary'} className="text-[10px]">
                {binding.enabled ? 'active' : 'disabled'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">
              {binding.pipelineName} · {binding.entityType} → {binding.workenDomain}.
              {binding.workenEntity}
            </p>
          </div>
        </div>
        {binding.lastSyncAt ? (
          <p className="mt-1.5 text-[10px] text-zinc-600">
            Last sync: {new Date(binding.lastSyncAt).toLocaleString('en-US')}
          </p>
        ) : null}
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-zinc-800/70">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setInspectorSection(section.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs transition-colors',
              inspectorSection === section.id
                ? 'border-b-2 border-zinc-300 text-zinc-200'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <section.icon size={12} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {inspectorSection === 'fields' && <FieldMappingSection binding={binding} />}
        {inspectorSection === 'statuses' && <StatusMappingSection binding={binding} />}
        {inspectorSection === 'triggers' && <TriggerSection binding={binding} />}
      </ScrollArea>
    </div>
  )
}

// ─── Field Mapping Section ──────────────────────────────────────

function DirectionBadge({ direction }: { direction: string }) {
  const labels: Record<string, string> = {
    crm_to_worken: '→ Worken',
    worken_to_crm: '→ CRM',
    bidirectional: '↔',
  }
  return (
    <Badge variant="outline" className="text-[9px]">
      {labels[direction] ?? direction}
    </Badge>
  )
}

function FieldMappingSection({ binding }: { binding: CrmBinding }) {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Field mapping ({binding.fieldMappings.length})
        </h4>
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
        >
          <Plus size={10} />
          Add
        </button>
      </div>

      {binding.fieldMappings.map((fm) => (
        <div key={fm.id} className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-400">{fm.crmFieldName}</span>
                <ArrowRight size={10} className="shrink-0 text-zinc-600" />
                <span className="text-zinc-200">{fm.workenFieldLabel}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[9px]">
                  {fm.crmFieldType}
                </Badge>
                <DirectionBadge direction={fm.direction} />
                {fm.required ? (
                  <Badge variant="destructive" className="text-[9px]">
                    required
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-800/70 py-2 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
      >
        <Link2 size={10} />
        Map field
      </button>
    </div>
  )
}

// ─── Status Mapping Section ─────────────────────────────────────

function StatusMappingSection({ binding }: { binding: CrmBinding }) {
  return (
    <div className="space-y-2 p-4">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Status mapping ({binding.statusMappings.length})
      </h4>

      {binding.statusMappings.map((sm) => (
        <div
          key={sm.crmStatusId}
          className="flex items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: sm.crmStatusColor }} />
            <span className="text-xs text-zinc-300">{sm.crmStatusName}</span>
          </div>
          <ArrowRight size={12} className="shrink-0 text-zinc-600" />
          <Badge variant="secondary" className="text-[10px]">
            {sm.workenPhase}
          </Badge>
        </div>
      ))}
    </div>
  )
}

// ─── Trigger Section ────────────────────────────────────────────

function TriggerSection({ binding }: { binding: CrmBinding }) {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Agent triggers ({binding.statusTriggers.length})
        </h4>
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
        >
          <Plus size={10} />
          Add
        </button>
      </div>

      <p className="text-[10px] text-zinc-600">
        When a lead enters a CRM status, an agent can start automatically.
      </p>

      {binding.statusTriggers.map((trigger) => (
        <div
          key={trigger.id}
          className={cn(
            'rounded-xl border bg-zinc-900/40 p-3',
            trigger.enabled ? 'border-blue-500/30' : 'border-zinc-800/70',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={12} className={trigger.enabled ? 'text-blue-400' : 'text-zinc-600'} />
              <span className="text-xs text-zinc-200">Status “{trigger.crmStatusName}”</span>
            </div>
            <button
              type="button"
              className={cn(
                'flex h-5 w-9 items-center rounded-full px-0.5 transition-colors',
                trigger.enabled ? 'bg-blue-500/30' : 'bg-zinc-800',
              )}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-full transition-transform',
                  trigger.enabled ? 'translate-x-4 bg-blue-400' : 'bg-zinc-600',
                )}
              />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Bot size={12} className="text-zinc-400" />
            <span className="text-xs text-zinc-400">{trigger.agentName}</span>
            <ArrowRight size={10} className="text-zinc-600" />
            <Badge variant="secondary" className="text-[10px]">
              {trigger.action}
            </Badge>
          </div>

          <div className="mt-1.5 flex gap-1.5">
            {trigger.autoCreate ? (
              <Badge variant="outline" className="text-[9px]">
                <Plus size={8} className="mr-0.5" />
                auto-create object
              </Badge>
            ) : null}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-800/70 py-2 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
      >
        <Plus size={12} />
        Add trigger
      </button>
    </div>
  )
}
