'use client'

import {
  ArrowUp,
  Check,
  LayoutPanelTop,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  X,
} from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { DOMAIN_IDS } from '@/domains/registry'
import { cn } from '@/lib/utils'
import { MessageRenderer } from '@/shell/chat/message-renderer'
import { RoleIcon } from '@/shell/icons/role-icon'
import { useShell } from '@/shell/machines/context'
import { usePermissions } from '@/shell/permissions/context'
import type { DomainPermissions, RoleDefinition } from '@/shell/permissions/types'
import {
  getDomainEntities,
  getDomainMeta,
  getDomainSidebarItems,
  getDomainVerbLabels,
} from '@/shell/runtime/domain/catalog'
import { useShellSession } from '@/shell/session/context'

const DOMAIN_META = Object.fromEntries(
  DOMAIN_IDS.map((domainId) => [domainId, getDomainMeta(domainId)]),
)
const SIDEBAR_ITEMS = Object.fromEntries(
  DOMAIN_IDS.map((domainId) => [
    domainId,
    getDomainSidebarItems(domainId).map((item) => ({ id: item.id, label: item.label })),
  ]),
)
const ENTITIES = Object.fromEntries(
  DOMAIN_IDS.map((domainId) => [
    domainId,
    getDomainEntities(domainId).map((entity) => ({
      id: entity.id,
      label: entity.label,
      actions: entity.actions,
    })),
  ]),
)
const VERB_LABELS = Object.fromEntries(
  DOMAIN_IDS.map((domainId) => [domainId, getDomainVerbLabels(domainId)]),
)

const ENTITY_ACTION_LABELS: Record<string, string> = {
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
}

type RoleManagerApi = {
  currentRole: RoleDefinition
  editable: boolean
  editingRole: RoleDefinition
  editingRoleId: string
  roles: RoleDefinition[]
  selectedDomainId: string
  createRole: (role: RoleDefinition) => void
  setEditingRoleId: (roleId: string) => void
  setSelectedDomainId: (domainId: string) => void
  resetToDefaults: () => void
  updateRole: (updated: RoleDefinition) => void
}

const RoleManagerContext = createContext<RoleManagerApi | null>(null)

function ToggleCell({
  value,
  disabled = false,
  onChange,
}: {
  value: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        value
          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          : 'bg-zinc-800/50 text-zinc-600 hover:bg-zinc-800',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-inherit',
      )}
    >
      {value ? <Check size={14} /> : <X size={14} />}
    </button>
  )
}

function RolePreviewCard({ role, badge }: { role: RoleDefinition; badge?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800/70 bg-zinc-900/70">
          <RoleIcon roleId={role.id} className="h-5 w-5 text-zinc-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-zinc-100">{role.name}</p>
            {badge ? (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {badge}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500">{role.description}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-500">
        <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/30 px-3 py-2">
          Domains {countAccessibleDomains(role)}
        </div>
        <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/30 px-3 py-2">
          Write {countWritableDomains(role)}
        </div>
      </div>
    </div>
  )
}

function canManageRoles(role: RoleDefinition) {
  const adminPermissions = role.domains.admin
  return Boolean(adminPermissions?.accessible && adminPermissions.verbs['manage-roles'])
}

function countAccessibleDomains(role: RoleDefinition) {
  return Object.values(role.domains).filter((domainPermissions) => domainPermissions.accessible)
    .length
}

function countWritableDomains(role: RoleDefinition) {
  return Object.values(role.domains).filter(
    (domainPermissions) =>
      domainPermissions.accessible &&
      (Object.keys(domainPermissions.verbs).length > 0 ||
        Object.values(domainPermissions.entities).some(
          (entityPermissions) => Object.keys(entityPermissions.actions).length > 0,
        )),
  ).length
}

function useRoleManager() {
  const context = use(RoleManagerContext)
  if (!context) {
    throw new Error('Role manager components must be used inside RoleManagerProvider')
  }
  return context
}

export function RoleManagerProvider({ children }: { children: ReactNode }) {
  const { createRole, currentRole, resetToDefaults, roles, updateRole } = usePermissions()
  const defaultDomainId = DOMAIN_IDS[0] ?? ''
  const defaultEditingRoleId = roles[0]?.id ?? currentRole.id
  const [editingRoleId, setEditingRoleId] = useState(() => currentRole.id)
  const [selectedDomainId, setSelectedDomainId] = useState(() => defaultDomainId)

  useEffect(() => {
    if (roles.some((role) => role.id === editingRoleId)) return
    setEditingRoleId(defaultEditingRoleId)
  }, [defaultEditingRoleId, editingRoleId, roles])

  useEffect(() => {
    if (DOMAIN_IDS.includes(selectedDomainId)) return
    setSelectedDomainId(defaultDomainId)
  }, [defaultDomainId, selectedDomainId])

  const editingRole = useMemo(
    () => roles.find((role) => role.id === editingRoleId) ?? roles[0],
    [editingRoleId, roles],
  )

  const api = useMemo<RoleManagerApi | null>(() => {
    if (!editingRole) return null

    return {
      currentRole,
      editable: canManageRoles(currentRole),
      editingRole,
      editingRoleId,
      roles,
      selectedDomainId,
      createRole,
      setEditingRoleId: (roleId) => setEditingRoleId(roleId),
      setSelectedDomainId: (domainId) =>
        setSelectedDomainId(domainId as (typeof DOMAIN_IDS)[number]),
      resetToDefaults,
      updateRole: (updated) => updateRole(editingRole.id, () => updated),
    }
  }, [
    currentRole,
    editingRole,
    editingRoleId,
    resetToDefaults,
    roles,
    selectedDomainId,
    createRole,
    updateRole,
  ])

  if (!api) {
    return null
  }

  return <RoleManagerContext value={api}>{children}</RoleManagerContext>
}

export function RoleManagerSidebarPanel({
  onToggleCollapse,
  isSidebarCollapsed = false,
}: {
  onToggleCollapse?: () => void
  isSidebarCollapsed?: boolean
}) {
  const { editable, editingRoleId, roles, createRole, setEditingRoleId } = useRoleManager()
  const { state, send } = useShell()

  const openInspectorEditorPanel = useCallback(() => {
    if (!state.panels.inspector) {
      send({ type: 'panel.toggle', panel: 'inspector' })
    }
  }, [send, state.panels.inspector])

  const handleSelectEditingRole = useCallback(
    (roleId: string) => {
      setEditingRoleId(roleId)
      openInspectorEditorPanel()
    },
    [openInspectorEditorPanel, setEditingRoleId],
  )

  const handleCreateRole = useCallback(() => {
    if (!editable) return

    let roleIndex = roles.length + 1
    let roleId = `custom-role-${roleIndex}`
    while (roles.some((role) => role.id === roleId)) {
      roleIndex += 1
      roleId = `custom-role-${roleIndex}`
    }

    const domains = Object.fromEntries(
      DOMAIN_IDS.map((domainId) => [
        domainId,
        { accessible: false, sidebar: {}, entities: {}, verbs: {} },
      ]),
    )

    createRole({
      id: roleId,
      name: `New role ${roleIndex}`,
      description: 'Custom role for access tuning',
      emoji: '🧩',
      color: '#94a3b8',
      domains,
    })
    setEditingRoleId(roleId)
    openInspectorEditorPanel()
  }, [createRole, editable, openInspectorEditorPanel, roles, setEditingRoleId])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LayoutPanelTop size={15} className="text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Roles & access</span>
          </div>
          {onToggleCollapse ? (
            <button
              onClick={onToggleCollapse}
              className="hidden rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 md:flex"
              title={isSidebarCollapsed ? 'Expand left panel' : 'Collapse left panel'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          ) : null}
        </div>
      </div>

      <Separator />

      <div className="px-3 py-3">
        <button className="flex w-full items-center gap-2.5 rounded-lg bg-zinc-800/80 px-3 py-2 text-sm font-medium text-zinc-50">
          <Shield size={16} className="text-cyan-400" />
          <span>Roles & access</span>
        </button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Roles to edit
            </p>
            <p className="mb-2 text-xs text-zinc-500">
              The active shell role is switched from the top dock.
            </p>
            <div className="space-y-1.5">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectEditingRole(role.id)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                    editingRoleId === role.id
                      ? 'border-zinc-700 bg-zinc-800/80 text-zinc-50'
                      : 'border-zinc-800/70 bg-zinc-950/20 text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800/70 bg-zinc-900/70">
                      <RoleIcon roleId={role.id} className="h-4 w-4 text-zinc-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{role.name}</span>
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500">{role.description}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                        Domains {countAccessibleDomains(role)} · write {countWritableDomains(role)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!editable}
            onClick={handleCreateRole}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              editable
                ? 'border-zinc-700/70 bg-zinc-800/70 text-zinc-200 hover:bg-zinc-800'
                : 'cursor-not-allowed border-zinc-800/50 bg-zinc-900/20 text-zinc-600',
            )}
          >
            <Plus size={14} />
            Create role
          </button>
        </div>
      </ScrollArea>

      <Separator />
      <div className="shrink-0 px-4 py-3">
        <p className="text-xs text-zinc-600">Worken OS · Admin</p>
      </div>
    </div>
  )
}

function DomainPermissionsInspector() {
  const { editable, editingRole, selectedDomainId, updateRole } = useRoleManager()
  const meta = DOMAIN_META[selectedDomainId]
  const sidebarItems = SIDEBAR_ITEMS[selectedDomainId] ?? []
  const entities = ENTITIES[selectedDomainId] ?? []
  const verbs = VERB_LABELS[selectedDomainId] ?? []
  const permissions = editingRole.domains[selectedDomainId] ?? {
    accessible: false,
    sidebar: {},
    entities: {},
    verbs: {},
  }

  const updateDomain = (updater: (domain: DomainPermissions) => DomainPermissions) => {
    if (!editable) return
    updateRole({
      ...editingRole,
      domains: {
        ...editingRole.domains,
        [selectedDomainId]: updater(permissions),
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/30">
        <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base">{meta?.icon}</span>
            <div>
              <p className="text-sm font-medium text-zinc-200">{meta?.title}</p>
              <p className="text-xs text-zinc-500">Current access surface</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Access</span>
            <ToggleCell
              value={permissions.accessible}
              disabled={!editable}
              onChange={(value) => updateDomain((domain) => ({ ...domain, accessible: value }))}
            />
          </div>
        </div>

        {permissions.accessible ? (
          <div className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">Navigation sections</p>
              <div className="space-y-2">
                {sidebarItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800/70 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-300"
                  >
                    <ToggleCell
                      value={permissions.sidebar[item.id] ?? false}
                      disabled={!editable}
                      onChange={(value) =>
                        updateDomain((domain) => ({
                          ...domain,
                          sidebar: { ...domain.sidebar, [item.id]: value },
                        }))
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">Shell actions</p>
              <div className="flex flex-wrap gap-2">
                {verbs.map((verb) => (
                  <button
                    key={verb.id}
                    type="button"
                    disabled={!editable}
                    onClick={() =>
                      updateDomain((domain) => ({
                        ...domain,
                        verbs: {
                          ...domain.verbs,
                          [verb.id]: !(domain.verbs[verb.id] ?? false),
                        },
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      permissions.verbs[verb.id]
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                        : 'border-zinc-800/70 bg-zinc-950/30 text-zinc-500 hover:text-zinc-300',
                      !editable && 'cursor-not-allowed opacity-50 hover:text-zinc-500',
                    )}
                  >
                    {verb.label}
                  </button>
                ))}
              </div>
            </div>

            {entities.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-400">Entities & actions</p>
                <div className="space-y-2">
                  {entities.map((entity) => {
                    const entityPermissions = permissions.entities[entity.id] ?? {
                      visible: false,
                      actions: {},
                    }

                    return (
                      <div
                        key={entity.id}
                        className="rounded-xl border border-zinc-800/70 bg-zinc-950/30 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-zinc-200">{entity.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                              Visible
                            </span>
                            <ToggleCell
                              value={entityPermissions.visible}
                              disabled={!editable}
                              onChange={(value) =>
                                updateDomain((domain) => ({
                                  ...domain,
                                  entities: {
                                    ...domain.entities,
                                    [entity.id]: { ...entityPermissions, visible: value },
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {entity.actions.map((action) => (
                            <button
                              key={action}
                              type="button"
                              disabled={!editable}
                              onClick={() =>
                                updateDomain((domain) => ({
                                  ...domain,
                                  entities: {
                                    ...domain.entities,
                                    [entity.id]: {
                                      ...entityPermissions,
                                      actions: {
                                        ...entityPermissions.actions,
                                        [action]: !(entityPermissions.actions[action] ?? false),
                                      },
                                    },
                                  },
                                }))
                              }
                              className={cn(
                                'rounded-full border px-3 py-1.5 text-xs transition-colors',
                                entityPermissions.actions[action]
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                  : 'border-zinc-800/70 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300',
                                !editable && 'cursor-not-allowed opacity-50 hover:text-zinc-500',
                              )}
                            >
                              {ENTITY_ACTION_LABELS[action] ?? action}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="px-4 py-5 text-sm text-zinc-500">Domain is hidden for this role.</div>
        )}
      </div>
    </div>
  )
}

function RoleManagerChat({ disclaimer }: { disclaimer?: string }) {
  const { domain, error, isBusy, messages, navigateToSpec, sendMessage } = useShellSession()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const domainTitle = domain?.title ?? 'Admin'

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
        <div className="mx-auto max-w-3xl py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="shell-accent-soft-bg shell-accent-text mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Sparkles size={24} />
              </div>
              <h2 className="text-lg font-semibold text-zinc-200">Worken OS · {domainTitle}</h2>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                Pick a role on the left to edit it. The active shell role is switched only from the
                top dock.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageRenderer key={message.id} message={message} onSpecRequest={navigateToSpec} />
            ))
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800/50 bg-zinc-950/30 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end rounded-2xl border border-zinc-800/50 bg-zinc-900/50 transition-colors focus-within:border-zinc-700">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
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
          <p className="mt-2 text-center text-[11px] text-zinc-600">{error ?? disclaimer}</p>
        </div>
      </div>
    </div>
  )
}

export function RoleManagerConversation({ disclaimer }: { disclaimer?: string }) {
  return <RoleManagerChat disclaimer={disclaimer} />
}

function RoleManagerInspector() {
  const {
    currentRole,
    editable,
    editingRole,
    resetToDefaults,
    selectedDomainId,
    setSelectedDomainId,
  } = useRoleManager()

  return (
    <div className="flex h-full flex-col bg-zinc-950/30">
      <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-zinc-500" />
          <span className="text-sm font-medium text-zinc-300">Access control</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Current shell role
            </p>
            <RolePreviewCard role={currentRole} badge="Shell" />
            <div className="mt-3 rounded-xl border border-zinc-800/70 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-500">
              {editable
                ? 'This role can change permissions and immediately affect the shell.'
                : 'This role uses the Admin domain in read-only mode.'}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Role being edited
            </p>
            <RolePreviewCard role={editingRole} />
          </div>

          {!editable ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-300" />
                <div>
                  <p className="text-sm font-medium text-amber-200">
                    Editing is not available
                  </p>
                  <p className="mt-1 text-sm text-amber-100/70">
                    Domain {DOMAIN_META[selectedDomainId]?.title} is open for viewing, but only a
                    role with `manage-roles` can change permissions.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Access domain
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DOMAIN_IDS.map((domainId) => {
                const meta = DOMAIN_META[domainId]
                return (
                  <button
                    key={domainId}
                    type="button"
                    onClick={() => setSelectedDomainId(domainId)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                      selectedDomainId === domainId
                        ? 'border-zinc-700 bg-zinc-800/80 text-zinc-50'
                        : 'border-zinc-800/70 bg-zinc-950/20 text-zinc-400 hover:text-zinc-200',
                    )}
                  >
                    <span>{meta?.icon}</span>
                    <span>{meta?.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DomainPermissionsInspector />

          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              System
            </p>
            <button
              type="button"
              disabled={!editable}
              onClick={resetToDefaults}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                editable
                  ? 'border-zinc-700/70 bg-zinc-800/70 text-zinc-200 hover:bg-zinc-800'
                  : 'cursor-not-allowed border-zinc-800/50 bg-zinc-900/20 text-zinc-600',
              )}
            >
              <RotateCcw size={14} />
              Reset roles to defaults
            </button>
            {!editable ? (
              <p className="mt-2 text-xs text-zinc-500">
                Reset is only available to roles with `manage-roles`.
              </p>
            ) : null}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export function RoleManagerInspectorPanel() {
  return <RoleManagerInspector />
}
