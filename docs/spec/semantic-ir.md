# Semantic IR (Worken OS)

**Semantic IR** is the canonical, deterministic, machine-readable representation of **operational** semantics: what entities exist, which roles may act, which actions are defined, under what predicates they are allowed, how surfaces bind actions for projection to UI/agents, and (later) how execution binds to tools/workflows.

It is **not** documentation text, not a UI tree, and not raw TypeScript AST. It is the compiled output of the Semantic Protocol graph (`SemanticGraph` in `@worken/semantic-core`), plus optional normalization.

## Relationship to other layers

| Layer | Role |
|--------|------|
| Semantic Protocol | Normative rules for nodes, relations, compilation |
| Authoring (DSL, JSON, TS helpers) | Human or codegen input |
| `SemanticGraph` | Compiled graph with stable ids |
| **Semantic IR** | Normalized operational slice + snapshot id |
| MCP / Shell / Workflow / Policy | Projections and enforcement |

## Stage 1 (current)

The IR contains: `entities`, `roles`, `actions`, `policies`, `surfaces`, `transitions` (may be empty), `bindings` (may be empty).

Schema metadata includes `schemaVersion`, `workspaceId`, `snapshotId`, `generatedAt`, `semanticProtocolVersion`.

## Compilation

`@worken/semantic-ir` implements `compileSemanticIR(graph, { workspaceId, semanticProtocolVersion })`.

**Determinism:** the same graph body yields the same `snapshotId` (hash of the IR body; `generatedAt` is not part of the hash).

## MCP

Resource URI: `worken://semantic-ir`.

Tools: `list_allowed_actions`, `explain_action`, `resolve_surface`.

See ADR `docs/adrs/0004-semantic-ir.md`.
