import type { EvaluationContext } from '@worken/dsl'
import type { ShellSemanticEnrichmentInput } from './shell-semantic-input'

/**
 * Maps shell session + permissions into protocol {@link EvaluationContext}.
 * Prefer {@link enrichShellSpec} for full Spec enrichment.
 */
export function buildShellEvaluationContext(
  input: Omit<ShellSemanticEnrichmentInput, 'bindings'>,
): EvaluationContext {
  const p = input.permissions
  const s = input.shellSession

  const actor: Record<string, unknown> = {
    id: s?.actor.id ?? p?.id ?? 'anonymous',
    role: p?.name ?? 'anonymous',
    roleKey: p?.id ?? 'anonymous',
    roleLabel: p?.name ?? 'anonymous',
    emoji: p?.emoji ?? '',
  }

  if (s) {
    actor.kind = s.actor.kind
    actor.workenRoleId = s.currentRoleId
    actor.sessionId = s.id
  }

  const env: Record<string, unknown> = {
    domainId: input.domainId,
    domainTitle: input.domainTitle,
    ...(input.env ?? {}),
  }

  if (s) {
    env.sessionId = s.id
    env.sessionScope = s.scope
    env.sessionStatus = s.status
    env.workspace = { ...s.workspace }
    if (s.metadata) {
      env.sessionMetadata = { ...s.metadata }
    }
  }

  return {
    actor,
    object: input.object ?? {},
    env,
    time: input.time ?? Date.now(),
  }
}
