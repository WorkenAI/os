# Worken OS: application model, DSL, and single source of truth

This document is written for **humans and AI agents** (clear structure, stable terms, explicit data flows). It describes the **target architecture** for modeling applications in Worken OS: one canonical model, compilation to today’s `@worken/dsl` shapes, and how that supports **people and AI working on the same artifacts**.

**Status:** Normative for product direction; the codebase may still be mid-migration. When behavior or layout changes, update this file in the same PR.

**Related:** [Semantic protocol](../spec/semantic-protocol.md) (domain actions, policies, broader semantic layer). This doc focuses on **application/process/UI binding** and the **compiler boundary**.

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

## 3. High-level view

```
┌────────────────── Authoring (human + AI) ──────────────────┐
│  Canonical Application Model (CAM)                          │
│  • YAML or TypeScript module with schema / codegen          │
│  • One document per app (or workspace template)             │
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

## 4. Canonical Application Model (CAM) — conceptual shape

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

## 5. Mapping CAM → existing `@worken/dsl` types

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

## 6. Layering (aligned with `semantic-stack`)

The intentional order remains:

1. **Process graph** — `BusinessProcessDefinition`
2. **Process UI** — `ProcessUiDefinition`
3. **Workspace** — `WorkspaceDefinition`
4. **Semantic protocol runtime** — `EvaluationContext`, `seedSemanticState`, `applyDataBindings`, `$semantic` → `$state` in `buildEnrichedSpec`
5. **Shell bridge** — `ProcessDomainBridge` for state → domain view routing

CAM **spans** layers 1–5 in authoring form; the compiler **splits** it into the existing packages without redefining semantics.

---

## 7. Data-binding and DX

**Authoring:** CAM should describe **intent** (which semantic paths feed which UI slots) in a stable notation; the compiler emits:

- `DataBindingPlan` rules (`from` semantic path → `to` JSON Pointer under `Spec.state`), and/or
- Templates that use `{ $semantic: "object.field" }` resolved at enrich time to `{ $state: "/semantic/object/field" }`.

**Runtime:** Unchanged: `enrichShellSpec` / `buildEnrichedSpec` merge state and resolve dynamics.

**DX goals:**

- Fewer raw string paths in hand-written code; prefer **generated** pointers or **linted** conventions from CAM.
- Single place to rename a field (CAM) instead of grep across process + UI + bindings.

---

## 8. Human + AI collaboration patterns

| Practice | Why |
|----------|-----|
| **Schema-valid CAM** | Agents produce JSON/YAML that validates; humans get IDE support. |
| **Compile before merge** | CI runs compiler + `validateProcess` / full workspace checks on emitted artifacts. |
| **Diff of IR or normalized CAM** | Reviews focus on behavior, not accidental drift of ids. |
| **Error codes** | Same codes as `validateProcess` where applicable; compiler adds CAM-specific codes (`cam-duplicate-state`, `cam-surface-orphan-state`, …). |
| **This doc + `semantic-protocol.md`** | Agents resolve “what is normative for actions/policies” vs “how apps bundle process + UI”. |

---

## 9. Repository layout (target)

Exact names may evolve; intent:

- `packages/dsl` — **runtime types**, validation helpers, `buildEnrichedSpec` (unchanged role).
- `packages/app-compiler` (or similar) — **CAM schema, parser, emit to dsl types** (optional future package).
- `docs/architecture/` — this document; link from root README when the team agrees.
- Application examples — **CAM sources** under `examples/` or product repos, not hand-duplicated `defineProcess` + `defineProcessUi` unless for tests.

---

## 10. Migration strategy (incremental)

1. Document CAM shape and mapping (this file).
2. Add **cross-reference validation** in compiler or extended `validateWorkspace` (surface state ids ⊆ graph states).
3. Introduce **one** reference app authored as CAM → generated dsl files checked in (or generated in CI).
4. Gradually move host domain duplication behind the same compiler outputs.

---

## 11. Useful links (code)

| Topic | Location |
|-------|----------|
| DSL public API | `packages/dsl/src/index.ts` |
| Layering comment | `packages/dsl/src/semantic-stack.ts` |
| Spec enrichment (shell) | `apps/web-shell/src/shell/server/semantic/enrich-spec.ts` |
| Semantic evaluation context (shell) | `apps/web-shell/src/shell/server/semantic/evaluation-context.ts` |
| Process validation | `packages/dsl/src/process/validate.ts` |

---

*When adding CAM compiler packages or changing emitted types, update §5 and §9 in the same change.*
