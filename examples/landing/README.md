# Landing example (DSL baseline)

Authoritative **semantic** and **platform** sources for the landing prototype baseline slice (the same recruitment demo graph that powers Semantic IR tooling).

- `semantic.source.ts` — Semantic Protocol DSL (`SemanticSource`); merged into **`bun run mcp`** via `@worken/repo-mcp`.
- `platform.source.ts` — small platform graph describing how `apps/landing` consumes the generated IR artifact.
- `build-bundle.ts` — compiles both graphs and prints a compact **context bundle** (same pattern as `examples/minimal`).

The Next.js app runs `bun run ./scripts/write-semantic-ir-baseline.ts` (from `apps/landing`) before `next build` to write `src/generated/semantic-ir-baseline.json`.

## Commands

From this directory after `bun install` at the repo root:

```bash
bun run build
bun run build-bundle
```
