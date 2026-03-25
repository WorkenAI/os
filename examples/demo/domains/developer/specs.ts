export const developerSpecs: Record<string, unknown> = {
  primitives: {
    type: 'flex',
    direction: 'column',
    gap: 16,
    children: [
      {
        type: 'flex',
        direction: 'column',
        gap: 4,
        children: [
          { type: 'heading', level: 1, text: 'Worken OS Primitives' },
          {
            type: 'text',
            text: '7 core primitives + 1 identity primitive. Everything in the system is built from these.',
            variant: 'muted',
          },
        ],
      },
      {
        type: 'grid',
        columns: 2,
        gap: 12,
        children: [
          primitiveCard(
            '1',
            'Actor',
            'human | ai | integration | system',
            'Identity of anyone that does work. No special treatment for any kind.',
            '#60a5fa',
          ),
          primitiveCard(
            '2',
            'Object',
            'entityType + phase + ownership + data',
            'A living business item with lifecycle, owner, and audit trail.',
            '#a78bfa',
          ),
          primitiveCard(
            '3',
            'Action',
            '14 canonical verbs',
            'capture → assign → review → approve → close. Domain actions specialize these.',
            '#22d3ee',
          ),
          primitiveCard(
            '4',
            'Lifecycle',
            'phases + transitions + guards',
            'draft → open → in_progress → waiting_review → completed. Guards enforce who can transition.',
            '#4ade80',
          ),
          primitiveCard(
            '5',
            'Ownership',
            'owner + assignee + reviewer + watchers',
            'Who holds the ball. Every transfer recorded with reason.',
            '#f472b6',
          ),
          primitiveCard(
            '6',
            'Policy',
            'permissions + visibility + escalation',
            'Who can do what. Business rules live here, nowhere else.',
            '#fb923c',
          ),
          primitiveCard(
            '7',
            'Domain Manifest',
            'vocabulary + entities + actions + policy',
            'New domain = config, not code. registerManifest() wires everything.',
            '#facc15',
          ),
          primitiveCard(
            '8',
            'Person',
            'identities[] across channels',
            'Canonical identity. Same person via Telegram, email, CRM = one record.',
            '#c084fc',
          ),
        ],
      },
      {
        type: 'flex',
        direction: 'column',
        gap: 4,
        children: [
          { type: 'heading', level: 2, text: 'Composed from primitives' },
          {
            type: 'grid',
            columns: 3,
            gap: 8,
            children: [
              composedCard('Session', "Actor's active connection"),
              composedCard('Agent', 'AI employee with persona, tools, memory'),
              composedCard('Memory', 'Per-person knowledge, idempotent'),
              composedCard('Chat', 'Unified threads across integrations'),
              composedCard('CRM Binding', 'Field mapping + status triggers'),
              composedCard('Event Bus', 'Universal stream for any surface'),
            ],
          },
        ],
      },
    ],
  },

  'dispatch-loop': {
    type: 'flex',
    direction: 'column',
    gap: 16,
    children: [
      { type: 'heading', level: 1, text: 'The Dispatch Loop' },
      {
        type: 'text',
        text: 'Every action in Worken OS — by a human or an AI — goes through the same 11 steps. There are no shortcuts.',
        style: { color: '#a1a1aa' },
      },
      {
        type: 'flex',
        direction: 'column',
        gap: 2,
        children: [
          dispatchStep('1', 'Validate session', 'Is the session active?'),
          dispatchStep('2', 'Find object', 'Load WorkenWorkObject by ID'),
          dispatchStep('3', 'Find lifecycle', 'Match domainId:entityType → WorkenObjectLifecycle'),
          dispatchStep('4', 'Enforce policy', 'Check WorkenDomainPolicy.permissions for this verb'),
          dispatchStep('5', 'Find transition', 'Match verb to allowedTransitions(phase)'),
          dispatchStep('6', 'Enforce guard', 'requireOwnership? requireActorKind? requireRole?'),
          dispatchStep('7', 'Apply transition', 'object.phase = transition.to'),
          dispatchStep('8', 'Update data', 'Object.assign(object.data, payload)'),
          dispatchStep('9', 'Record audit', 'Append to audit log with actor, verb, phases'),
          dispatchStep('10', 'Emit to bus', 'Notify all subscribed surfaces'),
          dispatchStep('11', 'Return outcome', 'WorkenActionOutcome with before/after status'),
        ],
      },
      {
        type: 'flex',
        direction: 'column',
        gap: 4,
        style: { marginTop: 8 },
        children: [
          { type: 'heading', level: 2, text: 'Try it' },
          codeBlock(`// Illustrative — your app wires a runtime + manifest.
const runtime = new WorkenRuntime()
runtime.registerManifest(salesManifest)

const session = runtime.createSession(
  { kind: 'ai', id: 'agent-1', roleId: 'sales' },
  { organizationId: 'org-1', projectId: 'proj-1' },
  'api',
)

const lead = runtime.createObject(session, 'sales', 'lead', {
  company: 'Acme Corp',
})

// dispatch goes through all 11 steps
const result = runtime.dispatch(session, lead.id, 'capture')
// result.previousStatus = 'draft'
// result.newStatus = 'open'`),
        ],
      },
    ],
  },

  'getting-started': {
    type: 'flex',
    direction: 'column',
    gap: 16,
    children: [
      { type: 'heading', level: 1, text: 'Getting Started' },
      {
        type: 'text',
        text: 'Add a new domain to Worken OS in 4 steps.',
        style: { color: '#a1a1aa' },
      },
      stepSection(
        '1',
        'Define the manifest',
        `const manifest: WorkenDomainManifest = {
  id: 'support',
  vocabulary: {
    objectLabel: 'Ticket',
    statusLabels: { draft: 'New', in_progress: 'Active', completed: 'Resolved' },
    actionLabels: { capture: 'Accept', assign: 'Assign', close: 'Resolve' },
  },
  entities: [{
    type: 'ticket',
    label: 'Ticket',
    lifecycle: {
      initialPhase: 'draft',
      terminalPhases: ['completed'],
      transitions: [
        { from: 'draft', to: 'open', verb: 'capture' },
        { from: 'open', to: 'in_progress', verb: 'assign' },
        { from: 'in_progress', to: 'completed', verb: 'close' },
      ],
    },
    fields: [
      { name: 'subject', type: 'string', required: true },
      { name: 'priority', type: 'enum', enumValues: ['low', 'medium', 'high'] },
    ],
  }],
  actions: [...],
  policy: { permissions: [...] },
  projections: [{ kind: 'inbox' }, { kind: 'kanban' }],
  workflows: [],
}`,
      ),
      stepSection(
        '2',
        'Register in runtime',
        `runtime.registerManifest(manifest)
// Auto-wires: lifecycle, policy, vocabulary`,
      ),
      stepSection(
        '3',
        'Start working',
        `const session = runtime.createSession(agent, workspace, 'api')
const ticket = runtime.createObject(session, 'support', 'ticket', {
  subject: 'Cannot login',
  priority: 'high',
})

runtime.dispatch(session, ticket.id, 'capture')
runtime.dispatch(session, ticket.id, 'assign')
// Phase: draft → open → in_progress`,
      ),
      stepSection(
        '4',
        'Add to shell (optional)',
        `// examples/demo/domains/support/index.ts
defineDomain({
  id: 'support',
  views: { inbox: { kind: 'list', specId: 'inbox' } },
  surfaces: {
    navigation: [{ id: 'inbox', label: 'Inbox', icon: 'Inbox' }],
  },
})`,
      ),
    ],
  },

  'agent-anatomy': {
    type: 'flex',
    direction: 'column',
    gap: 16,
    children: [
      { type: 'heading', level: 1, text: 'Agent Anatomy' },
      {
        type: 'text',
        text: 'An AI agent is a virtual employee. Same dispatch loop, same policies, same audit trail as a human.',
        style: { color: '#a1a1aa' },
      },
      {
        type: 'grid',
        columns: 2,
        gap: 12,
        children: [
          agentSection(
            'Persona',
            '#60a5fa',
            'displayName, language, tone, greeting, signature\n\nThe agent presents itself naturally in chat.',
          ),
          agentSection(
            'Schedule',
            '#4ade80',
            'timezone, workingHours, workingDays\n\nOut-of-hours message when unavailable.',
          ),
          agentSection(
            'Escalation',
            '#fb923c',
            '7 trigger types:\nkeyword, sentiment, max_turns,\nno_response, confidence,\nexplicit_request, complex_question',
          ),
          agentSection(
            'Memory',
            '#c084fc',
            'Per-person knowledge.\nIdempotent by (anchor + agent + key).\nMarkdown + structured facts.',
          ),
          agentSection(
            'Toolkit',
            '#22d3ee',
            'Dynamic from domain manifests.\nRuntime + domain + chat + query tools.\nDenied actions excluded.',
          ),
          agentSection(
            'Chat',
            '#f472b6',
            'Integration channels + internal.\nDirect, group, delegation threads.\nSame message model as humans.',
          ),
        ],
      },
      codeBlock(`runtime.registerAgent({
  id: 'agent-support',
  name: 'Alice',
  actor: { kind: 'ai', id: 'agent-support', roleId: 'support' },
  domainIds: ['support'],
  allowedActions: ['capture', 'assign', 'update', 'escalate'],
  deniedActions: ['approve'],
  persona: { displayName: 'Alice', tone: 'friendly', language: 'en' },
  instruction: { systemPrompt: 'You are a support agent...' },
  chatBindings: [{ channelId: 'telegram', vendor: 'telegram', direction: 'both' }],
})

const toolkit = runtime.buildAgentToolkit('agent-support')
// toolkit.tools: [capture_ticket, assign_ticket, send_message, ...]
// toolkit.instruction: context-rich prompt with domain vocabulary`),
    ],
  },

  'event-bus': {
    type: 'flex',
    direction: 'column',
    gap: 16,
    children: [
      { type: 'heading', level: 1, text: 'Event Bus' },
      {
        type: 'text',
        text: 'One kernel stream. Any surface subscribes. The runtime emits on every operation.',
        style: { color: '#a1a1aa' },
      },
      {
        type: 'flex',
        direction: 'column',
        gap: 8,
        children: [
          surfaceCard('Next.js Shell', 'nextjs', 'Real-time UI updates. Filter by domain.'),
          surfaceCard('Landing Page', 'landing', 'Live demo. Visitors see the OS working.'),
          surfaceCard(
            'Console / ASCII',
            'console',
            'Company status on a big screen. Who does what.',
          ),
          surfaceCard('UE5 Metaverse', 'ue5', 'Virtual office. Actor activity → avatar actions.'),
          surfaceCard('Custom', 'custom', 'Implement WorkenRenderTarget. Connect in 3 lines.'),
        ],
      },
      codeBlock(`// Connect any surface in 3 lines
const target: WorkenRenderTarget = {
  id: 'my-dashboard',
  kind: 'custom',
  render: (event) => {
    // event.kind: 'object.phase_changed'
    // event.actor: { kind: 'ai', label: 'Sales AI' }
    // event.summary: 'Sales AI → capture Lead'
    // event.semanticView.phaseLabel: 'Qualified'
  },
}
connectRenderTarget(runtime.bus, target)

// Snapshot: company state right now
const snap = runtime.bus.snapshot()
// snap.actors: [{ actor, lastEvent, eventCount }]
// snap.domains: [{ domainId, activeActorIds }]`),
    ],
  },

  'dev-agent': {
    type: 'flex',
    direction: 'column',
    gap: 16,
    children: [
      { type: 'heading', level: 1, text: 'Dev Agent' },
      {
        type: 'text',
        text: "Give a task in the chat below. The code agent will scaffold a domain, validate it, register it in the runtime, and you'll see the result immediately.",
        style: { color: '#a1a1aa' },
      },
      {
        type: 'grid',
        columns: 2,
        gap: 8,
        children: [
          devToolCard('scaffold_domain', 'Generate a complete manifest from a description'),
          devToolCard('validate_manifest', 'Check a manifest against kernel rules'),
          devToolCard('register_domain', 'Register live — no restart, no deploy'),
          devToolCard('add_policy_rule', 'Add permission rules (e.g. deny AI from approving)'),
          devToolCard('preview_toolkit', 'See tools an agent would get in this domain'),
          devToolCard(
            'simulate_dispatch',
            'Run a dispatch: create object → apply verb → see result',
          ),
          devToolCard('list_domains', 'List all registered domains'),
          devToolCard('describe_domain', 'Full semantic description of a domain'),
        ],
      },
      {
        type: 'flex',
        direction: 'column',
        gap: 4,
        style: { marginTop: 8 },
        children: [
          { type: 'heading', level: 2, text: 'Try saying' },
          examplePrompt('Add a customer complaints domain with severity levels and escalation'),
          examplePrompt('Create an HR domain for managing job applications with interview stages'),
          examplePrompt(
            'Scaffold a logistics domain with shipments that go from warehouse to delivery',
          ),
          examplePrompt('Add a policy: AI cannot close complaints, only humans can'),
          examplePrompt('Show me what tools an agent would get in the support domain'),
        ],
      },
    ],
  },
}

// ─── Spec builders ──────────────────────────────────────────────

function primitiveCard(
  num: string,
  title: string,
  subtitle: string,
  description: string,
  color: string,
) {
  return {
    type: 'flex',
    direction: 'column',
    gap: 6,
    style: {
      padding: 16,
      borderRadius: 12,
      border: `1px solid ${color}33`,
      background: `${color}08`,
    },
    children: [
      {
        type: 'flex',
        direction: 'row',
        gap: 8,
        align: 'center',
        children: [
          {
            type: 'text',
            text: num,
            style: {
              fontSize: 11,
              fontWeight: 700,
              color,
              background: `${color}20`,
              padding: '2px 8px',
              borderRadius: 6,
            },
          },
          {
            type: 'text',
            text: title,
            style: { fontSize: 15, fontWeight: 600, color: 'var(--primitive-title)' },
          },
        ],
      },
      {
        type: 'text',
        text: subtitle,
        style: { fontSize: 11, color: 'var(--primitive-subtitle)', fontFamily: 'monospace' },
      },
      {
        type: 'text',
        text: description,
        style: { fontSize: 12, color: 'var(--primitive-desc)', lineHeight: 1.5 },
      },
    ],
  }
}

function composedCard(title: string, description: string) {
  return {
    type: 'flex',
    direction: 'column',
    gap: 4,
    style: { padding: 12, borderRadius: 10, border: '1px solid #27272a', background: '#09090b' },
    children: [
      { type: 'text', text: title, style: { fontSize: 13, fontWeight: 600, color: '#e4e4e7' } },
      { type: 'text', text: description, style: { fontSize: 11, color: '#71717a' } },
    ],
  }
}

function dispatchStep(num: string, title: string, description: string) {
  return {
    type: 'flex',
    direction: 'row',
    gap: 12,
    align: 'flex-start',
    style: { padding: '8px 12px', borderRadius: 8, border: '1px solid #27272a' },
    children: [
      {
        type: 'text',
        text: num,
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: '#60a5fa',
          background: '#60a5fa20',
          padding: '2px 8px',
          borderRadius: 6,
          flexShrink: 0,
        },
      },
      {
        type: 'flex',
        direction: 'column',
        gap: 2,
        children: [
          { type: 'text', text: title, style: { fontSize: 13, fontWeight: 600, color: '#fafafa' } },
          { type: 'text', text: description, style: { fontSize: 11, color: '#71717a' } },
        ],
      },
    ],
  }
}

function codeBlock(code: string) {
  return {
    type: 'flex',
    direction: 'column',
    style: {
      padding: 16,
      borderRadius: 10,
      background: '#0c0c0f',
      border: '1px solid #27272a',
      fontFamily: 'monospace',
      fontSize: 11,
      lineHeight: 1.6,
      whiteSpace: 'pre-wrap',
      color: '#a1a1aa',
    },
    children: [{ type: 'text', text: code }],
  }
}

function stepSection(num: string, title: string, code: string) {
  return {
    type: 'flex',
    direction: 'column',
    gap: 8,
    children: [
      {
        type: 'flex',
        direction: 'row',
        gap: 8,
        align: 'center',
        children: [
          {
            type: 'text',
            text: `Step ${num}`,
            style: {
              fontSize: 11,
              fontWeight: 700,
              color: '#4ade80',
              background: '#4ade8020',
              padding: '2px 8px',
              borderRadius: 6,
            },
          },
          { type: 'text', text: title, style: { fontSize: 15, fontWeight: 600, color: '#fafafa' } },
        ],
      },
      codeBlock(code),
    ],
  }
}

function agentSection(title: string, color: string, content: string) {
  return {
    type: 'flex',
    direction: 'column',
    gap: 6,
    style: {
      padding: 14,
      borderRadius: 10,
      border: `1px solid ${color}33`,
      background: `${color}08`,
    },
    children: [
      { type: 'text', text: title, style: { fontSize: 13, fontWeight: 600, color } },
      {
        type: 'text',
        text: content,
        style: { fontSize: 11, color: '#a1a1aa', whiteSpace: 'pre-wrap' },
      },
    ],
  }
}

function surfaceCard(title: string, kind: string, description: string) {
  return {
    type: 'flex',
    direction: 'row',
    gap: 12,
    align: 'center',
    style: { padding: 12, borderRadius: 10, border: '1px solid #27272a', background: '#09090b' },
    children: [
      {
        type: 'text',
        text: kind,
        style: {
          fontSize: 10,
          fontWeight: 700,
          color: '#60a5fa',
          background: '#60a5fa20',
          padding: '3px 8px',
          borderRadius: 6,
          fontFamily: 'monospace',
          flexShrink: 0,
        },
      },
      {
        type: 'flex',
        direction: 'column',
        gap: 2,
        children: [
          { type: 'text', text: title, style: { fontSize: 13, fontWeight: 600, color: '#e4e4e7' } },
          { type: 'text', text: description, style: { fontSize: 11, color: '#71717a' } },
        ],
      },
    ],
  }
}

function devToolCard(name: string, description: string) {
  return {
    type: 'flex',
    direction: 'column',
    gap: 4,
    style: {
      padding: 12,
      borderRadius: 10,
      border: '1px solid #22d3ee33',
      background: '#22d3ee08',
    },
    children: [
      {
        type: 'text',
        text: name,
        style: { fontSize: 12, fontWeight: 600, color: '#22d3ee', fontFamily: 'monospace' },
      },
      { type: 'text', text: description, style: { fontSize: 11, color: '#a1a1aa' } },
    ],
  }
}

function examplePrompt(text: string) {
  return {
    type: 'flex',
    direction: 'row',
    gap: 8,
    align: 'center',
    style: { padding: '8px 12px', borderRadius: 8, border: '1px solid #27272a', cursor: 'pointer' },
    children: [
      { type: 'text', text: '→', style: { color: '#60a5fa', fontWeight: 600 } },
      { type: 'text', text, style: { fontSize: 12, color: '#d4d4d8' } },
    ],
  }
}
