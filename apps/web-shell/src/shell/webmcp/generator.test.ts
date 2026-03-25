import { describe, expect, test } from 'bun:test'
import hr from '@worken/demo-data/domains/hr'
import sales from '@worken/demo-data/domains/sales'
import {
  createWorkenOsToolGenerationSnapshot,
  generateWorkenOsTools,
} from '@/shell/webmcp/generator'

describe('Worken OS WebMCP tool generator', () => {
  test('generates contextual tools from visible views, entities, and verbs', () => {
    const snapshot = createWorkenOsToolGenerationSnapshot({
      currentRoleName: 'Sales Manager',
      accessibleDomains: [sales, hr],
      currentDomain: sales,
      activeViewId: 'pipeline-board',
      canSeeSidebarItem: (_domainId, itemId) => itemId !== 'analytics',
      canSeeEntity: (_domainId, entityId) => entityId !== 'contact',
      canExecuteVerb: (_domainId, verbId) => verbId === 'qualify' || verbId === 'close',
    })

    expect(snapshot.currentDomain?.visibleViews.map((view) => view.id)).toEqual([
      'dashboard',
      'leads-table',
      'pipeline-board',
      'deals',
    ])
    expect(snapshot.currentDomain?.visibleEntities.map((entity) => entity.id)).toEqual([
      'lead',
      'deal',
    ])
    expect(snapshot.currentDomain?.allowedVerbs.map((verb) => verb.id)).toEqual(['qualify', 'close'])

    const tools = generateWorkenOsTools(snapshot)
    const names = tools.map((tool) => tool.name)

    expect(names).toContain('worken_os.get_context')
    expect(names).toContain('worken_os.list_accessible_domains')
    expect(names).toContain('worken_os.open_domain')
    expect(names).toContain('worken_os.open_sales')
    expect(names).toContain('worken_os.open_hr')
    expect(names).toContain('worken_os.list_current_domain_capabilities')
    expect(names).toContain('worken_os.open_current_view')
    expect(names).toContain('worken_os.execute_current_domain_verb')
    expect(names).toContain('worken_os.open_inspector')
    expect(names).toContain('worken_os.send_message')
    expect(names).toContain('worken_os.sales.open_dashboard')
    expect(names).toContain('worken_os.sales.open_leads_table')
    expect(names).toContain('worken_os.sales.open_pipeline_board')
    expect(names).toContain('worken_os.sales.open_deals')
    expect(names).not.toContain('worken_os.sales.open_analytics')
    expect(names).toContain('worken_os.sales.run_qualify')
    expect(names).toContain('worken_os.sales.run_close')
    expect(names).not.toContain('worken_os.sales.run_create')
  })

  test('falls back to global tools when there is no active domain context', () => {
    const snapshot = createWorkenOsToolGenerationSnapshot({
      currentRoleName: 'Viewer',
      accessibleDomains: [sales],
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
      'worken_os.open_sales',
    ])
  })
})
