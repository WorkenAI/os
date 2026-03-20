import { getFallbackEntityRecord, type ShellEntityRecord } from '@/shell/runtime/mock-os-data'
import { useWorkenMockRuntime } from '@/shell/runtime/mock-os-runtime'

export type { ShellEntityRecord }

export function useShellEntityRecord(entityType: string, id: string) {
  const { getEntityRecord } = useWorkenMockRuntime()
  return getEntityRecord(entityType, id) ?? getFallbackEntityRecord(entityType, id)
}
