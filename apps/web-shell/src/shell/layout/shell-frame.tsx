'use client'

import { Moon, PanelLeftClose, PanelLeftOpen, PanelRightOpen, Sun, X } from 'lucide-react'
import { cloneElement, isValidElement, type ReactElement, type ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { shellUiTokens } from '@/shell/layout/ui-tokens'
import { useShell } from '@/shell/machines/context'
import { useShellTheme } from '@/shell/theme'

export function ShellFrame({
  sidebar,
  conversation,
  inspector,
  breadcrumbs,
  windowControls,
  allowInspectorManualOpen = true,
}: {
  sidebar: ReactNode
  conversation: ReactNode
  inspector?: ReactNode
  breadcrumbs?: ReactNode
  windowControls?: ReactNode
  allowInspectorManualOpen?: boolean
}) {
  const { state, send } = useShell()
  const { theme, toggle: toggleTheme } = useShellTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarDesktopBg =
    theme === 'light'
      ? 'color-mix(in srgb, var(--bg-surface) 88%, white 12%)'
      : 'color-mix(in srgb, var(--bg-deep) 94%, white 6%)'
  const chromeIconButtonClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/35 text-zinc-400 backdrop-blur transition-colors hover:border-white/20 hover:bg-zinc-900/80 hover:text-zinc-200'
  const showInspector = state.panels.inspector
  const sidebarWithControls = isValidElement(sidebar)
    ? cloneElement(
        sidebar as ReactElement<{
          onToggleCollapse?: () => void
          isSidebarCollapsed?: boolean
        }>,
        {
          onToggleCollapse: undefined,
          isSidebarCollapsed: sidebarCollapsed,
        },
      )
    : sidebar
  return (
    <div className="flex h-full overflow-hidden bg-(--bg-deep) text-zinc-50 transition-all duration-150">
      <div
        className={cn(
          'flex h-full shrink-0 flex-col overflow-hidden backdrop-blur-xl transition-[width] duration-200',
          sidebarCollapsed ? 'w-0' : shellUiTokens.sidebarDesktopWidthClass,
        )}
        style={{ backgroundColor: sidebarDesktopBg }}
      >
        {sidebarCollapsed ? null : (
          <>
            <div
              className={cn('flex shrink-0 items-center px-3', shellUiTokens.chromeRowHeightClass)}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="min-w-0 flex-1">{windowControls}</div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className={chromeIconButtonClass}
                  title="Collapse left panel"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{sidebarWithControls}</div>
          </>
        )}
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950/10">
        <div className="absolute inset-x-0 top-0 z-10 border-b border-zinc-800/30 bg-zinc-950/30 backdrop-blur-xl transition-[background-color,border-color,backdrop-filter] duration-300 ease-out">
          <div className={cn('flex items-center gap-2 px-1.5', shellUiTokens.chromeRowHeightClass)}>
            {sidebarCollapsed ? (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className={chromeIconButtonClass}
                title="Expand left panel"
              >
                <PanelLeftOpen size={16} />
              </button>
            ) : null}

            <div className="min-w-0 flex-1">{breadcrumbs}</div>

            <button
              onClick={toggleTheme}
              className={chromeIconButtonClass}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">{conversation}</div>

          {allowInspectorManualOpen && !showInspector ? (
            <button
              onClick={() => send({ type: 'panel.toggle', panel: 'inspector' })}
              className="absolute right-3 top-3 z-20 hidden rounded-xl bg-zinc-950/70 p-1.5 text-zinc-500 backdrop-blur transition-colors hover:bg-zinc-900/90 hover:text-zinc-300 md:flex"
              title="Expand right panel"
            >
              <PanelRightOpen size={16} />
            </button>
          ) : null}

          <div
            className={cn(
              'relative hidden shrink-0 overflow-y-auto bg-zinc-950/25 pt-12 backdrop-blur-xl transition-[width] duration-200 md:flex md:flex-col',
              showInspector ? shellUiTokens.inspectorDesktopWidthClass : 'md:w-0',
            )}
          >
            {showInspector ? (
              <button
                onClick={() => send({ type: 'panel.close', panel: 'inspector' })}
                className="absolute right-3 top-14 z-30 hidden rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 md:flex"
                title="Close right panel"
              >
                <X size={16} />
              </button>
            ) : null}
            {showInspector && inspector}
          </div>
        </div>
      </div>
    </div>
  )
}
