import type { SemanticIR } from '@worken/semantic-ir'
import baselineJson from '@/generated/semantic-ir-baseline.json'

export function getSemanticIrBaseline(): SemanticIR {
  return baselineJson as SemanticIR
}
