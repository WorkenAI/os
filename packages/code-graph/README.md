# `@worken/code-graph`

Builds a **code semantics graph** from the TypeScript compiler API:

- Workspace packages (`@worken/*` by default) resolved like `repo-mcp`
- Per package: `createProgram` from local `tsconfig.json`
- **Imports** → `depends-on` / `uses-type-from` (type-only imports)
- **Exports** from `src/index.ts` → `exported-symbol` nodes + `contract-surface` per package

Use `codeGraphToPlatformSource()` to merge into the platform graph for MCP (subsystem `subsystem.worken-code-graph`).

## CLI

From repo root:

```bash
bun run code-graph
# or limit packages:
WORKEN_CODE_GRAPH_PACKAGES=@worken/context-core,@worken/semantic-core bun run code-graph
```

## MCP

`repo-mcp` always merges this graph into the platform graph (`bun run mcp` from the repo root). Optional: `WORKEN_CODE_GRAPH_PACKAGES=…` to limit packages.
