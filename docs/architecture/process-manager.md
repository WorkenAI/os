# Process manager (web-shell + cli-shell)

**Status:** Normative product shape; UI surfaces are implemented incrementally.

Like any OS, Worken OS needs a **process manager**: a place to see what is running, what needs attention, and **who is responsible** — whether that is a person or an AI agent.

---

## 1. Role

| Responsibility | Description |
|----------------|-------------|
| **Surface WorkItems** | List and detail views backed by the same **idempotent** model (see below). |
| **Assignees** | Show **assignee** as a neutral `WorkItem.assignee` (`WorkenActorRef`: human, AI, or system). No separate UX fork for “bot vs human” at the data layer. |
| **Two tops** | **Web-shell** — feature surface under `/shell/…` (or a dedicated domain). **CLI-shell** — feature top-level command or mode (e.g. `worken-shell processes`). Same API contract, different renderer. |

The process manager is a **client** of the process engine + persistence (see [process-engine-and-postgres-world.md](./process-engine-and-postgres-world.md)). It does not own transitions; it **displays** and may **invoke** allowed events through the engine API.

---

## 2. WorkItem (idempotent)

Shared type: **`WorkItem`** in `@worken/shell-runtime` (`work-item.ts`).

- **`workItemId`** — stable primary key for list reconciliation (same row → same id across refreshes and clients).
- **`idempotencyKey`** — optional external key for imports, webhooks, or agent retries.
- **`assignee`** — `WorkenActorRef` so web, CLI, and semantic `actor` stay aligned.

**Idempotent listing:** the server (or engine read model) MUST return items keyed by `workItemId` so web and CLI can diff/update without duplicates when polling or reconnecting.

---

## 3. Web-shell feature top

- **Route:** e.g. `/shell/processes` or a **processes** domain in `SHELL_DOMAIN_CATALOG` — product decision; must appear in role **sidebar** when `DomainPermissions` grant it.
- **Data:** HTTP or server actions calling the same list API as CLI (session-scoped, policy-filtered).

---

## 4. CLI-shell feature top

- **Entry:** e.g. `worken-shell processes` or interactive “Process manager” from the main menu.
- **Output:** table or list from the same `WorkItem[]` shape (title, state, assignee kind + id, updatedAt).

Environment for non-interactive use: reuse **`WORKEN_DOMAIN_ID` / `WORKEN_ROLE_ID`** or future **`WORKEN_PROCESS_FILTER`** as needed.

---

## 5. Policy

Rows MUST respect **role/domain** policy: only WorkItems the actor may see (same rules for web and CLI).

---

## 6. Related

| Topic | Location |
|-------|----------|
| `WorkItem` type | `packages/shell-runtime/src/work-item.ts` |
| Process engine (target) | [process-engine-and-postgres-world.md](./process-engine-and-postgres-world.md) |
| Shell catalog (domains) | `examples/demo/shell-catalog.ts` |

---

*When adding routes or CLI commands, update §3–§4 and link the API path here.*
