export type DomainAccent = {
  color: string
  gradient: string
}

export type DomainEntityActionId = string
export type DomainEntityId = string
export type DomainVerbId = string
export type DomainViewId = string
export type DomainSurfaceId = string

export type DomainEntityDefinition = {
  id: DomainEntityId
  label: string
  pluralLabel: string
  actions: DomainEntityActionId[]
  inspector?: {
    enabled: boolean
  }
}

export type DomainVerbDefinition = {
  id: DomainVerbId
  label: string
  scope: 'domain' | 'entity'
  entityIds?: DomainEntityId[]
}

export type DomainShellSurfaceLayoutId =
  | 'default'
  | 'role-manager'
  | 'developer-studio'
  | 'agent-manager'
  | 'crm-manager'
  | 'spaces'

export type DomainConversationFooterDefinition = {
  disclaimer?: string
  hint?: string
}

export type DomainLocalAssistantDefinition = {
  introTemplate?: string
  capabilities?: string
}

export type DomainExecutionDefinition = {
  signalType: string
  autoStart?: boolean
  policyId?: string
}

export type DomainShellSurfaceDefinition = {
  layoutId?: DomainShellSurfaceLayoutId
  conversation?: DomainConversationFooterDefinition
  localAssistant?: DomainLocalAssistantDefinition
}

export type DomainViewDefinition = {
  id: DomainViewId
  title: string
  kind: 'dashboard' | 'table' | 'board' | 'analytics' | 'list' | 'detail' | 'local'
  entityId?: DomainEntityId
  specId?: string
  shell?: DomainShellSurfaceDefinition
  execution?: DomainExecutionDefinition
}

export type SidebarAction = {
  id: string
  label: string
  icon: string
  verbId: DomainVerbId
  entityId?: DomainEntityId
}

export type SidebarNavItem = {
  id: DomainSurfaceId
  label: string
  icon: string
  viewId: DomainViewId
}

export type SidebarConfig = {
  actions: SidebarAction[]
  navigation: SidebarNavItem[]
}

export type DomainVocabulary = {
  domainTitle: string
  entities: Record<DomainEntityId, { singular: string; plural: string }>
  verbs: Record<DomainVerbId, { label: string }>
  labels?: Record<string, string>
}

export type DomainDefinition = {
  id: string
  title: string
  icon: string
  accent: DomainAccent
  vocabulary: DomainVocabulary
  entities: Record<DomainEntityId, DomainEntityDefinition>
  verbs: Record<DomainVerbId, DomainVerbDefinition>
  views: Record<DomainViewId, DomainViewDefinition>
  surfaces: {
    defaultViewId: DomainViewId
    localOnlyViewIds: DomainViewId[]
    actions: SidebarAction[]
    navigation: SidebarNavItem[]
  }
  specs: Partial<Record<DomainViewId, unknown>>
}
