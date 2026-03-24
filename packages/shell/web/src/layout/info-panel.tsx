'use client'

import { Briefcase, Calendar, ExternalLink, Mail, MapPin, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useShell } from '@worken/shell-web/machines/context'
import { usePermissions } from '@worken/shell-web/permissions/context'
import { useCurrentInspectorEntity, useShellSession } from '@worken/shell-web/session/context'

const statusColors: Record<string, string> = {
  Screening: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Interview: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Final: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Offer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Hired: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="mt-0.5 shrink-0 text-zinc-500" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
        <p className="text-sm text-zinc-300">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export function InfoPanel() {
  const { state } = useShell()
  const { domain, executeSidebarAction, executionCase } = useShellSession()
  const { canExecuteEntityAction, canExecuteVerb } = usePermissions()
  const target = state.inspectorTarget
  const entity = useCurrentInspectorEntity()
  const resolvedEntity = executionCase
    ? {
        name: executionCase.state.company,
        role: executionCase.state.contactName,
        email: executionCase.state.contactEmail,
        location: executionCase.state.channel,
        status: executionCase.status,
        source: `Signal ${executionCase.signalType}`,
        appliedDate: executionCase.state.budgetLabel,
        tags: [executionCase.signalType, executionCase.status],
      }
    : entity
  const actions = domain
    ? [
        ...domain.surfaces.actions
          .filter((action) => canExecuteVerb(domain.id, action.verbId))
          .map((action) => ({
            id: `surface:${action.id}`,
            label: action.label,
            verb: action.verbId,
            entityType: action.entityId,
          })),
        ...Object.values(domain.verbs)
          .filter(
            (verb) =>
              canExecuteVerb(domain.id, verb.id) &&
              !domain.surfaces.actions.some((action) => action.verbId === verb.id),
          )
          .map((verb) => ({
            id: `verb:${verb.id}`,
            label: domain.vocabulary.verbs[verb.id]?.label ?? verb.label,
            verb: verb.id,
            entityType: target?.entityType,
          })),
      ]
    : []
  const visibleActions = domain
    ? actions.filter(
        (action) =>
          !action.entityType || canExecuteEntityAction(domain.id, action.entityType, action.verb),
      )
    : []

  return (
    <div className="flex h-full flex-col bg-zinc-950/30">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/50 px-4 py-3">
        <span className="text-sm font-medium text-zinc-300">
          {target && domain
            ? (domain.entities[target.entityType]?.label ?? target.entityType)
            : 'Inspector'}
        </span>
      </div>

      <ScrollArea className="flex-1">
        {resolvedEntity ? (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-cyan-950 text-cyan-400 text-sm">
                  {resolvedEntity.name
                    .split(' ')
                    .map((name) => name[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-zinc-200">{resolvedEntity.name}</p>
                <p className="text-xs text-zinc-400">{resolvedEntity.role}</p>
              </div>
            </div>

            {/* Status */}
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium',
                statusColors[resolvedEntity.status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700',
              )}
            >
              {resolvedEntity.status}
            </span>

            <Separator className="my-4" />

            {/* Fields */}
            <div className="space-y-3">
              <InfoField icon={Mail} label="Email" value={resolvedEntity.email} />
              <InfoField icon={MapPin} label="Location" value={resolvedEntity.location} />
              <InfoField icon={Briefcase} label="Source" value={resolvedEntity.source} />
              <InfoField icon={Calendar} label="Applied" value={resolvedEntity.appliedDate} />
            </div>

            <Separator className="my-4" />

            {/* Tags */}
            <div>
              <p className="mb-2 text-[11px] font-medium text-zinc-500">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {resolvedEntity.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {executionCase ? (
              <>
                <Separator className="my-4" />
                <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-3 text-xs text-zinc-400">
                  <p className="font-medium text-zinc-200">Signal runtime</p>
                  <p className="mt-2">{executionCase.state.recommendation}</p>
                  <p className="mt-2 text-zinc-500">
                    Next step: {executionCase.state.nextAction}
                  </p>
                </div>
              </>
            ) : null}

            <Separator className="my-4" />

            {/* Actions */}
            <div className="space-y-2">
              {visibleActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() =>
                    void executeSidebarAction({
                      verb: action.verb,
                      entityType: action.entityType,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  {action.label}
                </button>
              ))}
              {visibleActions.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No actions available for this object with the current role.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50 text-zinc-600">
              <ExternalLink size={18} />
            </div>
            <p className="text-sm text-zinc-500">Select an object</p>
            <p className="mt-1 text-xs text-zinc-600">
              Click a row in the table or a card on the board
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
