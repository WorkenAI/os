import type { WorkspaceDefinition } from './types.js'

export function defineWorkspace<const T extends WorkspaceDefinition>(workspace: T): T {
  return workspace
}
