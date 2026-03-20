'use client'

import type { ComponentType, ReactNode } from 'react'
import { type DomainDefinition, type DomainShellSurfaceLayoutId } from '@/domains/types'
import { Conversation } from '@/shell/chat/conversation'
import {
  AgentManagerConversation,
  AgentManagerInspectorPanel,
  AgentManagerProvider,
  AgentManagerSidebarPanel,
} from '@/shell/layout/agent-manager'
import {
  CrmManagerInspectorPanel,
  CrmManagerProvider,
  CrmManagerSidebarPanel,
} from '@/shell/layout/crm-manager'
import {
  DeveloperStudioConversation,
  DeveloperStudioProvider,
  DeveloperStudioSidebarPanel,
} from '@/shell/layout/developer-studio'
import { InfoPanel } from '@/shell/layout/info-panel'
import {
  RoleManagerConversation,
  RoleManagerInspectorPanel,
  RoleManagerProvider,
  RoleManagerSidebarPanel,
} from '@/shell/layout/role-manager'
import { Sidebar } from '@/shell/layout/sidebar'

type SurfaceRendererProps = {
  domain: DomainDefinition
  activeView: string
  onNavigate: (specId: string) => void
  onAction: (input: { verb: string; entityType?: string }) => void
  conversationDisclaimer: string
  conversationHint?: string
}

type SurfaceLayout = {
  Provider?: ComponentType<{ children: ReactNode }>
  renderSidebar: (props: SurfaceRendererProps) => ReactNode
  renderConversation: (props: SurfaceRendererProps) => ReactNode
  renderInspector: (props: SurfaceRendererProps) => ReactNode
}

const SURFACE_LAYOUTS: Record<DomainShellSurfaceLayoutId, SurfaceLayout> = {
  default: {
    renderSidebar: ({ domain, activeView, onNavigate, onAction }) => (
      <Sidebar
        domain={domain}
        activeView={activeView}
        onNavigate={onNavigate}
        onAction={onAction}
      />
    ),
    renderConversation: () => <Conversation />,
    renderInspector: () => <InfoPanel />,
  },
  'role-manager': {
    Provider: RoleManagerProvider,
    renderSidebar: () => <RoleManagerSidebarPanel />,
    renderConversation: ({ conversationDisclaimer }) => (
      <RoleManagerConversation disclaimer={conversationDisclaimer} />
    ),
    renderInspector: () => <RoleManagerInspectorPanel />,
  },
  'developer-studio': {
    Provider: DeveloperStudioProvider,
    renderSidebar: () => <DeveloperStudioSidebarPanel />,
    renderConversation: ({ conversationDisclaimer, conversationHint }) => (
      <DeveloperStudioConversation disclaimer={conversationDisclaimer} hint={conversationHint} />
    ),
    renderInspector: () => <InfoPanel />,
  },
  'agent-manager': {
    Provider: AgentManagerProvider,
    renderSidebar: () => <AgentManagerSidebarPanel />,
    renderConversation: ({ conversationDisclaimer }) => (
      <AgentManagerConversation disclaimer={conversationDisclaimer} />
    ),
    renderInspector: () => <AgentManagerInspectorPanel />,
  },
  'crm-manager': {
    Provider: CrmManagerProvider,
    renderSidebar: () => <CrmManagerSidebarPanel />,
    renderConversation: ({ conversationDisclaimer }) => (
      <Conversation disclaimer={conversationDisclaimer} />
    ),
    renderInspector: () => <CrmManagerInspectorPanel />,
  },
}

export function getShellSurfaceLayout(layoutId: DomainShellSurfaceLayoutId): SurfaceLayout {
  return SURFACE_LAYOUTS[layoutId]
}
