'use client'

import type { ReactNode } from 'react'
import { getConversationFooter, getShellSurfaceLayoutId } from '@worken/ir/domains/manifest'
import type { DomainDefinition } from '@worken/ir/domains/types'
import { ShellFrame } from '@worken/shell-web/layout/shell-frame'
import { getShellSurfaceLayout } from './surface-registry'

export function ShellScreen({
  domain,
  activeView,
  viewTitle,
  onNavigate,
  onAction,
  windowControls,
}: {
  domain: DomainDefinition
  activeView: string | null
  viewTitle: string | null
  onNavigate: (specId: string) => void
  onAction: (input: { verb: string; entityType?: string }) => void
  windowControls?: ReactNode
}) {
  const resolvedActiveView = activeView ?? domain.surfaces.defaultViewId
  const conversationFooter = getConversationFooter(domain, resolvedActiveView)
  const surfaceLayoutId = getShellSurfaceLayoutId(domain, resolvedActiveView)
  const surfaceLayout = getShellSurfaceLayout(surfaceLayoutId)

  const screen = (
    <ShellFrame
      windowControls={windowControls}
      allowInspectorManualOpen={false}
      sidebar={surfaceLayout.renderSidebar({
        domain,
        activeView: resolvedActiveView,
        onNavigate,
        onAction,
        conversationDisclaimer: conversationFooter.disclaimer,
        conversationHint: conversationFooter.hint,
      })}
      conversation={surfaceLayout.renderConversation({
        domain,
        activeView: resolvedActiveView,
        onNavigate,
        onAction,
        conversationDisclaimer: conversationFooter.disclaimer,
        conversationHint: conversationFooter.hint,
      })}
      inspector={surfaceLayout.renderInspector({
        domain,
        activeView: resolvedActiveView,
        onNavigate,
        onAction,
        conversationDisclaimer: conversationFooter.disclaimer,
        conversationHint: conversationFooter.hint,
      })}
    />
  )

  if (!surfaceLayout.Provider) return screen

  return <surfaceLayout.Provider>{screen}</surfaceLayout.Provider>
}
