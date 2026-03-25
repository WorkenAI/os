# Worken OS: application model, DSL, and single source of truth

This document is written for **humans and AI agents** (clear structure, stable terms, explicit data flows). It describes the **target architecture** for modeling applications in Worken OS: one canonical model, compilation to today’s `@worken/dsl` shapes, and how that supports **people and AI working on the same artifacts**.

**Status:** Normative for product direction; the codebase may still be mid-migration. When behavior or layout changes, update this file in the same PR.

**Related:** [Semantic protocol](../spec/semantic-protocol.md) (domain actions, policies, broader semantic layer). [Process engine + Postgres World](./process-engine-and-postgres-world.md) (headless transitions, AI). This doc focuses on **application/process/UI binding** and the **compiler boundary**.

---

## 1. Problem this solves

Today, useful pieces exist in separate places: process graph (`BusinessProcessDefinition`), UI surfaces (`ProcessUiDefinition`), workspace bundles, shell domain manifests, and semantic/runtime enrichment (`EvaluationContext`, `DataBindingPlan`, json-render `Spec`). Without a **single canonical artifact**, identifiers and intent drift, validation is partial, and AI-assisted edits risk inconsistent patches.

**Goal:** one **Canonical Application Model (CAM)** per application (or workspace product line) that is the **only authored source of truth**; everything else is **derived** and **validated** in one pipeline.

---

## 2. Design principles (aligned with proven DSL-style systems)

- **Single source of truth** — Author CAM once; do not hand-maintain parallel copies of state ids, event ids, or view routes.
- **Pure compilation** — Parsing and validation are pure; side effects (IO, shell session) stay in adapters and servers.
- **Diff-first** — Prefer “plan / preview what changes” before applying model updates (states, transitions, surfaces, bindings).
- **Type-safe narrow formats** — Prefer structured fields and enums over unconstrained strings where the compiler can check (e.g. state references, event ids).
- **LLM-friendly repo contract** — Short sections, stable vocabulary, explicit file roles; agents should find “where CAM lives” and “what the compiler emits” without guessing.
- **Human-friendly** — Same artifact is reviewable in PRs; errors are codes + messages (like `validateProcess`), not opaque stack traces.

---

## 3. Single entry point and namespace grammar (tsops-aligned)

Hand-authoring several parallel calls (`defineProcess`, `defineProcessUi`, `defineWorkspace`, …) is **not** the target UX. It splits one application across APIs and repeats identifiers. The **target** matches how tsops works:

### 3.1 One entry module

- **One** authored artifact per application or workspace template—e.g. `worken.app.ts` / `worken.config.ts` / one validated YAML document—**one default export** (or one schema-validated root object).
- The same module is what **humans edit**, what **CI validates**, what **agents patch**, and what **tools load**—mirroring `tsops.config.*` as the single place Commander and runtime both use.

### 3.2 Namespaces define grammar, not just nesting

In tsops, **namespaces** are a first-class axis: they shape resolution (labels, resources, secrets, templates, env) and appear consistently in helpers. For Worken OS CAM:

- **Nested structure is the grammar**: which processes, states, events, and surfaces exist must follow from the **tree** (e.g. workspace → app → process → state), not from unrelated top-level objects that must stay in sync by hand.
- **Scopes** (product line, tenant template, environment) should be **namespace-shaped** the same way tsops scopes deploy targets—one resolver walks the tree instead of many ad hoc maps.

### 3.3 Helpers come from the same tree

As tsops reuses the **same** config for `plan` / `deploy` **and** runtime helpers (`config.url(…)`, `config.env(…)`), CAM must feed:

- **Authoring-time** helpers: stable path constructors, state/surface/event ids **derived** from the namespace path so typos are impossible.
- **Runtime** helpers (or generated accessors): e.g. semantic slots, binding targets, or shell routes **resolved** from the same definition the compiler uses—**not** a duplicate list of strings in app code.

The split types in `@worken/dsl` (`BusinessProcessDefinition`, `ProcessUiDefinition`, …) remain **compiled IR** or **materialized views** produced from that single module—not the primary surface authors learn first.

### 3.4 Comparison (intent)

| tsops | Worken OS (target) |
|--------|---------------------|
| Single `tsops.config` module | Single CAM module per app / workspace template |
| `NamespaceResolver` — grammar of deploy scope | Namespace-shaped CAM — grammar of process/UI scope |
| `createConfigResolver` → lazy helpers `config.url`, `config.env` | Resolver from CAM → helpers for paths, bindings, routes |
| Planner / Builder consume same config | Compiler emits `@worken/dsl` IR + host artifacts from same CAM |

---

## 4. High-level view

```
┌────────────────── Authoring (human + AI) ──────────────────┐
│  Canonical Application Model (CAM)                          │
│  • One module / one root document (see §3)                  │
│  • Namespace tree defines grammar + scope                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌────────────────── Compiler (pure) ─────────────────────────┐
│  parse → normalize → validate (cross-reference)             │
│  emit IR + optional diagnostics (warnings)                  │
└─────────────┬───────────────────────────┬──────────────────┘
              │                           │
     ┌────────▼────────┐         ┌────────▼────────┐
     │ @worken/dsl     │         │ Host manifests │
     │ artifacts       │         │ (web-shell,    │
     │                 │         │  domains, …)   │
     └────────┬────────┘         └────────┬────────┘
              │                           │
              └───────────┬───────────────┘
                          ▼
┌────────────────── Runtime adapters ────────────────────────┐
│  Server: buildEnrichedSpec, enrichShellSpec                 │
│  Session: EvaluationContext, DataBindingPlan                │
│  UI: json-render Spec + $semantic → $state                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Canonical Application Model (CAM) — conceptual shape

CAM is **not** a second parallel standard forever: it is the **authoring projection** that compiles **to** the types already defined in `@worken/dsl`. Conceptually it groups:

| CAM concern | Purpose |
|-------------|---------|
| **Identity** | App id, version, title, optional product/workspace id |
| **Process** | States, transitions, events, actors — maps to `BusinessProcessDefinition` |
| **Presentation** | Per-state (or wildcard) surfaces, role overlays — maps to `ProcessUiDefinition` |
| **Shell routing** | Process ↔ domain, state → view — maps to `ProcessDomainBridge` / workspace bridge |
| **Semantic projection** | What enters `EvaluationContext` (field expectations), optional default `DataBindingPlan` rules |
| **References** | Links to host `specId`, `entityId`, layout ids — stay explicit strings until host registry is unified |

**Rule:** Any identifier that appears in two runtime places (e.g. `StateId` in graph and `matchStateId` in UI) must be **generated or checked** by the compiler from CAM, not duplicated by hand.

---

## 6. Mapping CAM → existing `@worken/dsl` types

This table is the **contract** for implementors of the compiler and for agents editing the repo.

| CAM section (logical) | Emitted type(s) | Package / path |
|-------------------------|-------------------|----------------|
| Process graph | `BusinessProcessDefinition` | `packages/dsl/src/process/types.ts` |
| UI skins | `ProcessUiDefinition` | `packages/dsl/src/ui/types.ts` |
| Workspace bundle | `WorkspaceDefinition` | `packages/dsl/src/workspace/types.ts` |
| Shell integration | `WorkspaceDomainBridge` / `ProcessDomainBridge` | `packages/dsl/src/bridge/types.ts` |
| Runtime enrichment (server) | `EvaluationContext` + optional `DataBindingPlan` | `packages/dsl/src/semantic/types.ts`, `packages/dsl/src/binding/types.ts` |
| Enriched UI spec | `buildEnrichedSpec` → json-render `Spec` | `packages/dsl/src/runtime/materialize.ts` |

**Validation today vs target:**

- **Today:** `validateProcess` is strong for graph structure; `validateWorkspace` checks process/UI key alignment; UI state ids vs graph are **not** fully checked.
- **Target:** compiler **must** reject CAM if any `matchStateId` (other than `'*'`) is not a defined `StateId`, and if bridge view ids are inconsistent with host registry when that registry exists.

---

## 7. Layering (aligned with `semantic-stack`)

The intentional order remains:

1. **Process graph** — `BusinessProcessDefinition`
2. **Process UI** — `ProcessUiDefinition`
3. **Workspace** — `WorkspaceDefinition`
4. **Semantic protocol runtime** — `EvaluationContext`, `seedSemanticState`, `applyDataBindings`, `$semantic` → `$state` in `buildEnrichedSpec`
5. **Shell bridge** — `ProcessDomainBridge` for state → domain view routing

CAM **spans** layers 1–5 in authoring form; the compiler **splits** it into the existing packages without redefining semantics.

---

## 8. Data-binding and DX

**Authoring:** CAM should describe **intent** (which semantic paths feed which UI slots) in a stable notation; the compiler emits:

- `DataBindingPlan` rules (`from` semantic path → `to` JSON Pointer under `Spec.state`), and/or
- Templates that use `{ $semantic: "object.field" }` resolved at enrich time to `{ $state: "/semantic/object/field" }`.

**Runtime:** Unchanged: `enrichShellSpec` / `buildEnrichedSpec` merge state and resolve dynamics.

**DX goals:**

- Fewer raw string paths in hand-written code; prefer **generated** pointers or **linted** conventions from CAM.
- Single place to rename a field (CAM) instead of grep across process + UI + bindings.

---

## 9. Human + AI collaboration patterns

| Practice | Why |
|----------|-----|
| **Schema-valid CAM** | Agents produce JSON/YAML that validates; humans get IDE support. |
| **Compile before merge** | CI runs compiler + `validateProcess` / full workspace checks on emitted artifacts. |
| **Diff of IR or normalized CAM** | Reviews focus on behavior, not accidental drift of ids. |
| **Error codes** | Same codes as `validateProcess` where applicable; compiler adds CAM-specific codes (`cam-duplicate-state`, `cam-surface-orphan-state`, …). |
| **This doc + `semantic-protocol.md`** | Agents resolve “what is normative for actions/policies” vs “how apps bundle process + UI”. |

---

## 10. Repository layout (target)

Exact names may evolve; intent:

- `packages/dsl` — **runtime types**, validation helpers, `buildEnrichedSpec` (unchanged role).
- `packages/worken-dsl-app` — **single-entry** `defineWorkenApp` + `compileWorkenApp` → `@worken/dsl` (implemented; evolves toward full CAM).
- `packages/app-compiler` (or similar) — **CAM schema, parser, emit to dsl types** (optional future package).
- `docs/architecture/` — this document; link from root README when the team agrees.
- Application examples — **CAM sources** under `examples/` or product repos, e.g. `examples/it-request-workspace/src/worken.app.ts`.

---

## 11. Migration strategy (incremental)

1. Document CAM shape and mapping (this file).
2. Add **cross-reference validation** in compiler or extended `validateWorkspace` (surface state ids ⊆ graph states).
3. Introduce **one** reference app authored as CAM → generated dsl files checked in (or generated in CI).
4. Gradually move host domain duplication behind the same compiler outputs.

---

## 12. Useful links (code)

| Topic | Location |
|-------|----------|
| DSL public API | `packages/dsl/src/index.ts` |
| Layering comment | `packages/dsl/src/semantic-stack.ts` |
| Spec enrichment + session contracts | `packages/shell-runtime` |
| Process engine + Postgres World (target) | [process-engine-and-postgres-world.md](./process-engine-and-postgres-world.md) |
| Process validation | `packages/dsl/src/process/validate.ts` |
| Single-entry `defineWorkenApp` | `packages/worken-dsl-app/src/builder.ts` |
| Example (IT request) | `examples/it-request-workspace/src/worken.app.ts` |
| Shared shell runtime (web + CLI) | `packages/shell-runtime` (`enrichShellSpec`, session contract) |
| CLI shell | `apps/cli-shell` (`worken-shell` — Inquirer + same enrichment) |

---

*When adding CAM compiler packages or changing emitted types, update §6 and §10 in the same change.*
