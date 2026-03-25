import type { DataBindingPlan } from './types.js'

export function defineDataBindingPlan<const T extends DataBindingPlan>(plan: T): T {
  return plan
}
