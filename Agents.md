# Agents: how to work in this repo

This file is a **playbook**, not a spec. For definitions and normative rules, see `docs/spec/` and `docs/adrs/`.

---

## What you should use first

1. **MCP** (`bun run mcp` from repo root) when you need **architecture truth**, **invariants**, **package graph**, **semantic IR**, or **“is this action allowed?”** — not when you only need to find a string in files.
2. **Read files / grep / tests** when you are **editing code**, **tracing a call stack**, or **running the build**.

If MCP is connected, **call tools** instead of inventing node IDs from memory. Use `get_node` with an id from a previous response, or discover nodes via `bundle_for_task` / `show_invariants` / `worken://glossary`.

---

## First-time orientation (5 minutes)

| Step | Do this |
|------|--------|
| 1 | From repo root: `bun install` (once). |
| 2 | Run or attach MCP: `bun run mcp` (stdio). In Cursor, use `.cursor/mcp.json` if present. |
| 3 | Call **`bundle_for_task`** with `task: "onboard_repo"`, `depth: "compact"` — you get glossary, repo invariants, examples. |
| 4 | Call **`show_invariants`** with `area: "mcp"` to see the read-only rule for this server. |
| 5 | Skim **`worken://thesis`** resource if the client supports resources — one-screen intent of the headless kernel. |

---

## If you are trying to…

### Understand the repo layout (packages, apps)

- **`bundle_for_task`** (`onboard_repo`) for a **curated slice**.
- **`get_node`** with `graph: "platform"` and id like **`package.worken.semantic-core`** (workspace scan: `package.` + npm name with `@` → drop, `/` → `.`).
- **`related_nodes`** from that package id to see subsystem and neighbors.

**Do not** assume every `package.json` on disk is a workspace package; the scanner follows root `workspaces` (direct children only).

### See how TypeScript packages depend on each other (symbols / exports)

- Use the **code graph** layer: **`get_node`** / **`related_nodes`** with ids prefixed like **`pkg.worken.semantic-core`** (from code-graph merge), or run **`bun run code-graph`** locally for raw JSON.
- **Semantic IR** is about **actions/policies**; **code graph** is about **modules and exports**. Use both when the task needs both.

### Reason about “what is allowed” for a demo action (Semantic IR)

The live MCP includes a **small demo** (recruitment example). Typical ids:

- Action: **`action.candidate.schedule_interview`**
- Roles: **`role.hr_manager`**, **`role.recruiter_bot`**
- Surface: **`surface.candidate.detail`**

**Workflow:**

1. **`explain_action`** — pass `actionId`, JSON **`object`** (e.g. `{ "status": "qualified", "phone": "+1" }`), **`subject`** usually `{}`, optional **`roleId`**.
2. **`list_allowed_actions`** — same subject/object/role; get a list of allowed action ids under current predicates.
3. **`render_semantic_slice`** — `targetId: "action.candidate.schedule_interview"`, `format: "llm"` (readable summary) or `"mermaid"` (diagram). Use `format: "json"` for the full **projection model**.

### Get task-shaped context (PR style: adapter, MCP resource, etc.)

- **`bundle_for_task`** with a preset id: `onboard_repo`, `add_mcp_resource`, `add_adapter`, … optional **`area`**, **`depth`** `compact` | `normal`.
- This is **context bundling**, not intent resolution — it does not execute workflows.

### Check impact before editing a package node

- **`impact_of_change`** with **`nodeId`** — e.g. `package.worken.semantic-core` (platform id from workspace scan).

### Read canonical Semantic IR as JSON

- Resource **`worken://semantic-ir`**, or **`render_semantic_slice`** with `format: "json"` and a concrete **`targetId`** for a **slice projection** (smaller, focused).

---

## MCP tools — cheat sheet

Use **`list_tools`** in the client for the full list; common ones:

| Tool | When to use it |
|------|----------------|
| `bundle_for_task` | Task presets + invariants + examples + related nodes. |
| `get_node` | One node by id (`semantic` or `platform`). |
| `related_nodes` | Neighborhood in the graph. |
| `show_invariants` | Filter invariants by substring (`area`). |
| `find_examples` | Example nodes (optional `kind`). |
| `impact_of_change` | Impact bundle around a node id. |
| `explain_action` | Allow/deny + reason for one action + subject/object JSON. |
| `list_allowed_actions` | All actions allowed for given subject/object/role. |
| `resolve_surface` | One IR surface record by id. |
| `render_semantic_slice` | Slice → **llm** / **ascii** / **mermaid** / **json** projection. |

**Hard rule:** this MCP server is **read-only** — it does not edit the repo. See invariant `invariant.repo.mcp-readonly` via `show_invariants`.

---

## Node IDs: avoid mixing two schemes

You may see **both**:

- **Platform scan:** `package.worken.foo` (from workspace `package.json` scan).
- **Code graph:** `pkg.worken.foo` (TypeScript graph).

If **`get_node`** returns `null`, you picked the wrong prefix or graph — try the other prefix or `graph: "semantic"`.

---

## Local commands (no MCP)

| Command | Use when |
|---------|----------|
| `bun run test` | You changed packages; run tests. |
| `bun run check-types` | You changed TS types. |
| `bun run lint` | Before commit (Biome). |
| `bun run code-graph` | You need raw code-graph JSON offline. |

---

## Where the “spec” lives

- **Semantic protocol:** `docs/spec/semantic-protocol.md`
- **Semantic IR & projection:** `docs/spec/semantic-ir.md`, `docs/spec/semantic-projection.md`
- **ADRs:** `docs/adrs/` (kernel, IR, projection engine, code semantics bridge)

Use those when you need **exact definitions**; use **this file** for **what to run and in what order**.
