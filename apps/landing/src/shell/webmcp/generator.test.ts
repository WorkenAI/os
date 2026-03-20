import { describe, expect, test } from 'bun:test'
import finance from '@/domains/finance'
import hr from '@/domains/hr'
import {
  createWorkenOsToolGenerationSnapshot,
  generateWorkenOsTools,
} from '@/shell/webmcp/generator'

describe('Worken OS WebMCP tool generator', () => {
  test('generates contextual tools from visible views, entities, and verbs', () => {
    const snapshot = createWorkenOsToolGenerationSnapshot({
      currentRoleName: 'Finance Manager',
      accessibleDomains: [finance, hr],
      currentDomain: finance,
      activeViewId: 'payments',
      canSeeSidebarItem: (_domainId, itemId) => itemId !== 'analytics',
      canSeeEntity: (_domainId, entityId) => entityId !== 'budget',
      canExecuteVerb: (_domainId, verbId) => verbId === 'approve' || verbId === 'reconcile',
    })

    expect(snapshot.currentDomain?.visibleViews.map((view) => view.id)).toEqual([
      'dashboard',
      'invoices',
      'payments',
      'budgets',
    ])
    expect(snapshot.currentDomain?.visibleEntities.map((entity) => entity.id)).toEqual([
      'invoice',
      'payment',
    ])
    expect(snapshot.currentDomain?.allowedVerbs.map((verb) => verb.id)).toEqual([
      'reconcile',
      'approve',
    ])

    const tools = generateWorkenOsTools(snapshot)
    const names = tools.map((tool) => tool.name)

    expect(names).toContain('worken_os.get_context')
    expect(names).toContain('worken_os.list_accessible_domains')
    expect(names).toContain('worken_os.open_domain')
    expect(names).toContain('worken_os.open_finance')
    expect(names).toContain('worken_os.open_hr')
    expect(names).toContain('worken_os.list_current_domain_capabilities')
    expect(names).toContain('worken_os.open_current_view')
    expect(names).toContain('worken_os.execute_current_domain_verb')
    expect(names).toContain('worken_os.open_inspector')
    expect(names).toContain('worken_os.send_message')
    expect(names).toContain('worken_os.finance.open_dashboard')
    expect(names).toContain('worken_os.finance.open_invoices')
    expect(names).toContain('worken_os.finance.open_payments')
    expect(names).toContain('worken_os.finance.open_budgets')
    expect(names).not.toContain('worken_os.finance.open_analytics')
    expect(names).toContain('worken_os.finance.run_approve')
    expect(names).toContain('worken_os.finance.run_reconcile')
    expect(names).not.toContain('worken_os.finance.run_allocate')
  })

  test('falls back to global tools when there is no active domain context', () => {
    const snapshot = createWorkenOsToolGenerationSnapshot({
      currentRoleName: 'Viewer',
      accessibleDomains: [finance],
      currentDomain: null,
      activeViewId: null,
      canSeeSidebarItem: () => false,
      canSeeEntity: () => false,
      canExecuteVerb: () => false,
    })

    const names = generateWorkenOsTools(snapshot).map((tool) => tool.name)

    expect(names).toEqual([
      'worken_os.get_context',
      'worken_os.list_accessible_domains',
      'worken_os.open_domain',
      'worken_os.open_finance',
    ])
  })
})
