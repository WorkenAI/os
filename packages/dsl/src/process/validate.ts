import type { BusinessProcessDefinition, ProcessNode, ProcessTransition, StateId } from './types.js'

export type ProcessValidationIssue = {
  code: string
  message: string
  ref?: string
}

/**
 * Structural checks only (graph consistency). Guards / policies are runtime concerns.
 */
export function validateProcess(def: BusinessProcessDefinition): ProcessValidationIssue[] {
  const issues: ProcessValidationIssue[] = []
  const stateIds = new Set(Object.keys(def.nodes))

  if (!stateIds.has(def.initial)) {
    issues.push({
      code: 'initial-missing',
      message: `Initial state "${def.initial}" is not defined in nodes.`,
      ref: def.initial,
    })
  }

  for (const [id, node] of Object.entries(def.nodes) as [StateId, ProcessNode][]) {
    if (node.id !== id) {
      issues.push({
        code: 'node-key-mismatch',
        message: `Node key "${id}" does not match node.id "${node.id}".`,
        ref: id,
      })
    }
    if (node.actor !== undefined && def.actors && !(node.actor in def.actors)) {
      issues.push({
        code: 'unknown-actor',
        message: `Node "${id}" references unknown actor "${node.actor}".`,
        ref: node.actor,
      })
    }
  }

  const transitionIds = new Set<string>()
  for (const t of def.transitions) {
    if (transitionIds.has(t.id)) {
      issues.push({
        code: 'duplicate-transition-id',
        message: `Duplicate transition id "${t.id}".`,
        ref: t.id,
      })
    }
    transitionIds.add(t.id)
    if (!stateIds.has(t.from)) {
      issues.push({
        code: 'transition-from-unknown',
        message: `Transition "${t.id}" references unknown from state "${t.from}".`,
        ref: t.id,
      })
    }
    if (!stateIds.has(t.to)) {
      issues.push({
        code: 'transition-to-unknown',
        message: `Transition "${t.id}" references unknown to state "${t.to}".`,
        ref: t.id,
      })
    }
    if (t.on !== undefined && !(t.on in def.events)) {
      issues.push({
        code: 'unknown-event',
        message: `Transition "${t.id}" references unknown event "${t.on}".`,
        ref: t.on,
      })
    }
  }

  const outgoingByState = new Map<StateId, ProcessTransition[]>()
  for (const t of def.transitions) {
    const list = outgoingByState.get(t.from) ?? []
    list.push(t)
    outgoingByState.set(t.from, list)
  }
  for (const [from, list] of outgoingByState) {
    if (list.length > 1) {
      for (const t of list) {
        if (t.on === undefined) {
          issues.push({
            code: 'ambiguous-transition',
            message: `State "${from}" has multiple outgoing transitions; "${t.id}" must specify "on" event.`,
            ref: t.id,
          })
        }
      }
    }
  }

  return issues
}

export function assertValidProcess(def: BusinessProcessDefinition): void {
  const issues = validateProcess(def)
  if (issues.length > 0) {
    const msg = issues.map((i) => `${i.code}: ${i.message}`).join('\n')
    throw new Error(`Invalid process "${def.id}":\n${msg}`)
  }
}
