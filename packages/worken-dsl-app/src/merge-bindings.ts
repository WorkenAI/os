import type { DataBindingPlan } from '@worken/dsl'

function assertJsonPointer(p: string): void {
  if (!p.startsWith('/')) {
    throw new Error(`Data binding target must be a JSON Pointer starting with "/": got "${p}"`)
  }
}

/** Prefix binding targets so multiple processes can coexist in one Spec.state tree. */
export function scopeBindingTargetToProcess(processId: string, to: string): string {
  assertJsonPointer(to)
  if (processId.includes('/') || processId.includes('~')) {
    throw new Error(
      `process id must not contain '/' or '~' (JSON Pointer escape) for scoped bindings: "${processId}"`,
    )
  }
  return `/processes/${processId}${to}`
}

export type MergeBindingsMode = 'flat' | 'scoped'

/**
 * Merge per-process binding plans. **flat** only when a single process contributes rules.
 * **scoped** prefixes each `to` with `/processes/:processId/` and rejects duplicate targets.
 */
export function mergeProcessBindingPlans(
  entries: ReadonlyArray<{ processId: string; plan: DataBindingPlan | undefined }>,
  mode: MergeBindingsMode,
): DataBindingPlan {
  const withRules = entries.filter((e) => e.plan?.rules.length)
  if (withRules.length === 0) return { rules: [] }

  if (mode === 'flat') {
    if (withRules.length !== 1) {
      throw new Error(
        'mergeBindings mode "flat" is invalid when multiple processes define bindings — use mode "scoped" or merge per-process only via compiled.byProcess[id].bindings.',
      )
    }
    const only = withRules[0]
    if (!only) return { rules: [] }
    return { rules: [...(only.plan?.rules ?? [])] }
  }

  const rules: import('@worken/dsl').DataBindingRule[] = []
  const seenTo = new Set<string>()

  for (const { processId, plan } of withRules) {
    for (const rule of plan?.rules ?? []) {
      const to = scopeBindingTargetToProcess(processId, rule.to)
      if (seenTo.has(to)) {
        throw new Error(
          `Scoped binding collision: duplicate target "${to}" (process "${processId}" or overlapping rules).`,
        )
      }
      seenTo.add(to)
      rules.push({
        ...rule,
        to,
      })
    }
  }

  return { rules }
}

export function resolveDefaultMergeMode(processCountWithBindings: number): MergeBindingsMode {
  return processCountWithBindings > 1 ? 'scoped' : 'flat'
}

/** Per-process plan for `compiled.byProcess` — targets scoped under `/processes/:processId`. */
export function scopeBindingsForProcess(
  processId: string,
  plan: DataBindingPlan | undefined,
): DataBindingPlan | undefined {
  if (!plan?.rules.length) return undefined
  return {
    rules: plan.rules.map((rule) => ({
      ...rule,
      to: scopeBindingTargetToProcess(processId, rule.to),
    })),
  }
}
