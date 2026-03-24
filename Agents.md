# Agents: architecture and tooling (Worken OS)

This document is for **coding agents** (and humans driving them) working in this repository. It explains how the **headless kernel** turns sources into graphs, **Semantic IR**, **projections**, and **MCP** — so you know what to use instead of guessing from folder layout alone.

## Mental model

Worken OS separates **meaning** from **delivery**:

1. **Authoring** — manifests, TypeScript sources, docs overlays (not canonical alone).
2. **Compile** — merge sources → **`SemanticGraph`** (`@worken/semantic-core`) and **`PlatformGraph`** (`@worken/platform-core`).
3. **Canonical operational shape** — **`Semantic IR`** (`@worken/semantic-ir`): deterministic `snapshotId`, entities, roles, actions, policies, surfaces, bindings.
4. **Projection** — a **slice** of IR → **`ProjectionModel`** → render as JSON / LLM text / ASCII / Mermaid (`@worken/semantic-projection`). Renderers do **not** scrape the repo; they consume normalized slices.
5. **Delivery** — **MCP** (`@worken/platform-mcp`) exposes resources and tools; **`repo-mcp`** builds graphs from **this** monorepo and optional code-graph.

```
Authoring → compile → SemanticGraph + PlatformGraph
              → Semantic IR (canonical)
              → resolve slice → ProjectionModel → render (json | llm | ascii | mermaid)
              → MCP / future shell / CLI
```

## Packages (what each layer is for)

| Package | Role for agents |
|--------|------------------|
| `@worken/semantic-core` | Compiled semantic graph, predicates, `evaluateAction` / `evaluatePredicate`. |
| `@worken/semantic-ir` | `compileSemanticIR`, `explainAction`, `listAllowedActions`, stable `snapshotId`. |
| `@worken/semantic-projection` | `resolveSlice` → `buildProjectionModel` → `renderProjection` / `projectAndRender`. |
| `@worken/platform-core` | Repo/contributor graph: packages, subsystems, invariants, ADRs, examples. |
| `@worken/context-core` | `buildContextBundle`, task presets (`onboard_repo`, `add_mcp_resource`, …). |
| `@worken/platform-mcp` | MCP server: resources `worken://…`, tools (see below). **Read-only.** |
| `@worken/repo-mcp` | Loads **this** workspace (from root `workspaces`), manifest overlay, semantic overlays, **Semantic IR demo** slice, **always** merges `@worken/code-graph`. |
| `@worken/code-graph` | TS compiler API → package/symbol edges; projected into platform graph for MCP. |

## Running the model-context stack locally

From the **repository root** (after `bun install`):

| Command | Purpose |
|---------|---------|
| `bun run mcp` | Stdio MCP: live repo + code graph + IR demo; primary integration for agents. |
| `bun run code-graph` | Dump code-graph JSON (optional `WORKEN_CODE_GRAPH_PACKAGES=…` to narrow). |
| `bun run test` | Monorepo tests. |
| `bun run check-types` | Typecheck. |
| `bun run lint` | Biome. |

Cursor can use `.cursor/mcp.json` to launch the same `repo-mcp` entrypoint.

## MCP: resources and tools (high level)

**Resources** (URIs are stable handles, not file paths):

- `worken://thesis` — short thesis markdown.
- `worken://glossary` — glossary terms from graphs.
- `worken://semantic-ir` — full **Semantic IR** JSON (includes `schema.snapshotId`).
- Templates: `worken://subsystems/{id}`, `worken://packages/{id}`, `worken://contracts/{id}`, `worken://flows/{id}`, `worken://examples/{id}`, `worken://adrs/{id}`.

**Tools** (non-exhaustive; discover via `list_tools`):

- Graph navigation: `get_node`, `related_nodes`, `show_invariants`, `find_examples`, `impact_of_change`.
- Task context: `bundle_for_task` (preset task strings + optional `area` / `depth`).
- Operational semantics: `list_allowed_actions`, `explain_action` (subject/object JSON + optional `roleId`).
- Surfaces: `resolve_surface` (IR surface node).
- Projections: `render_semantic_slice` — `targetId` + `format` (`json` \| `llm` \| `ascii` \| `mermaid`) + optional `asciiMode` (`compact` \| `expanded`).

**Important:** the platform MCP server is **read-only** (no repo writes). Canonical invariant: see `invariant.repo.mcp-readonly` in the live graph.

## IDs agents should know

- **Workspace packages** (from scan): `package.<npm>` with `@` and `/` turned into segments, e.g. `@worken/semantic-core` → `package.worken.semantic-core`.
- **Code graph** nodes often use prefixes like `pkg.worken.semantic-core`, `sym.…`, `surface.…` — see `get_node` / IR as needed.
- **Semantic IR demo** (when merged by `repo-mcp`): example action id `action.candidate.schedule_interview`, surface `surface.candidate.detail`, roles `role.hr_manager`, `role.recruiter_bot`.

## Normative docs

- `docs/spec/semantic-protocol.md` — Semantic Protocol (normative rules).
- `docs/spec/semantic-ir.md` — Semantic IR.
- `docs/spec/semantic-projection.md` — projection pipeline.
- `docs/spec/code-semantics-bridge.md` — TS → graph bridge.
- `docs/adrs/` — ADRs including headless kernel (0002), code semantics (0003), Semantic IR (0004), projection engine (0005).

## Practical workflow for agents

1. Prefer **`bun run mcp`** + MCP tools over raw `grep` when you need **invariants, packages, IR, or explainability**.
2. Use **`bundle_for_task`** for task-shaped context; use **`explain_action`** / **`list_allowed_actions`** when reasoning about **allowed operations** from IR.
3. Use **`render_semantic_slice`** with `format: "llm"` or `"mermaid"` when you need a **single slice** explained consistently in text or diagram form.
4. Use **`worken://semantic-ir`** or `render_semantic_slice` + `json` when you need the **full canonical IR** or a structured projection.
5. Remember **code graph** is structural (exports/imports); **semantic IR** is operational policy/actions — complementary layers.

## Scope limits (v0)

- MCP does not replace a shell or workflow engine; it **exposes** compiled truth and bundles.
- Full product domain + persistence + `resolve_intent` with session state are **out of scope** for this repo’s v0 stack; the **pipeline** (IR → slice → projection → MCP) is the extension point.
