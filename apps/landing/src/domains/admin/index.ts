import { defineDomain } from '../manifest'

const admin = defineDomain({
  id: 'admin',
  title: 'Admin',
  icon: '🛡️',
  accent: {
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
  },
  vocabulary: {
    domainTitle: 'Admin',
    entities: {
      agent: { singular: 'Agent', plural: 'Agents' },
    },
    verbs: {
      'manage-roles': { label: 'Manage roles' },
      'manage-agents': { label: 'Manage agents' },
      'view-audit': { label: 'View audit log' },
      'manage-chats': { label: 'Manage chats' },
      'manage-crm': { label: 'CRM integrations' },
    },
  },
  entities: {
    agent: {
      id: 'agent',
      label: 'AI agent',
      pluralLabel: 'AI agents',
      actions: ['create', 'edit', 'delete'],
      inspector: { enabled: true },
    },
  },
  verbs: {
    'manage-roles': {
      id: 'manage-roles',
      label: 'Manage roles',
      scope: 'domain',
    },
    'manage-agents': {
      id: 'manage-agents',
      label: 'Manage agents',
      scope: 'domain',
    },
    'view-audit': {
      id: 'view-audit',
      label: 'View audit log',
      scope: 'domain',
    },
    'manage-chats': {
      id: 'manage-chats',
      label: 'Manage chats',
      scope: 'domain',
    },
    'manage-crm': {
      id: 'manage-crm',
      label: 'CRM integrations',
      scope: 'domain',
    },
  },
  views: {
    'role-manager': {
      id: 'role-manager',
      title: 'Roles & access',
      kind: 'local',
      shell: {
        layoutId: 'role-manager',
        conversation: {
          disclaimer:
            'Worken OS can make mistakes. Double-check anything business-critical.',
        },
        localAssistant: {
          introTemplate: 'Working inside the local surface {viewLabel}.',
          capabilities:
            'I can explain access, roles, and how policy changes affect the shell.',
        },
      },
    },
    'agent-manager': {
      id: 'agent-manager',
      title: 'AI agents',
      kind: 'local',
      shell: {
        layoutId: 'agent-manager',
        conversation: {
          disclaimer:
            'Worken OS can make mistakes. Double-check anything business-critical.',
        },
        localAssistant: {
          introTemplate: 'Working inside the {viewLabel} surface.',
          capabilities:
            'I can help configure AI agents: instructions, allowed actions, chat bindings, and delegation policies.',
        },
      },
    },
    'audit-viewer': {
      id: 'audit-viewer',
      title: 'Audit log',
      kind: 'local',
      shell: {
        layoutId: 'agent-manager',
        conversation: {
          disclaimer:
            'Worken OS can make mistakes. Double-check anything business-critical.',
        },
        localAssistant: {
          introTemplate: 'Working inside the {viewLabel} surface.',
          capabilities:
            'I can show history of agent and human actions, ownership transfers, and state changes.',
        },
      },
    },
    'chat-manager': {
      id: 'chat-manager',
      title: 'Chats & integrations',
      kind: 'local',
      shell: {
        layoutId: 'agent-manager',
        conversation: {
          disclaimer:
            'Worken OS can make mistakes. Double-check anything business-critical.',
        },
        localAssistant: {
          introTemplate: 'Working inside the {viewLabel} surface.',
          capabilities:
            'I can bind integration channels to agents and configure read/reply permissions in chats.',
        },
      },
    },
    'crm-manager': {
      id: 'crm-manager',
      title: 'CRM integrations',
      kind: 'local',
      shell: {
        layoutId: 'crm-manager',
        conversation: {
          disclaimer:
            'Worken OS can make mistakes. Double-check anything business-critical.',
        },
        localAssistant: {
          introTemplate: 'Working inside the {viewLabel} surface.',
          capabilities:
            'I can help map CRM fields and statuses and set triggers for automatically attaching agents.',
        },
      },
    },
  },
  surfaces: {
    defaultViewId: 'role-manager',
    localOnlyViewIds: [
      'role-manager',
      'agent-manager',
      'audit-viewer',
      'chat-manager',
      'crm-manager',
    ],
    actions: [],
    navigation: [
      { id: 'role-manager', label: 'Roles & access', icon: 'Shield', viewId: 'role-manager' },
      { id: 'agent-manager', label: 'AI agents', icon: 'Bot', viewId: 'agent-manager' },
      { id: 'audit-viewer', label: 'Audit', icon: 'ScrollText', viewId: 'audit-viewer' },
      { id: 'chat-manager', label: 'Chats', icon: 'MessageSquare', viewId: 'chat-manager' },
      { id: 'crm-manager', label: 'CRM', icon: 'Database', viewId: 'crm-manager' },
    ],
  },
  specs: {},
})

export default admin
