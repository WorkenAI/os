import { describe, expect, test } from 'bun:test'
import {
  createMockRuntimeSnapshot,
  mockRuntimeTiming,
  SCENE_DOMAIN_ORDER,
  sceneDeliveryQueues,
} from './mock-os-data'

describe('createMockRuntimeSnapshot', () => {
  test('produces role packets and shell view data', () => {
    const snapshot = createMockRuntimeSnapshot(0)

    expect(snapshot.sceneTraffic.rolePackets).toHaveLength(4)
    expect(snapshot.shellViews.finance.payments?.boardTitle).toBe('Payment approvals')
    expect(snapshot.shellViews.finance['approvals-board']?.boardTitle).toBe('Payment approvals')
  })

  test('shell view data rotates with time', () => {
    const initial = createMockRuntimeSnapshot(0)
    const nextCycle = createMockRuntimeSnapshot(mockRuntimeTiming.cycleMs)

    const initialRow = initial.shellViews.hr['candidates-table']?.tableRows?.[0]
    const nextRow = nextCycle.shellViews.hr['candidates-table']?.tableRows?.[0]

    expect(initialRow?.name).toBe('Anna Peterson')
    expect(nextRow?.name).toBe('Benjamin Cole')
  })

  test('finance invoices rotate with time', () => {
    const initial = createMockRuntimeSnapshot(0)
    const nextCycle = createMockRuntimeSnapshot(mockRuntimeTiming.cycleMs)

    const initialRow = initial.shellViews.finance.invoices?.tableRows?.[0]
    const nextRow = nextCycle.shellViews.finance.invoices?.tableRows?.[0]

    expect(initialRow?.number).toBe('INV-2026-0142')
    expect(nextRow?.number).toBe('INV-2026-0141')
  })
})

describe('sceneDeliveryQueues', () => {
  test('provides items for all business domains', () => {
    for (const domainId of SCENE_DOMAIN_ORDER) {
      const queue = sceneDeliveryQueues[domainId]
      expect(queue.length).toBeGreaterThan(0)
      expect(queue[0]).toHaveProperty('id')
      expect(queue[0]).toHaveProperty('label')
      expect(queue[0]).toHaveProperty('entityType')
      expect(queue[0]).toHaveProperty('entityId')
    }
  })

  test('HR queue maps from candidates with first-name labels', () => {
    const hrQueue = sceneDeliveryQueues.hr
    expect(hrQueue[0]?.label).toBe('Anna')
    expect(hrQueue[0]?.entityType).toBe('candidate')
    expect(hrQueue[0]?.entityId).toBe('c1')
  })

  test('finance queue maps from invoices with number labels', () => {
    const financeQueue = sceneDeliveryQueues.finance
    expect(financeQueue[0]?.label).toBe('INV-2026-0142')
    expect(financeQueue[0]?.entityType).toBe('invoice')
    expect(financeQueue[0]?.entityId).toBe('i1')
  })

  test('sales queue maps from deals with company labels', () => {
    const salesQueue = sceneDeliveryQueues.sales
    expect(salesQueue[0]?.label).toBe('Globex Corp')
    expect(salesQueue[0]?.entityType).toBe('deal')
    expect(salesQueue[0]?.entityId).toBe('d1')
  })

  test('SCENE_DOMAIN_ORDER lists all 4 business domains', () => {
    expect(SCENE_DOMAIN_ORDER).toEqual(['hr', 'sales', 'marketing', 'finance'])
  })
})
