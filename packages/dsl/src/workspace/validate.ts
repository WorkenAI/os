import type { ProcessId } from '../process/types.js'
import type { ProcessValidationIssue } from '../process/validate.js'
import type { ProcessUiDefinition } from '../ui/types.js'
import type { WorkspaceDefinition } from './types.js'

export type WorkspaceValidationIssue = ProcessValidationIssue & {
  scope?: 'workspace' | 'process'
}

export function validateWorkspace(def: WorkspaceDefinition): WorkspaceValidationIssue[] {
  const issues: WorkspaceValidationIssue[] = []

  for (const processId of Object.keys(def.processUi)) {
    if (!(processId in def.processes)) {
      issues.push({
        code: 'ui-orphan-process',
        scope: 'workspace',
        message: `processUi references "${processId}" but no process with that id exists.`,
        ref: processId,
      })
    }
  }

  for (const [pid, ui] of Object.entries(def.processUi) as [ProcessId, ProcessUiDefinition][]) {
    if (ui.processId !== pid) {
      issues.push({
        code: 'ui-process-id-mismatch',
        scope: 'workspace',
        message: `processUi key "${pid}" must equal ProcessUiDefinition.processId "${ui.processId}".`,
        ref: pid,
      })
    }
  }

  return issues
}

export function assertValidWorkspace(def: WorkspaceDefinition): void {
  const issues = validateWorkspace(def)
  if (issues.length > 0) {
    const msg = issues.map((i) => `${i.code}: ${i.message}`).join('\n')
    throw new Error(`Invalid workspace "${def.id}":\n${msg}`)
  }
}
