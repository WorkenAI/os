import { getFallbackEntityRecord, type ShellEntityRecord } from './mock-os-data'
import { useWorkenMockRuntime } from './mock-os-runtime'

export type { ShellEntityRecord }

export function useShellEntityRecord(entityType: string, id: string) {
  const { getEntityRecord } = useWorkenMockRuntime()
  return getEntityRecord(entityType, id) ?? getFallbackEntityRecord(entityType, id)
}
