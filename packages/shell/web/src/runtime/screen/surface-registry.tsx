'use client'

import type { ComponentType, ReactNode } from 'react'
import { type DomainDefinition, type DomainShellSurfaceLayoutId } from '@worken/ir/domains/types'
import { Conversation } from '@worken/shell-web/chat/conversation'
import {
  AgentManagerConversation,
  AgentManagerInspectorPanel,
  AgentManagerProvider,
  AgentManagerSidebarPanel,
} from '@worken/shell-web/layout/agent-manager'
import {
  CrmManagerInspectorPanel,
  CrmManagerProvider,
  CrmManagerSidebarPanel,
} from '@worken/shell-web/layout/crm-manager'
import {
  DeveloperStudioConversation,
  DeveloperStudioProvider,
  DeveloperStudioSidebarPanel,
} from '@worken/shell-web/layout/developer-studio'
import { InfoPanel } from '@worken/shell-web/layout/info-panel'
import {
  RoleManagerConversation,
  RoleManagerInspectorPanel,
  RoleManagerProvider,
  RoleManagerSidebarPanel,
} from '@worken/shell-web/layout/role-manager'
import {
  SpacesConversationPanel,
  SpacesSidebarPanel,
} from '@worken/shell-web/layout/spaces'
import { Sidebar } from '@worken/shell-web/layout/sidebar'

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
  spaces: {
    renderSidebar: () => <SpacesSidebarPanel />,
    renderConversation: ({ conversationDisclaimer }) => (
      <SpacesConversationPanel disclaimer={conversationDisclaimer} />
    ),
    renderInspector: () => <InfoPanel />,
  },
}

export function getShellSurfaceLayout(layoutId: DomainShellSurfaceLayoutId): SurfaceLayout {
  return SURFACE_LAYOUTS[layoutId]
}
