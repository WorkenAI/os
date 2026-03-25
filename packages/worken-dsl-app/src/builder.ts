import { compileWorkenApp } from './compile.js'
import type { CompiledWorkenApp } from './compile.js'
import type { DataBindingPlan } from '@worken/dsl'
import type { WorkenAppDefinition } from './types.js'

export type WorkenApp<T extends WorkenAppDefinition> = T & {
  readonly bindings: DataBindingPlan
  readonly compiled: CompiledWorkenApp
}

/**
 * Single entry point (tsops-style): one root object.
 * - **compiled** — `@worken/dsl` workspace + bridges (validated).
 * - **bindings** — merged `DataBindingPlan` rules from all processes (unless `mergeBindings: false`).
 */
export function defineWorkenApp<const T extends WorkenAppDefinition>(
  def: T,
  options?: {
    /** Default bindings merged from all processes that declare `bindings`. */
    mergeBindings?: boolean
  },
): WorkenApp<T> {
  const compiled = compileWorkenApp(def)
  const merge = options?.mergeBindings !== false

  const rules: import('@worken/dsl').DataBindingRule[] = []
  if (merge) {
    for (const p of Object.values(def.processes)) {
      if (p.bindings?.rules?.length) {
        rules.push(...p.bindings.rules)
      }
    }
  }

  const bindings: DataBindingPlan = { rules }
  return Object.assign(def, { bindings, compiled }) as WorkenApp<T>
}
