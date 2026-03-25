import type { BusinessProcessDefinition, ProcessId } from '../process/types.js'
import type { ProcessUiDefinition } from '../ui/types.js'

/**
 * A bundle of processes and their UI skins — one deployable unit (product line, tenant template, etc.).
 */
export type WorkspaceDefinition = {
  id: string
  title: string
  version?: string
  processes: Record<ProcessId, BusinessProcessDefinition>
  /** One UI bundle per process id. */
  processUi: Record<ProcessId, ProcessUiDefinition>
}
