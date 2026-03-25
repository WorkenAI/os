# Process engine, Postgres World, and headless / AI execution

**Status:** Target architecture — incremental implementation.

This document ties together:

- **`BusinessProcessDefinition`** (`@worken/dsl`) — declarative graph (states, transitions, events).
- **Workflow “World”** — durable runs (including **Postgres** via `@workflow/world-postgres` and `WORKFLOW_TARGET_WORLD`).
- **Shell runtime** (`@worken/shell-runtime`) — `EvaluationContext` + `enrichShellSpec` for projections when a human or agent needs UI or structured output.

---

## 1. Separation of concerns

| Concern | Role |
|--------|------|
| **Process definition** | What states exist, which **events** are legal from each state, who **actors** are. Pure data; no IO. |
| **Process instance** | Current `StateId`, correlation ids, timestamps, payload — **persisted** (Postgres). |
| **Transition execution** | Apply event → validate edge → new state → side effects (notifications, AI tasks). **Not** the React tree. |
| **Workflow World** | Durable runs (`start` / `getRun` — `apps/web-shell/src/execution/world.ts`). **Mapping:** DSL **transitions** are intended to become **workflow steps** (§2.1). |
| **UI (web / CLI)** | Optional: observe instance, emit **events** that the engine consumes, or render `enrichShellSpec` for a snapshot. |

**Rule:** Process **movement** must not depend on a browser. UI and CLI are **clients** of the same engine API.

---

## 2. Postgres World today (workflow layer)

The app already resolves world kind from the environment:

- `WORKFLOW_TARGET_WORLD` containing `world-postgres` → Postgres-backed world (`WorkenOsWorldKind` `'postgres'`).
- `createWorkenOsWorld()` wraps `@workflow/core/runtime` (`getWorld`, `start`, `getRun`) — see `apps/web-shell/src/execution/world.ts`.

That stack is suited to **workflows** (signal-driven cases, checkpoints). **BPM DSL process instances** are not yet first-class rows in the same store; this document defines how to align them.

### 2.1 DSL transitions → workflow steps (normative intent)

**Design intent:** a **transition** in `BusinessProcessDefinition` (an edge selected by `EventId` when leaving a state) is not only a data-structure change — it is meant to become a **step** in a **Workflow** run backed by World (Postgres or other).

Consequences:

- **One emitted event** that moves the instance along an edge → **one workflow step** (or one atomic segment between durable checkpoints), with correlation ids linking **process instance id** ↔ **workflow run id**.
- **Idempotency** — step ids / replay semantics align with workflow’s model so retries and agents do not double-apply transitions.
- **Observability** — operators see the same run in workflow tooling; **DSL state** is a projection of / checkpoint alongside the workflow position.
- **Gateways / parallel branches** — map to workflow parallelism or child runs as the engine matures (exact mapping is implementation detail; the rule is: graph semantics drive step structure).

Until the compiler/runtime wires this, transitions remain **declarative only**; the **target** execution path is **DSL + emitEvent → workflow step**, not ad hoc side effects only.

---

## 3. Target: process engine service

Introduce a **single service API** (library or HTTP) used by web, CLI, cron, and agents:

1. **`startProcess(processId, input)`** — create instance row, set `initial` state.
2. **`emitEvent(instanceId, eventId, payload?)`** — load definition, validate transition (`validateProcess`-level rules + product guards), update state, append to an **event log** (audit).
3. **`getInstance(instanceId)`** — current state + history for UI/agents.
4. **Subscriptions** (optional) — notify web (SSE), CLI, or enqueue **background jobs**.

Persistence **SHOULD** use the same Postgres as Workflow World (or a schema co-located with it) so operators have one backup/replication story.

---

## 4. Connecting to background AI agents

Agents do **not** need UI. They need:

- **Identity** — `WorkenOsSession` or a **service principal** actor (`kind: 'ai' | 'system'`) in `EvaluationContext`.
- **Authority** — policy checks before emitting an event (same as a human).
- **Triggers** — workflow step, queue consumer, or cron calling **`emitEvent`** with the agent’s session.

Semantic enrichment (`buildShellEvaluationContext` + `enrichShellSpec`) is **optional**: use it when the agent must produce a **Spec** or explainability surface; headless paths can skip Spec and only update process + notify.

---

## 5. UI remains a thin client

- **Web-shell** and **cli-shell** call the same **process API** (or invoke workflows that call it).
- **No** “only the web server may advance state” — otherwise Postgres World and agents cannot be authoritative.

---

## 6. Implementation checklist (suggested order)

1. **Tables** — `process_instances` (id, `process_id`, `version`, `current_state`, `payload`, …), `process_events` (append-only).
2. **Engine module** — load `BusinessProcessDefinition`, run `validateProcess` at deploy; at runtime validate `on` / `from` / `to`.
3. **Workflow adapter** — generated or hand-mapped **workflow** whose **steps** correspond to DSL **transitions** (see §2.1); `createWorkenOsWorld().startRun` runs that workflow so Postgres World records each transition as durable work.
4. **Agent path** — issue credentials + session; restrict events via policy.

---

## 7. Related code

| Topic | Location |
|-------|----------|
| Workflow World wrapper | `apps/web-shell/src/execution/world.ts` |
| Execution / signals (today) | `apps/web-shell/src/execution/service.ts`, `store.ts` |
| DSL process types | `packages/dsl/src/process/types.ts` |
| Shell semantic runtime | `packages/shell-runtime` |
| Process manager (WorkItem, web + CLI) | [process-manager.md](./process-manager.md) |

---

*When the process engine lands in `packages/` or `apps/`, add package names and schema links here.*
