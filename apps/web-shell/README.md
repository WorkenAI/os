# Worken OS — web-shell (prototype)

This **Next.js** app is a **prototype** for the [Worken OS](../../README.md) project: marketing entry, a **Web Shell** preview, and experiments with session-shaped state, domain manifests, policy, and execution APIs—not a finished product.

For the platform model (WorkSession hub, surfaces, workflows, domain core), see the **repository root** [`README.md`](../../README.md).

---

## What this prototype explores

- **Domain-driven shell** — Domain manifests live in [`examples/demo/domains/`](../../examples/demo/domains/) (package `@worken/demo-data`). The app imports only the thin boundary [`@worken/demo-data/shell-contract`](../../examples/demo/shell-contract.ts) for registry, manifest helpers, and types—no direct `./domains/*` imports. The hero switches active domain; the shell composes from manifests instead of hard-coded “HR page vs Sales page” branches.
- **Session + policy** — Server APIs under `src/app/api/shell/` and `src/app/api/admin/`; policy selectors in `src/shell/runtime/policy/`; local persistence for demo policy/session data.
- **UI composition** — Shared screen runtime in `src/shell/runtime/screen/`, json-render for constrained, streamable surfaces, and a swappable visualization layer under `src/visualization/`.
- **Execution hooks** — Workflow-related routes and types wired for future durable runs (see `src/app/api/shell/execution/` and related code).

Expect rough edges: naming will converge on shared packages (`WorkenOsSession` today vs eventual `WorkSession` in docs), and some paths are app-local stand-ins for a fuller adapter story.

---

## Stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js App Router (`next`) |
| UI | React, Tailwind, Radix primitives, json-render |
| State / flows | XState shell machine, TanStack Query where used |
| Tooling | TypeScript, Biome (lint), Turborepo from monorepo root |

---

## Run locally

From the **monorepo root** (see root README for prerequisites):

```bash
bun install
bun run dev
```

```bash
# From this package only
bun run dev
```

---

## Useful paths

| Path | Role |
|------|------|
| `examples/demo/shell-contract.ts` | **Contract** re-export for web-shell (`@worken/demo-data/shell-contract`) |
| `examples/demo/domains/` | Domain manifests, `registry`, `manifest`, `types` (consumed via contract) |
| `src/shell/` | Shell runtime, session context, machines, server helpers |
| `src/app/api/shell/` | Shell session, active role, execution APIs |
| `src/app/api/admin/` | Admin-facing role/policy endpoints (demo) |
| `src/visualization/` | Marketing/landing scene registry and hooks |
| `src/app/(landing)/` | Route group for `/` (hero + shell preview) |

---

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Dev server |
| `bun run build` | Production build |
| `bun run lint` | Biome lint on `src` |
| `bun run check-types` | `tsc --noEmit` |

Before wider changes, run `lint` and `check-types` from this app or follow the root contributing notes.
