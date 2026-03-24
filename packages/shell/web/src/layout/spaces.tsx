'use client'

import { Layers } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { RoleIcon } from '@worken/shell-web/icons/role-icon'
import { usePermissions } from '@worken/shell-web/permissions/context'
import type { RoleDefinition } from '@worken/shell-web/permissions/types'

function SpaceTile({
  role,
  isActive,
  onSelect,
}: {
  role: RoleDefinition
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200',
        isActive
          ? 'border-cyan-500/50 bg-zinc-900/80 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
          : 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/50',
      )}
    >
      <div
        className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950"
        style={{
          boxShadow: isActive ? `inset 0 0 0 1px ${role.color}33` : undefined,
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${role.color}55, transparent 55%)`,
          }}
        />
        <div className="absolute inset-3 rounded-lg border border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="flex h-6 items-center gap-1 border-b border-white/5 px-2">
            <span className="h-2 w-2 rounded-full bg-[#ff5f57]/90" />
            <span className="h-2 w-2 rounded-full bg-[#febc2e]/90" />
            <span className="h-2 w-2 rounded-full bg-[#28c840]/90" />
          </div>
          <div className="p-2">
            <div className="h-2 w-3/5 rounded bg-white/10" />
            <div className="mt-1.5 h-2 w-2/5 rounded bg-white/5" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-zinc-300 backdrop-blur-md">
          <RoleIcon roleId={role.id} className="h-3.5 w-3.5" />
          <span className="font-medium">{role.name}</span>
        </div>
      </div>
      <div className="border-t border-zinc-800/60 px-3 py-2.5">
        <p className="text-xs font-medium text-zinc-200">{role.name}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-500">{role.description}</p>
      </div>
    </button>
  )
}

export function SpacesSidebarPanel() {
  return (
    <div className="flex h-full flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-zinc-400">
        <Layers className="h-4 w-4" />
        <span className="text-xs font-medium tracking-wide uppercase">Spaces</span>
      </div>
      <p className="text-xs leading-relaxed text-zinc-500">
        Each space is an isolated shell context—switch the active role like changing macOS desktops.
      </p>
    </div>
  )
}

export function SpacesConversationPanel({ disclaimer }: { disclaimer: string }) {
  const { currentRole, roles, setCurrentRoleId } = usePermissions()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-zinc-800/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400/80" />
          <div>
            <p className="text-sm font-medium text-zinc-100">Spaces</p>
            <p className="text-xs text-zinc-500">Mission Control for roles</p>
          </div>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((role) => (
              <SpaceTile
                key={role.id}
                role={role}
                isActive={role.id === currentRole.id}
                onSelect={() => setCurrentRoleId(role.id)}
              />
            ))}
          </div>
          <Separator className="my-6 bg-zinc-800/60" />
          <p className="text-xs text-zinc-500">{disclaimer}</p>
        </div>
      </ScrollArea>
    </div>
  )
}
