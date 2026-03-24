# ADR 0004: Semantic IR (canonical operational representation)

## Status

Accepted

## Context

Worken OS needs a **single headless representation** of operational semantics that is:

- **Canonical** after compile (not markdown, not ad hoc JSON dumps)
- **Deterministic** for the same authored inputs
- **Interface-agnostic** (MCP, shell, workflow, policy, agent runtime are projections)

The Semantic Protocol (see `docs/spec/semantic-protocol.md`) defines meaning; **Semantic IR** is the machine-readable normalized form that multiple runtimes agree on.

## Decision

1. Introduce **`@worken/semantic-ir`**: types and `compileSemanticIR(semanticGraph)` that project a compiled **`SemanticGraph`** (`@worken/semantic-core`) into **Stage 1 IR**: entities, roles, actions, policies, surfaces, transitions, bindings.

2. **Snapshot id**: SHA-256 over a stable JSON serialization of the IR body (excluding `generatedAt`), prefixed `sha256:…`, stored in `schema.snapshotId`.

3. **Explain / list**: `explainAction` and `listAllowedActions` evaluate predicates via `@worken/semantic-core` (`evaluatePredicate`) against subject/object (and optional role for policy subjects).

4. **MCP**: expose IR as resource `worken://semantic-ir` and tools `list_allowed_actions`, `explain_action`, `resolve_surface` on top of the same IR instance used for snapshot id.

## Consequences

- Authoring remains in manifests / sources that merge into `SemanticSource` → `compileSemantic` → **IR compile** → delivery.
- **Stage 2+** can add transitions/workflows/bindings from graph without changing the “IR is canonical” rule.
- Full product domain models are **authored**; the repo ships a **small demo slice** (`buildSemanticIRDemoSource`) to validate the pipeline.

## References

- `docs/spec/semantic-protocol.md`
- `docs/spec/semantic-ir.md`
- `docs/adrs/0005-semantic-projection-engine.md`
- `packages/semantic-ir/`
