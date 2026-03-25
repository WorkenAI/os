/**
 * Informative compiled IR shapes aligned with `semantic-protocol.md`
 * (informative JSON example — same intent, stable IDs for transport).
 */

export type PredicateNodeIr =
  | { op: 'eq'; left: { path: string }; right: { const: unknown } }
  | { op: 'ne'; left: { path: string }; right: { const: unknown } }
  | { op: 'exists'; arg: { path: string } }
  | { op: 'not'; arg: PredicateNodeIr }
  | { op: 'and'; all: PredicateNodeIr[] }
  | { op: 'or'; any: PredicateNodeIr[] }

export type ActionCardIr = {
  id: string
  protocolVersion?: string
  domain: string
  object: string
  action: string
  roles: string[]
  eligibility?: { all?: PredicateNodeIr[] }
  blockers: Array<{
    code: string
    message: string
    when?: PredicateNodeIr
  }>
  effects: Array<Record<string, unknown>>
  projection: {
    ui: Record<string, unknown>
  }
  bindings?: {
    handlerKey?: string
  }
}

/** Runtime evaluation result (protocol YAML shape). */
export type ActionEvaluationResultIr = {
  id: string
  status: 'available' | 'blocked'
  allowed: boolean
  reasons?: Array<{ code: string; message: string }>
}
