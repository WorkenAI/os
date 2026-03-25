import { compileWorkenApp } from './compile.js'
import type { CompiledWorkenApp } from './compile.js'
import {
  mergeProcessBindingPlans,
  resolveDefaultMergeMode,
  type MergeBindingsMode,
} from './merge-bindings.js'
import type { DataBindingPlan } from '@worken/dsl'
import type { WorkenAppDefinition } from './types.js'

export type WorkenApp<T extends WorkenAppDefinition> = T & {
  readonly bindings: DataBindingPlan
  readonly compiled: CompiledWorkenApp
}

export type DefineWorkenAppOptions = {
  /** When false, `bindings` is empty — use `compiled.byProcess[id].bindings` per process. */
  mergeBindings?: boolean
  /**
   * How to merge when **multiple** processes define `bindings`.
   * - **scoped** (default if ≥2): prefix each `to` with `/processes/:processId` and detect duplicate targets.
   * - **flat**: only allowed when a single process contributes rules (throws otherwise).
   */
  mergeBindingsMode?: MergeBindingsMode
}

/**
 * Single entry point (tsops-style): one root object.
 * - **compiled** — `@worken/dsl` workspace + bridges + **per-process scoped bindings** (validated).
 * - **bindings** — merged plan for hosts that want one `DataBindingPlan` (scoped by default when several processes define rules).
 */
export function defineWorkenApp<const T extends WorkenAppDefinition>(
  def: T,
  options?: DefineWorkenAppOptions,
): WorkenApp<T> {
  const compiled = compileWorkenApp(def)
  const merge = options?.mergeBindings !== false

  const entries = Object.values(def.processes).map((p) => ({
    processId: p.id,
    plan: p.bindings,
  }))
  const processesWithBindings = entries.filter((e) => e.plan?.rules?.length).length

  let bindings: DataBindingPlan
  if (!merge) {
    bindings = { rules: [] }
  } else if (processesWithBindings === 0) {
    bindings = { rules: [] }
  } else if (processesWithBindings === 1) {
    bindings = mergeProcessBindingPlans(entries, 'flat')
  } else {
    const mode = options?.mergeBindingsMode ?? resolveDefaultMergeMode(processesWithBindings)
    bindings = mergeProcessBindingPlans(entries, mode)
  }

  return Object.assign(def, { bindings, compiled }) as WorkenApp<T>
}
