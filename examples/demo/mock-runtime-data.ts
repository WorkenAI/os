import {
  SHELL_DOMAIN_CATALOG,
  type ShellBusinessDomainId,
  type ShellDomainCatalogEntry,
  type ShellRoleLayerDomainId,
  shellCatalogIdsByLayer,
} from './shell-catalog'
import type { LandingDeliveryItem, LandingSceneTraffic } from './types'

export type ShellEntityRecord = {
  id: string
  entityType: string
  name: string
  role: string
  email?: string
  location?: string
  status: string
  source?: string
  appliedDate?: string
  tags: string[]
}

export type MockMetric = {
  label: string
  value: number | string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}

export type MockBoardItem = {
  id: string
  title: string
  subtitle?: string
  badge?: string
}

export type MockBoardLane = {
  title: string
  count: number
  items: MockBoardItem[]
}

export type MockActivityItem = {
  actor: string
  action: string
  target?: string
  time: string
}

export type MockShellViewData = {
  metrics?: MockMetric[]
  boardTitle?: string
  boardLanes?: Record<string, MockBoardLane>
  tableRows?: Array<Record<string, string>>
  activity?: MockActivityItem[]
}

export type MockRuntimeSnapshot = {
  sceneTraffic: LandingSceneTraffic
  shellViews: Record<string, Record<string, MockShellViewData>>
  entityRecords: Record<string, Record<string, ShellEntityRecord>>
}

const businessDomainOrder = shellCatalogIdsByLayer('business')

/** Accent hex for role traffic packets — from {@link SHELL_DOMAIN_CATALOG}. */
const ROLE_PACKET_DOMAIN_ACCENTS = Object.fromEntries(
  SHELL_DOMAIN_CATALOG.filter((e) => e.landingLayer === 'roles').map((e) => {
    const entry = e as Extract<ShellDomainCatalogEntry, { landingLayer: 'roles' }> & {
      trafficAccent: string
    }
    return [entry.id, entry.trafficAccent]
  }),
) as Record<ShellRoleLayerDomainId, string>

type HrCandidate = {
  id: string
  name: string
  position: string
  status: 'Screening' | 'Interview' | 'Offer' | 'Hired'
  source: string
  date: string
  email: string
  location: string
  tags: string[]
}

type SalesLead = {
  id: string
  name: string
  company: string
  position: string
  status: 'New' | 'Qualification' | 'Negotiation' | 'Proposal' | 'Closed'
  source: string
  date: string
  email: string
  location: string
  amount: string
}

type SalesDeal = {
  id: string
  name: string
  company: string
  amount: string
  stage: 'New lead' | 'Qualification' | 'Proposal' | 'Closing'
  badge: string
  contactRole: string
  source: string
  date: string
  email: string
  location: string
}

type MarketingCampaign = {
  id: string
  name: string
  channel: string
  status: 'Draft' | 'Preparing' | 'Active' | 'Completed'
  budget: string
  reach: string
  startDate: string
  owner: string
}

type MarketingCreative = {
  id: string
  name: string
  format: string
  stage: 'In progress' | 'In review' | 'Approved'
  kind: string
  owner: string
}

const CYCLE_MS = 20_000
const BUSINESS_SPAWN_INTERVAL_MS = 5_000
const ROLE_SPAWN_INTERVAL_MS = 4_000
const RECENT_ACTIVITY_COUNT = 4
const BOARD_PREVIEW_ITEM_COUNT = 4
const TABLE_ROW_LIMIT = 8

const businessDomainOffsets = Object.fromEntries(
  businessDomainOrder.map((id, index) => [id, BUSINESS_SPAWN_INTERVAL_MS * index]),
) as Record<ShellBusinessDomainId, number>

const roleDomainIds = shellCatalogIdsByLayer('roles')
if (roleDomainIds.length < 2) {
  throw new Error('Mock role scene traffic expects at least two role-layer domains in shell-catalog')
}
const [roleA, roleB] = [roleDomainIds[0]!, roleDomainIds[1]!] as const satisfies readonly [
  ShellRoleLayerDomainId,
  ShellRoleLayerDomainId,
]
const roleTrafficSlots: readonly {
  domainId: ShellRoleLayerDomainId
  slot: number
  delayMs: number
}[] = [
  { domainId: roleA, slot: 0, delayMs: 0 },
  { domainId: roleB, slot: 0, delayMs: -ROLE_SPAWN_INTERVAL_MS },
  { domainId: roleA, slot: 1, delayMs: -ROLE_SPAWN_INTERVAL_MS * 2 },
  { domainId: roleB, slot: 1, delayMs: -ROLE_SPAWN_INTERVAL_MS * 3 },
]

const hrCandidates: HrCandidate[] = [
  {
    id: 'c1',
    name: 'Anna Peterson',
    position: 'Senior Frontend',
    status: 'Screening',
    source: 'LinkedIn',
    date: 'Mar 12, 2026',
    email: 'anna@example.com',
    location: 'London',
    tags: ['React', 'TypeScript', 'Next.js'],
  },
  {
    id: 'c2',
    name: 'Benjamin Cole',
    position: 'Backend Engineer',
    status: 'Screening',
    source: 'Referral',
    date: 'Mar 11, 2026',
    email: 'benjamin@example.com',
    location: 'Berlin',
    tags: ['Go', 'PostgreSQL', 'K8s'],
  },
  {
    id: 'c3',
    name: 'Claire Nguyen',
    position: 'Product Designer',
    status: 'Screening',
    source: 'Job board',
    date: 'Mar 12, 2026',
    email: 'claire@example.com',
    location: 'Remote',
    tags: ['Figma', 'UX Research'],
  },
  {
    id: 'c4',
    name: 'Daniel Wright',
    position: 'Senior Backend',
    status: 'Interview',
    source: 'Job board',
    date: 'Mar 10, 2026',
    email: 'daniel@example.com',
    location: 'Austin',
    tags: ['Java', 'Spring', 'AWS'],
  },
  {
    id: 'c5',
    name: 'Emma Johansson',
    position: 'Data Analyst',
    status: 'Interview',
    source: 'LinkedIn',
    date: 'Mar 8, 2026',
    email: 'emma@example.com',
    location: 'Singapore',
    tags: ['SQL', 'Python', 'Tableau'],
  },
  {
    id: 'c6',
    name: 'Felix Romero',
    position: 'DevOps Engineer',
    status: 'Offer',
    source: 'Conference',
    date: 'Mar 5, 2026',
    email: 'felix@example.com',
    location: 'Toronto',
    tags: ['Docker', 'Terraform', 'CI/CD'],
  },
  {
    id: 'c7',
    name: 'Grace Okafor',
    position: 'QA Engineer',
    status: 'Screening',
    source: 'Job board',
    date: 'Mar 14, 2026',
    email: 'grace@example.com',
    location: 'Dublin',
    tags: ['Playwright', 'Cypress', 'API'],
  },
  {
    id: 'c8',
    name: 'Hannah Brooks',
    position: 'ML Engineer',
    status: 'Interview',
    source: 'Referral',
    date: 'Mar 9, 2026',
    email: 'hannah@example.com',
    location: 'Remote',
    tags: ['Python', 'MLOps', 'Pandas'],
  },
  {
    id: 'c9',
    name: 'Ian Mitchell',
    position: 'Tech Lead',
    status: 'Offer',
    source: 'GitHub',
    date: 'Mar 7, 2026',
    email: 'ian@example.com',
    location: 'Amsterdam',
    tags: ['Architecture', 'Node.js', 'Bun'],
  },
  {
    id: 'c10',
    name: 'Julia Santos',
    position: 'Frontend Engineer',
    status: 'Hired',
    source: 'LinkedIn',
    date: 'Mar 3, 2026',
    email: 'julia@example.com',
    location: 'São Paulo',
    tags: ['Vue', 'React', 'Design Systems'],
  },
]

const salesLeads: SalesLead[] = [
  {
    id: 'l1',
    name: 'Kevin Walsh',
    company: 'Globex Corp',
    position: 'VP of IT',
    status: 'Qualification',
    source: 'Website',
    date: 'Mar 13, 2026',
    email: 'kevin.walsh@globex.example',
    location: 'New York',
    amount: '$1.2M',
  },
  {
    id: 'l2',
    name: 'Laura Chen',
    company: 'Northwind Energy',
    position: 'Program Director',
    status: 'Qualification',
    source: 'LinkedIn',
    date: 'Mar 12, 2026',
    email: 'laura.chen@northwind.example',
    location: 'Houston',
    amount: '$890K',
  },
  {
    id: 'l3',
    name: 'Marcus Webb',
    company: 'Contoso Logistics',
    position: 'CTO',
    status: 'Negotiation',
    source: 'Conference',
    date: 'Mar 11, 2026',
    email: 'marcus.webb@contoso.example',
    location: 'Chicago',
    amount: '$2.1M',
  },
  {
    id: 'l4',
    name: 'Nina Patel',
    company: 'Fabrikam Telecom',
    position: 'Product Manager',
    status: 'New',
    source: 'Ads',
    date: 'Mar 13, 2026',
    email: 'nina.patel@fabrikam.example',
    location: 'Seattle',
    amount: '$450K',
  },
  {
    id: 'l5',
    name: 'Oliver Grant',
    company: 'Wide World Traders',
    position: 'Head of Procurement',
    status: 'Negotiation',
    source: 'Referral',
    date: 'Mar 10, 2026',
    email: 'oliver.grant@wideworld.example',
    location: 'Boston',
    amount: '$3.5M',
  },
  {
    id: 'l6',
    name: 'Paula Reyes',
    company: 'Adventure Works',
    position: 'Head of Operations',
    status: 'Proposal',
    source: 'Website',
    date: 'Mar 8, 2026',
    email: 'paula.reyes@adventure.example',
    location: 'San Francisco',
    amount: '$1.8M',
  },
  {
    id: 'l7',
    name: 'Quentin Blake',
    company: 'Litware Inc',
    position: 'Product Manager',
    status: 'Qualification',
    source: 'Email campaign',
    date: 'Mar 9, 2026',
    email: 'quentin.blake@litware.example',
    location: 'Denver',
    amount: '$620K',
  },
  {
    id: 'l8',
    name: 'Rachel Stone',
    company: 'Alpine Bank Group',
    position: 'VP Digital',
    status: 'Closed',
    source: 'Partner',
    date: 'Mar 5, 2026',
    email: 'rachel.stone@alpine.example',
    location: 'Miami',
    amount: '$4.2M',
  },
]

const salesDeals: SalesDeal[] = [
  {
    id: 'd1',
    name: 'Kevin Walsh',
    company: 'Globex Corp',
    amount: '$1.2M',
    stage: 'New lead',
    badge: 'Website',
    contactRole: 'VP of IT',
    source: 'Website',
    date: 'Mar 13, 2026',
    email: 'kevin.walsh@globex.example',
    location: 'New York',
  },
  {
    id: 'd2',
    name: 'Nina Patel',
    company: 'Fabrikam Telecom',
    amount: '$450K',
    stage: 'New lead',
    badge: 'Ads',
    contactRole: 'Product Manager',
    source: 'Ads',
    date: 'Mar 13, 2026',
    email: 'nina.patel@fabrikam.example',
    location: 'Seattle',
  },
  {
    id: 'd3',
    name: 'Laura Chen',
    company: 'Northwind Energy',
    amount: '$890K',
    stage: 'Qualification',
    badge: 'BANT',
    contactRole: 'Program Director',
    source: 'LinkedIn',
    date: 'Mar 12, 2026',
    email: 'laura.chen@northwind.example',
    location: 'Houston',
  },
  {
    id: 'd4',
    name: 'Marcus Webb',
    company: 'Contoso Logistics',
    amount: '$2.1M',
    stage: 'Qualification',
    badge: 'Qualified',
    contactRole: 'CTO',
    source: 'Conference',
    date: 'Mar 11, 2026',
    email: 'marcus.webb@contoso.example',
    location: 'Chicago',
  },
  {
    id: 'd5',
    name: 'Quentin Blake',
    company: 'Litware Inc',
    amount: '$620K',
    stage: 'Qualification',
    badge: 'In progress',
    contactRole: 'Product Manager',
    source: 'Email campaign',
    date: 'Mar 9, 2026',
    email: 'quentin.blake@litware.example',
    location: 'Denver',
  },
  {
    id: 'd6',
    name: 'Oliver Grant',
    company: 'Wide World Traders',
    amount: '$3.5M',
    stage: 'Proposal',
    badge: 'Proposal sent',
    contactRole: 'Head of Procurement',
    source: 'Referral',
    date: 'Mar 10, 2026',
    email: 'oliver.grant@wideworld.example',
    location: 'Boston',
  },
  {
    id: 'd7',
    name: 'Paula Reyes',
    company: 'Adventure Works',
    amount: '$1.8M',
    stage: 'Proposal',
    badge: 'Demo',
    contactRole: 'Head of Operations',
    source: 'Website',
    date: 'Mar 8, 2026',
    email: 'paula.reyes@adventure.example',
    location: 'San Francisco',
  },
  {
    id: 'd8',
    name: 'Steven Park',
    company: 'Tailspin Retail',
    amount: '$2.4M',
    stage: 'Proposal',
    badge: 'Legal review',
    contactRole: 'Director of Digital',
    source: 'Outbound',
    date: 'Mar 6, 2026',
    email: 'steven.park@tailspin.example',
    location: 'Atlanta',
  },
  {
    id: 'd9',
    name: 'Rachel Stone',
    company: 'Alpine Bank Group',
    amount: '$4.2M',
    stage: 'Closing',
    badge: 'Contract',
    contactRole: 'VP Digital',
    source: 'Partner',
    date: 'Mar 5, 2026',
    email: 'rachel.stone@alpine.example',
    location: 'Miami',
  },
  {
    id: 'd10',
    name: 'Tom Ellis',
    company: 'Blue Yonder Media',
    amount: '$1.1M',
    stage: 'Closing',
    badge: 'Signing',
    contactRole: 'Head of Product',
    source: 'Referral',
    date: 'Mar 4, 2026',
    email: 'tom.ellis@blueyonder.example',
    location: 'Portland',
  },
]

const marketingCampaigns: MarketingCampaign[] = [
  {
    id: 'm1',
    name: 'Brand campaign 2026',
    channel: 'Meta Ads, LinkedIn',
    status: 'Active',
    budget: '$450,000',
    reach: '320K',
    startDate: 'Mar 1, 2026',
    owner: 'Growth Team',
  },
  {
    id: 'm2',
    name: 'Search intent keywords',
    channel: 'Google Ads',
    status: 'Active',
    budget: '$180,000',
    reach: '95K',
    startDate: 'Mar 5, 2026',
    owner: 'Demand Gen',
  },
  {
    id: 'm3',
    name: 'Stories promo pack',
    channel: 'Instagram, TikTok',
    status: 'Active',
    budget: '$120,000',
    reach: '210K',
    startDate: 'Mar 8, 2026',
    owner: 'Content Squad',
  },
  {
    id: 'm4',
    name: 'Spring sale',
    channel: 'Programmatic, Google Ads',
    status: 'Preparing',
    budget: '$280,000',
    reach: '—',
    startDate: 'Mar 20, 2026',
    owner: 'Performance Team',
  },
  {
    id: 'm5',
    name: 'New product launch',
    channel: 'Meta Ads, Slack ads',
    status: 'Preparing',
    budget: '$350,000',
    reach: '—',
    startDate: 'Mar 25, 2026',
    owner: 'Launch Team',
  },
  {
    id: 'm6',
    name: 'Holiday push',
    channel: 'Google Ads, Meta',
    status: 'Completed',
    budget: '$520,000',
    reach: '890K',
    startDate: 'Dec 15, 2025',
    owner: 'Lifecycle Team',
  },
  {
    id: 'm7',
    name: 'Black Friday 2025',
    channel: 'Meta Ads, Google Ads',
    status: 'Completed',
    budget: '$680,000',
    reach: '1.2M',
    startDate: 'Nov 22, 2025',
    owner: 'Performance Team',
  },
  {
    id: 'm8',
    name: 'Retargeting Q1',
    channel: 'Google Ads',
    status: 'Draft',
    budget: '$90,000',
    reach: '—',
    startDate: 'Apr 1, 2026',
    owner: 'CRM Team',
  },
]

const marketingCreatives: MarketingCreative[] = [
  {
    id: 'cr1',
    name: 'Spring sale hero banner',
    format: '1200x628',
    stage: 'In progress',
    kind: 'Banner',
    owner: 'Design Team',
  },
  {
    id: 'cr2',
    name: 'Product X video spot',
    format: '15s, 1080p',
    stage: 'In progress',
    kind: 'Video',
    owner: 'Video Team',
  },
  {
    id: 'cr3',
    name: 'Stories promo pack',
    format: '1080x1920, 5 slides',
    stage: 'In progress',
    kind: 'Stories',
    owner: 'Content Squad',
  },
  {
    id: 'cr4',
    name: 'Instagram carousel',
    format: '10 cards',
    stage: 'In progress',
    kind: 'Carousel',
    owner: 'Design Team',
  },
  {
    id: 'cr5',
    name: 'Black Friday video',
    format: '30s, 1080p',
    stage: 'In review',
    kind: 'Video',
    owner: 'Video Team',
  },
  {
    id: 'cr6',
    name: 'Retargeting banners',
    format: '3 sizes',
    stage: 'In review',
    kind: 'Banner',
    owner: 'CRM Team',
  },
  {
    id: 'cr7',
    name: 'Stories brand campaign',
    format: '1080x1920',
    stage: 'In review',
    kind: 'Stories',
    owner: 'Growth Team',
  },
  {
    id: 'cr8',
    name: 'Holiday banner set',
    format: '5 sizes',
    stage: 'Approved',
    kind: 'Banner',
    owner: 'Lifecycle Team',
  },
  {
    id: 'cr9',
    name: 'Product teaser video',
    format: '6s square',
    stage: 'Approved',
    kind: 'Video',
    owner: 'Launch Team',
  },
  {
    id: 'cr10',
    name: 'Summer stories pack',
    format: '1080x1920',
    stage: 'Approved',
    kind: 'Stories',
    owner: 'Brand Team',
  },
  {
    id: 'cr11',
    name: 'Search static set',
    format: 'Google Ads',
    stage: 'Approved',
    kind: 'Banner',
    owner: 'Demand Gen',
  },
]

const roleTrafficLabels: Record<ShellRoleLayerDomainId, string[]> = {
  admin: ['Access request', 'New role', 'Policy update', 'Audit rule'],
  developer: ['Bug report', 'Pull request', 'Runtime patch', 'Capability'],
}

export const sceneDeliveryQueues: Record<ShellBusinessDomainId, LandingDeliveryItem[]> = {
  hr: hrCandidates.map((candidate) => ({
    id: candidate.id,
    label: candidate.name.split(' ')[0] ?? candidate.name,
    entityType: 'candidate',
    entityId: candidate.id,
  })),
  sales: salesDeals.map((deal) => ({
    id: deal.id,
    label: deal.company,
    entityType: 'deal',
    entityId: deal.id,
  })),
  marketing: marketingCampaigns.map((campaign) => ({
    id: campaign.id,
    label: campaign.name,
    entityType: 'campaign',
    entityId: campaign.id,
  })),
}

export const SCENE_DOMAIN_ORDER: readonly ShellBusinessDomainId[] = businessDomainOrder

function getStep(now: number, intervalMs: number, offsetMs = 0) {
  return Math.max(0, Math.floor((now + offsetMs) / intervalMs))
}

function rotateArray<T>(items: T[], step: number): T[] {
  if (items.length === 0) return []
  const offset = ((step % items.length) + items.length) % items.length
  return [...items.slice(offset), ...items.slice(0, offset)]
}

function takeLeading<T>(items: T[], limit: number) {
  return items.slice(0, Math.min(limit, items.length))
}

function formatRelativeStep(stepDelta: number) {
  if (stepDelta <= 0) return 'just now'
  const minutes = stepDelta * 5
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

function groupBoardLanes<T extends { stage: string }>(
  items: T[],
  orderedStages: string[],
  toBoardItem: (item: T) => MockBoardItem,
): Record<string, MockBoardLane> {
  return Object.fromEntries(
    orderedStages.map((title) => {
      const laneItems = items.filter((item) => item.stage === title)
      return [
        title,
        {
          title,
          count: laneItems.length,
          items: takeLeading(laneItems.map(toBoardItem), BOARD_PREVIEW_ITEM_COUNT),
        },
      ]
    }),
  )
}

function buildHrViewData(now: number, offsetMs: number): Record<string, MockShellViewData> {
  const step = getStep(now, CYCLE_MS, offsetMs)
  const orderedCandidates = rotateArray(hrCandidates, step)
  const activeCandidates = orderedCandidates.filter((candidate) => candidate.status !== 'Hired')
  const recentCandidates = takeLeading(orderedCandidates, RECENT_ACTIVITY_COUNT)

  return {
    dashboard: {
      metrics: [
        { label: 'Open positions', value: 12 + (step % 3), change: '+1 this week', trend: 'up' },
        {
          label: 'Active candidates',
          value: activeCandidates.length * 9,
          change: `+${2 + (step % 4)}%`,
          trend: 'up',
        },
        { label: 'Time to hire (days)', value: 21 + (step % 3), change: '-1 day', trend: 'down' },
        {
          label: 'Hired this month',
          value: 6 + (step % 2),
          change: 'On plan',
          trend: 'neutral',
        },
      ],
      boardTitle: 'Candidate pipeline',
      boardLanes: {
        Screening: {
          title: 'Screening',
          count: hrCandidates.filter((candidate) => candidate.status === 'Screening').length,
          items: takeLeading(
            orderedCandidates
              .filter((candidate) => candidate.status === 'Screening')
              .map((candidate) => ({
                id: candidate.id,
                title: candidate.name,
                subtitle: candidate.position,
                badge: candidate.source,
              })),
            3,
          ),
        },
        Interview: {
          title: 'Interview',
          count: hrCandidates.filter((candidate) => candidate.status === 'Interview').length,
          items: takeLeading(
            orderedCandidates
              .filter((candidate) => candidate.status === 'Interview')
              .map((candidate) => ({
                id: candidate.id,
                title: candidate.name,
                subtitle: candidate.position,
                badge: 'Interview',
              })),
            3,
          ),
        },
        Offer: {
          title: 'Offer',
          count: hrCandidates.filter((candidate) => candidate.status === 'Offer').length,
          items: takeLeading(
            orderedCandidates
              .filter((candidate) => candidate.status === 'Offer')
              .map((candidate) => ({
                id: candidate.id,
                title: candidate.name,
                subtitle: candidate.position,
                badge: 'Offer',
              })),
            3,
          ),
        },
      },
      activity: recentCandidates.map((candidate, index) => ({
        actor: index % 2 === 0 ? 'AI agent' : 'Maria K.',
        action:
          index % 2 === 0 ? 'updated the candidate profile for' : 'scheduled the next step for',
        target: candidate.name,
        time: formatRelativeStep(index),
      })),
    },
    'candidates-table': {
      tableRows: takeLeading(orderedCandidates, TABLE_ROW_LIMIT).map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        position: candidate.position,
        status: candidate.status,
        source: candidate.source,
        date: candidate.date,
      })),
    },
    'pipeline-board': {
      boardTitle: 'Hiring pipeline',
      boardLanes: groupBoardLanes(
        orderedCandidates.map((candidate) => ({ ...candidate, stage: candidate.status })),
        ['Screening', 'Interview', 'Offer', 'Hired'],
        (candidate) => ({
          id: candidate.id,
          title: candidate.name,
          subtitle: candidate.position,
          badge: candidate.source,
        }),
      ),
    },
  }
}

function buildSalesViewData(now: number, offsetMs: number): Record<string, MockShellViewData> {
  const step = getStep(now, CYCLE_MS, offsetMs)
  const orderedLeads = rotateArray(salesLeads, step)
  const orderedDeals = rotateArray(salesDeals, step)
  const recentDeals = takeLeading(orderedDeals, RECENT_ACTIVITY_COUNT)
  const openDeals = salesDeals.filter((deal) => deal.stage !== 'Closing').length

  return {
    dashboard: {
      metrics: [
        {
          label: 'Active leads',
          value: 140 + step * 2,
          change: `+${18 + (step % 5)}%`,
          trend: 'up',
        },
        { label: 'Open deals', value: openDeals, change: `+${1 + (step % 3)}`, trend: 'up' },
        { label: 'Average deal size', value: '$850K', change: '+12%', trend: 'up' },
        { label: 'Conversion', value: `${18 + (step % 3)}%`, change: '+1pp', trend: 'up' },
      ],
      boardTitle: 'Sales funnel',
      boardLanes: {
        Qualification: {
          title: 'Qualification',
          count: salesDeals.filter((deal) => deal.stage === 'Qualification').length,
          items: takeLeading(
            orderedDeals
              .filter((deal) => deal.stage === 'Qualification')
              .map((deal) => ({
                id: deal.id,
                title: deal.name,
                subtitle: `${deal.amount} - ${deal.company}`,
                badge: deal.badge,
              })),
            4,
          ),
        },
        Proposal: {
          title: 'Proposal',
          count: salesDeals.filter((deal) => deal.stage === 'Proposal').length,
          items: takeLeading(
            orderedDeals
              .filter((deal) => deal.stage === 'Proposal')
              .map((deal) => ({
                id: deal.id,
                title: deal.name,
                subtitle: `${deal.amount} - ${deal.company}`,
                badge: deal.badge,
              })),
            4,
          ),
        },
        Closing: {
          title: 'Closing',
          count: salesDeals.filter((deal) => deal.stage === 'Closing').length,
          items: takeLeading(
            orderedDeals
              .filter((deal) => deal.stage === 'Closing')
              .map((deal) => ({
                id: deal.id,
                title: deal.name,
                subtitle: `${deal.amount} - ${deal.company}`,
                badge: deal.badge,
              })),
            4,
          ),
        },
      },
      activity: recentDeals.map((deal, index) => ({
        actor: index % 2 === 0 ? 'AI agent' : 'Maria K.',
        action:
          index % 2 === 0 ? 'recalculated close probability for' : 'prepared a follow-up for',
        target: `${deal.name} - ${deal.company}`,
        time: formatRelativeStep(index),
      })),
    },
    'leads-table': {
      tableRows: takeLeading(orderedLeads, TABLE_ROW_LIMIT).map((lead) => ({
        id: lead.id,
        name: lead.name,
        company: lead.company,
        position: lead.position,
        status: lead.status,
        source: lead.source,
        date: lead.date,
      })),
    },
    'pipeline-board': {
      boardTitle: 'Sales pipeline',
      boardLanes: groupBoardLanes(
        orderedDeals.map((deal) => ({ ...deal, stage: deal.stage })),
        ['New lead', 'Qualification', 'Proposal', 'Closing'],
        (deal) => ({
          id: deal.id,
          title: deal.name,
          subtitle: `${deal.amount} - ${deal.company}`,
          badge: deal.badge,
        }),
      ),
    },
  }
}

function buildMarketingViewData(now: number, offsetMs: number): Record<string, MockShellViewData> {
  const step = getStep(now, CYCLE_MS, offsetMs)
  const orderedCampaigns = rotateArray(marketingCampaigns, step)
  const orderedCreatives = rotateArray(marketingCreatives, step)
  const recentCampaigns = takeLeading(orderedCampaigns, RECENT_ACTIVITY_COUNT)
  const activeCampaignCount = marketingCampaigns.filter(
    (campaign) => campaign.status === 'Active',
  ).length

  return {
    dashboard: {
      metrics: [
        {
          label: 'Active campaigns',
          value: activeCampaignCount,
          change: `+${step % 3}`,
          trend: 'up',
        },
        { label: 'Monthly reach', value: `${1.2 + step * 0.05}M`, change: '+8%', trend: 'up' },
        {
          label: 'CTR',
          value: `${(3.2 + (step % 4) * 0.1).toFixed(1)}%`,
          change: '+0.2pp',
          trend: 'up',
        },
        {
          label: 'Budget utilized',
          value: `${68 + (step % 5)}%`,
          change: 'On plan',
          trend: 'neutral',
        },
      ],
      boardTitle: 'Campaigns by status',
      boardLanes: {
        Preparing: {
          title: 'Preparing',
          count: marketingCampaigns.filter((campaign) => campaign.status === 'Preparing').length,
          items: takeLeading(
            orderedCampaigns
              .filter((campaign) => campaign.status === 'Preparing')
              .map((campaign) => ({
                id: campaign.id,
                title: campaign.name,
                subtitle: campaign.channel,
                badge: campaign.status,
              })),
            3,
          ),
        },
        Active: {
          title: 'Active',
          count: marketingCampaigns.filter((campaign) => campaign.status === 'Active').length,
          items: takeLeading(
            orderedCampaigns
              .filter((campaign) => campaign.status === 'Active')
              .map((campaign) => ({
                id: campaign.id,
                title: campaign.name,
                subtitle: campaign.channel,
                badge: campaign.status,
              })),
            3,
          ),
        },
        Completed: {
          title: 'Completed',
          count: marketingCampaigns.filter((campaign) => campaign.status === 'Completed').length,
          items: takeLeading(
            orderedCampaigns
              .filter((campaign) => campaign.status === 'Completed')
              .map((campaign) => ({
                id: campaign.id,
                title: campaign.name,
                subtitle: campaign.channel,
                badge: campaign.status,
              })),
            3,
          ),
        },
      },
      activity: recentCampaigns.map((campaign, index) => ({
        actor: index % 2 === 0 ? 'AI agent' : 'Growth Team',
        action: index % 2 === 0 ? 'updated campaign segmentation for' : 'prepared a new launch for',
        target: campaign.name,
        time: formatRelativeStep(index),
      })),
    },
    campaigns: {
      tableRows: takeLeading(orderedCampaigns, TABLE_ROW_LIMIT).map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        budget: campaign.budget,
        reach: campaign.reach,
        startDate: campaign.startDate,
      })),
    },
    creatives: {
      boardTitle: 'Creatives',
      boardLanes: groupBoardLanes(
        orderedCreatives.map((creative) => ({ ...creative, stage: creative.stage })),
        ['In progress', 'In review', 'Approved'],
        (creative) => ({
          id: creative.id,
          title: creative.name,
          subtitle: creative.format,
          badge: creative.kind,
        }),
      ),
    },
  }
}

function buildRoleSceneTraffic(now: number): LandingSceneTraffic['rolePackets'] {
  return roleTrafficSlots.map(({ domainId, slot, delayMs }) => {
    const labelStep = getStep(now, CYCLE_MS, slot * ROLE_SPAWN_INTERVAL_MS)
    const labels = rotateArray(roleTrafficLabels[domainId], labelStep)

    return {
      id: `${domainId}-${slot}-${labelStep}`,
      label: labels[0] ?? domainId,
      route: `business-route-${domainId}`,
      delayMs,
      accent: ROLE_PACKET_DOMAIN_ACCENTS[domainId],
    }
  })
}

function buildEntityRecordLookup() {
  const entityRecords: Record<string, Record<string, ShellEntityRecord>> = {
    candidate: {},
    lead: {},
    deal: {},
    campaign: {},
    creative: {},
  }

  for (const candidate of hrCandidates) {
    entityRecords.candidate[candidate.id] = {
      id: candidate.id,
      entityType: 'candidate',
      name: candidate.name,
      role: candidate.position,
      email: candidate.email,
      location: candidate.location,
      status: candidate.status,
      source: candidate.source,
      appliedDate: candidate.date,
      tags: candidate.tags,
    }
  }

  for (const lead of salesLeads) {
    entityRecords.lead[lead.id] = {
      id: lead.id,
      entityType: 'lead',
      name: lead.name,
      role: `${lead.position} - ${lead.company}`,
      email: lead.email,
      location: lead.location,
      status: lead.status,
      source: lead.source,
      appliedDate: lead.date,
      tags: [lead.amount, lead.company],
    }
  }

  for (const deal of salesDeals) {
    entityRecords.deal[deal.id] = {
      id: deal.id,
      entityType: 'deal',
      name: deal.name,
      role: `${deal.company} - ${deal.contactRole}`,
      email: deal.email,
      location: deal.location,
      status: deal.stage,
      source: deal.source,
      appliedDate: deal.date,
      tags: [deal.amount, deal.badge],
    }
  }

  for (const campaign of marketingCampaigns) {
    entityRecords.campaign[campaign.id] = {
      id: campaign.id,
      entityType: 'campaign',
      name: campaign.name,
      role: campaign.channel,
      email: undefined,
      location: campaign.owner,
      status: campaign.status,
      source: campaign.owner,
      appliedDate: campaign.startDate,
      tags: [campaign.budget, campaign.reach],
    }
  }

  for (const creative of marketingCreatives) {
    entityRecords.creative[creative.id] = {
      id: creative.id,
      entityType: 'creative',
      name: creative.name,
      role: creative.format,
      email: undefined,
      location: creative.owner,
      status: creative.stage,
      source: creative.kind,
      appliedDate: undefined,
      tags: [creative.kind, creative.owner],
    }
  }

  return entityRecords
}

const fallbackEntityRecords = buildEntityRecordLookup()

export function getFallbackEntityRecord(entityType: string, id: string) {
  return fallbackEntityRecords[entityType]?.[id] ?? null
}

export function createMockRuntimeSnapshot(now: number): MockRuntimeSnapshot {
  return {
    sceneTraffic: {
      rolePackets: buildRoleSceneTraffic(now),
    },
    shellViews: {
      hr: buildHrViewData(now, businessDomainOffsets.hr),
      sales: buildSalesViewData(now, businessDomainOffsets.sales),
      marketing: buildMarketingViewData(now, businessDomainOffsets.marketing),
    },
    entityRecords: fallbackEntityRecords,
  }
}

export const mockRuntimeTiming = {
  cycleMs: CYCLE_MS,
  businessSpawnIntervalMs: BUSINESS_SPAWN_INTERVAL_MS,
  roleSpawnIntervalMs: ROLE_SPAWN_INTERVAL_MS,
} as const
