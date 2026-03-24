'use client'

import {
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle,
  CheckSquare,
  CreditCard,
  Database,
  FileText,
  Handshake,
  Image,
  Kanban,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Plus,
  Radio,
  Receipt,
  ScrollText,
  Shield,
  Target,
  TerminalSquare,
  UserPlus,
  Users,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { DomainDefinition } from '@worken/ir/domains/types'
import { cn } from '@/lib/utils'
import { usePermissions } from '@worken/shell-web/permissions/context'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Kanban,
  Calendar,
  Layers,
  BarChart3,
  Briefcase,
  UserPlus,
  Target,
  Megaphone,
  Image,
  Palette,
  Radio,
  Receipt,
  CreditCard,
  PiggyBank,
  CheckSquare,
  FileText,
  CheckCircle,
  Handshake,
  Plus,
  Shield,
  Bot,
  Database,
  ScrollText,
  MessageSquare,
  TerminalSquare,
}

export function Sidebar({
  domain,
  activeView,
  onNavigate,
  onAction,
  onToggleCollapse,
  isSidebarCollapsed = false,
}: {
  domain: DomainDefinition
  activeView: string
  onNavigate: (specId: string) => void
  onAction?: (input: { verb: string; entityType?: string }) => void
  onToggleCollapse?: () => void
  isSidebarCollapsed?: boolean
}) {
  const { canSeeSidebarItem, canExecuteVerb } = usePermissions()

  const visibleActions = domain.surfaces.actions.filter((action) =>
    canExecuteVerb(domain.id, action.verbId),
  )
  const visibleNavItems = domain.surfaces.navigation.filter((n) =>
    canSeeSidebarItem(domain.id, n.id),
  )

  return (
    <div className="flex h-full flex-col">
      {onToggleCollapse ? (
        <>
          <div className="shrink-0 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onToggleCollapse}
                className="hidden rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 md:flex"
                title={isSidebarCollapsed ? 'Expand left panel' : 'Collapse left panel'}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {visibleActions.length > 0 && (
        <div className="shrink-0 px-3 py-3">
          <div className="flex flex-col gap-1">
            {visibleActions.map((action) => {
              const Icon = iconMap[action.icon] ?? Plus
              return (
                <button
                  key={action.id}
                  onClick={() =>
                    onAction?.({
                      verb: action.verbId,
                      entityType: action.entityId,
                    })
                  }
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-zinc-100"
                >
                  <Icon size={16} className="text-cyan-400/70" />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Separator />

      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex w-full flex-col gap-0.5">
          {visibleNavItems.map((item) => {
            const Icon = iconMap[item.icon] ?? LayoutDashboard
            const isActive = item.viewId === activeView
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.viewId)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-zinc-800/80 text-zinc-50 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200',
                )}
              >
                <Icon size={16} className={isActive ? 'text-cyan-400' : ''} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="shrink-0 px-4 py-3">
        <p className="text-xs text-zinc-600">Worken OS · {domain.title}</p>
      </div>
    </div>
  )
}
