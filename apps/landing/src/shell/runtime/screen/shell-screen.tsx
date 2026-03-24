'use client'

import type { ReactNode } from 'react'
import { getConversationFooter, getShellSurfaceLayoutId } from '@/domains/manifest'
import type { DomainDefinition } from '@/domains/types'
import { ShellFrame } from '@/shell/layout/shell-frame'
import { useSemanticIr } from '@/shell/runtime/semantic/semantic-ir-context'
import { resolveShellLayoutFromDomainViewAndIr } from '@/shell/runtime/semantic/shell-surface-bridge'
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
  const semanticIr = useSemanticIr()
  const resolvedActiveView = activeView ?? domain.surfaces.defaultViewId
  const conversationFooter = getConversationFooter(domain, resolvedActiveView)
  const manifestLayoutId = getShellSurfaceLayoutId(domain, resolvedActiveView)
  const irLayout = resolveShellLayoutFromDomainViewAndIr(semanticIr, domain, resolvedActiveView)
  const surfaceLayoutId = irLayout ?? manifestLayoutId
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
