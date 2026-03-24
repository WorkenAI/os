# Semantic Projection Engine

Worken OS separates:

1. **Semantic IR** — canonical compiled operational model (`@worken/semantic-ir`).
2. **Semantic slice** — a connected subset around a focus id (`resolveSlice`).
3. **Projection model** — visualization-oriented graph (`buildProjectionModel`): focus, nodes, typed edges, optional diagnostics and narrative.
4. **Renderers** — `json` (near-lossless), `llm`, `ascii`, `mermaid` (lossy).

Pipeline:

```
Semantic IR → resolveSlice(target) → buildProjectionModel → renderProjection(format)
```

Formats:

| Format   | Role |
|----------|------|
| `json`   | ProjectionModel as JSON for APIs and debugging |
| `llm`    | Structured text for model context |
| `ascii`  | CLI / logs (`compact` or `expanded`) |
| `mermaid`| Docs, ADRs, PR discussion |

Edge types include: `reads`, `writes`, `guards`, `renders`, `invokes`, `binds_to`, `depends_on`.

See ADR `docs/adrs/0005-semantic-projection-engine.md`.
