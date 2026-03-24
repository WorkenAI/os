# ADR 0005: Semantic Projection Engine

## Status

Accepted

## Context

Semantic IR is canonical but not every consumer needs the full graph. Agents, CLI, docs, and diagrams need **the same slice of meaning** in different **lossy** representations (text, ASCII, Mermaid). Renderers must not scrape the repository; they consume **normalized slices and projection models**.

## Decision

1. Introduce **`@worken/semantic-projection`** with:
   - `resolveSlice(ir, targetId)` — connected semantic slice (action, policy, entity, surface, role)
   - `buildProjectionModel(ir, slice)` — **ProjectionModel** (focus, typed nodes, typed edges, optional diagnostics/narrative)
   - `renderProjection(model, format)` — `json` | `llm` | `ascii` | `mermaid`
   - `projectAndRender(ir, targetId, format)` — pipeline entry

2. **MCP tool** `render_semantic_slice` exposes the same pipeline for agents.

3. **Rule:** Mermaid and ASCII are **outputs**, never sources of truth. LLM text is a **projection**, not the semantic model.

## Consequences

- One slice can be validated in four formats; divergence is expected (lossy vs lossless).
- Diagnostics can be attached to `ProjectionModel` later for coupling analysis.
- CLI `worken inspect …` can wrap this package in a future binary.

## References

- `docs/spec/semantic-projection.md`
- `packages/semantic-projection/`
