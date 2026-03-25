import type { BusinessProcessDefinition, EventId, StateId } from './types.js'

export type ApplyProcessTransitionResult =
  | {
      ok: true
      transitionId: string
      from: StateId
      to: StateId
      eventId: EventId
    }
  | {
      ok: false
      code: string
      message: string
    }

/**
 * Pure transition: find the single outgoing edge from `fromState` matching `eventId`
 * and return the target state. Does not mutate or persist anything.
 */
export function applyProcessTransition(
  def: BusinessProcessDefinition,
  fromState: StateId,
  eventId: EventId,
): ApplyProcessTransitionResult {
  if (!(fromState in def.nodes)) {
    return {
      ok: false,
      code: 'unknown-state',
      message: `State "${fromState}" is not defined in process "${def.id}".`,
    }
  }

  if (!(eventId in def.events)) {
    return {
      ok: false,
      code: 'unknown-event',
      message: `Event "${eventId}" is not defined in process "${def.id}".`,
    }
  }

  const outgoing = def.transitions.filter((t) => t.from === fromState)
  const matching = outgoing.filter((t) => t.on === eventId)

  if (matching.length === 0) {
    return {
      ok: false,
      code: 'no-transition',
      message: `No transition from "${fromState}" on event "${eventId}" in process "${def.id}".`,
    }
  }

  if (matching.length > 1) {
    return {
      ok: false,
      code: 'ambiguous-transition',
      message: `Multiple transitions from "${fromState}" on event "${eventId}" in process "${def.id}".`,
    }
  }

  const t = matching[0]
  if (!t) {
    return {
      ok: false,
      code: 'no-transition',
      message: `No transition from "${fromState}" on event "${eventId}" in process "${def.id}".`,
    }
  }
  if (!(t.to in def.nodes)) {
    return {
      ok: false,
      code: 'transition-target-missing',
      message: `Transition "${t.id}" targets unknown state "${t.to}".`,
    }
  }

  return {
    ok: true,
    transitionId: t.id,
    from: fromState,
    to: t.to,
    eventId,
  }
}
