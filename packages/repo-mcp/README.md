# `@worken/repo-mcp`

Turns the **current Worken OS monorepo** into the graphs consumed by `@worken/platform-mcp`.

## What gets loaded

1. **Workspace packages** — only `package.json` that are **direct children** of each root `package.json` workspace glob (e.g. `apps/foo`, `packages/bar`), matching how Bun/npm workspaces resolve. The repo **root** package is **not** listed as a workspace package. Nested packages under those roots (e.g. `packages/a/b`) are **not** scanned unless you add a separate workspace entry.

2. **Repo manifest overlay** (`buildRepoManifestSource`) — merged on top: canonical **invariant** (MCP read-only), **example** pointing at `docs/spec/semantic-protocol.md`, **ADR** nodes for files under `docs/adrs/` when present, all linked under `subsystem.worken-os-repo`.

3. **Semantic overlay** — merged with the domain anchor: optional **glossary-term** from `docs/adrs/0002-headless-kernel.md` when the file exists.

Use `mergePlatformSources` / `mergeSemanticSources` from `@worken/platform-core` / `@worken/semantic-core` so live MCP stays a **single compiled graph** with stable overrides.

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| `WORKEN_REPO_ROOT` | (auto-detect) | Absolute path to monorepo root |
| `WORKEN_REPO_MCP_EXCLUDE` | `examples/*` | Comma-separated path prefixes to skip under repo root (after workspace resolution) |
| `WORKEN_REPO_MCP_INCLUDE_EXAMPLES` | unset | Set to `1` to include `examples/*` packages |
| `WORKEN_MCP_CODE_GRAPH` | unset | Set to `1` to merge `@worken/code-graph` (TS exports/imports) into the platform graph |
| `WORKEN_CODE_GRAPH_PACKAGES` | unset | Optional comma-separated npm names to limit code graph (e.g. `@worken/context-core`) |

## Usage

From the repository root:

```bash
bun run mcp
```

Or:

```bash
WORKEN_REPO_ROOT=/absolute/path/to/os bun run mcp
```

Entrypoint: `src/mcp-stdio.ts` (root `package.json` script `mcp`).
