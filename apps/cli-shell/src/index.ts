#!/usr/bin/env bun
/**
 * CLI shell — same semantic enrichment pipeline as web-shell (`@worken/shell-runtime`).
 */
import type { Spec } from '@json-render/core'
import inquirer from 'inquirer'
import {
  createLocalShellSession,
  enrichShellSpec,
  type ShellPermissionSnapshot,
  type ShellSemanticEnrichmentInput,
} from '@worken/shell-runtime'

/** Demo roles — shape matches web-shell `PermissionSnapshot` for enrichment. */
const DEMO_ROLES: readonly ShellPermissionSnapshot[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access',
    emoji: '🛡️',
    color: '#ef4444',
    domains: {},
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Dev tooling',
    emoji: '🧑‍💻',
    color: '#60a5fa',
    domains: {},
  },
  {
    id: 'hr-manager',
    name: 'HR manager',
    description: 'HR domain',
    emoji: '👥',
    color: '#22c55e',
    domains: {},
  },
]

const DOMAIN_CHOICES: readonly { id: string; title: string }[] = [
  { id: 'admin', title: 'Administration' },
  { id: 'developer', title: 'Developer studio' },
  { id: 'hr', title: 'Human resources' },
  { id: 'sales', title: 'Sales' },
  { id: 'marketing', title: 'Marketing' },
]

function pickRole(roleId?: string): ShellPermissionSnapshot {
  const id = roleId ?? process.env.WORKEN_ROLE_ID
  const role = id
    ? DEMO_ROLES.find((r) => r.id === id)
    : DEMO_ROLES.find((r) => r.id === 'hr-manager') ?? DEMO_ROLES[0]
  if (!role) {
    throw new Error(`Unknown role: ${id ?? '(default)'}`)
  }
  return role
}

function minimalDemoSpec(): Spec {
  return {
    root: 'root',
    elements: {
      root: {
        type: 'Stack',
        props: {
          title: { $semantic: 'object.title' },
          hint: 'CLI preview — semantic paths resolve like web-shell',
        },
        children: [],
      },
    },
    state: {},
  }
}

async function main() {
  const envDomain = process.env.WORKEN_DOMAIN_ID?.trim()
  const envRole = process.env.WORKEN_ROLE_ID?.trim()

  let domainId: string
  let roleId: string

  if (envDomain && envRole) {
    domainId = envDomain
    roleId = envRole
  } else {
    const d = await inquirer.prompt<{ domainId: string }>([
      {
        type: 'list',
        name: 'domainId',
        message: 'Domain',
        choices: DOMAIN_CHOICES.map((x) => ({ name: `${x.title} (${x.id})`, value: x.id })),
        default: 'hr',
      },
    ])
    domainId = d.domainId

    const r = await inquirer.prompt<{ roleId: string }>([
      {
        type: 'list',
        name: 'roleId',
        message: 'Role',
        choices: DEMO_ROLES.map((x) => ({ name: `${x.emoji} ${x.name}`, value: x.id })),
        default: 'hr-manager',
      },
    ])
    roleId = r.roleId
  }

  const domain = DOMAIN_CHOICES.find((x) => x.id === domainId)
  if (!domain) {
    throw new Error(`Unknown domain: ${domainId}`)
  }

  const permissions = pickRole(roleId)
  const shellSession = createLocalShellSession({
    currentRoleId: permissions.id,
  })

  const object = {
    title: `CLI · ${domain.title}`,
    kind: 'demo',
  }

  const input: ShellSemanticEnrichmentInput = {
    permissions,
    domainId: domain.id,
    domainTitle: domain.title,
    shellSession,
    object,
  }

  const raw = minimalDemoSpec()
  const enriched = enrichShellSpec(raw, input)

  console.log('\n--- enrichShellSpec (json-render Spec) ---\n')
  console.log(JSON.stringify(enriched, null, 2))
  console.log('\n--- session ---\n')
  console.log(JSON.stringify({ id: shellSession.id, role: permissions.id }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
