import { defineDomain } from '../manifest'
import { marketingSpecs } from './specs'

const marketing = defineDomain({
  id: 'marketing',
  title: 'Marketing',
  icon: '📢',
  accent: {
    color: '#34d399',
    gradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.05))',
  },
  vocabulary: {
    domainTitle: 'Marketing',
    entities: {
      campaign: { singular: 'Campaign', plural: 'Campaigns' },
      creative: { singular: 'Creative', plural: 'Creatives' },
      channel: { singular: 'Channel', plural: 'Channels' },
    },
    verbs: {
      create: { label: 'Create' },
      launch: { label: 'Launch' },
      test: { label: 'Test' },
      segment: { label: 'Segment' },
      optimize: { label: 'Optimize' },
      pause: { label: 'Pause' },
    },
  },
  entities: {
    campaign: {
      id: 'campaign',
      label: 'Campaign',
      pluralLabel: 'Campaigns',
      actions: ['create', 'edit', 'delete', 'approve'],
      inspector: { enabled: true },
    },
    creative: {
      id: 'creative',
      label: 'Creative',
      pluralLabel: 'Creatives',
      actions: ['create', 'edit', 'delete', 'approve'],
      inspector: { enabled: true },
    },
    channel: {
      id: 'channel',
      label: 'Channel',
      pluralLabel: 'Channels',
      actions: ['create', 'edit', 'delete', 'approve'],
      inspector: { enabled: true },
    },
  },
  verbs: {
    create: {
      id: 'create',
      label: 'Create',
      scope: 'entity',
      entityIds: ['campaign', 'creative', 'channel'],
    },
    launch: { id: 'launch', label: 'Launch', scope: 'domain' },
    test: { id: 'test', label: 'Test', scope: 'domain' },
    segment: { id: 'segment', label: 'Segment', scope: 'domain' },
    optimize: { id: 'optimize', label: 'Optimize', scope: 'domain' },
    pause: { id: 'pause', label: 'Pause', scope: 'domain' },
  },
  views: {
    dashboard: {
      id: 'dashboard',
      title: 'Dashboard',
      kind: 'dashboard',
      entityId: 'campaign',
      specId: 'dashboard',
    },
    campaigns: {
      id: 'campaigns',
      title: 'Campaigns',
      kind: 'table',
      entityId: 'campaign',
      specId: 'campaigns',
    },
    creatives: {
      id: 'creatives',
      title: 'Creatives',
      kind: 'board',
      entityId: 'creative',
      specId: 'creatives',
    },
    channels: {
      id: 'channels',
      title: 'Channels',
      kind: 'list',
      entityId: 'channel',
      specId: 'channels',
    },
    analytics: {
      id: 'analytics',
      title: 'Analytics',
      kind: 'analytics',
      entityId: 'campaign',
      specId: 'analytics',
    },
  },
  surfaces: {
    defaultViewId: 'dashboard',
    localOnlyViewIds: [],
    actions: [
      {
        id: 'create-campaign',
        label: 'Campaign',
        icon: 'Megaphone',
        verbId: 'create',
        entityId: 'campaign',
      },
      {
        id: 'create-creative',
        label: 'Creative',
        icon: 'Image',
        verbId: 'create',
        entityId: 'creative',
      },
    ],
    navigation: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', viewId: 'dashboard' },
      { id: 'campaigns', label: 'Campaigns', icon: 'Megaphone', viewId: 'campaigns' },
      { id: 'creatives', label: 'Creatives', icon: 'Image', viewId: 'creatives' },
      { id: 'channels', label: 'Channels', icon: 'Radio', viewId: 'channels' },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart3', viewId: 'analytics' },
    ],
  },
  specs: marketingSpecs,
})

export default marketing
