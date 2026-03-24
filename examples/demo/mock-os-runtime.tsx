'use client'

import { useMachine } from '@xstate/react'
import { createContext, type ReactNode, use, useEffect, useMemo, useRef } from 'react'
import {
  createMockRuntimeSnapshot,
  getFallbackEntityRecord,
  type MockRuntimeSnapshot,
  type MockShellViewData,
  mockRuntimeTiming,
} from './mock-os-data'
import { mockRuntimeClockMachine } from './mock-runtime-clock-machine'

type WorkenMockRuntimeApi = {
  sceneTraffic: MockRuntimeSnapshot['sceneTraffic']
  getEntityRecord: (
    entityType: string,
    id: string,
  ) => MockRuntimeSnapshot['entityRecords'][string][string] | null
  getViewData: (domainId: string, viewId: string | null | undefined) => MockShellViewData | null
}

const WorkenMockRuntimeContext = createContext<WorkenMockRuntimeApi | null>(null)

export function WorkenMockRuntimeProvider({ children }: { children: ReactNode }) {
  const [clockSnapshot, sendClock] = useMachine(mockRuntimeClockMachine)
  const now = clockSnapshot.context.now
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      sendClock({ type: 'tick' })
    }, mockRuntimeTiming.businessSpawnIntervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [sendClock])

  const snapshot = useMemo(() => createMockRuntimeSnapshot(now), [now])

  const apiValue = useMemo<WorkenMockRuntimeApi>(
    () => ({
      sceneTraffic: snapshot.sceneTraffic,
      getEntityRecord: (entityType, id) =>
        snapshot.entityRecords[entityType]?.[id] ?? getFallbackEntityRecord(entityType, id),
      getViewData: (domainId, viewId) => {
        if (!viewId) return null
        return snapshot.shellViews[domainId]?.[viewId] ?? null
      },
    }),
    [snapshot],
  )

  return <WorkenMockRuntimeContext value={apiValue}>{children}</WorkenMockRuntimeContext>
}

export function useWorkenMockRuntime() {
  const context = use(WorkenMockRuntimeContext)

  if (!context) {
    throw new Error('useWorkenMockRuntime must be used inside WorkenMockRuntimeProvider')
  }

  return context
}
