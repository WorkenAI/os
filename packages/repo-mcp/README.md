# `@worken/repo-mcp`

Turns the **current Worken OS monorepo** into the graphs consumed by `@worken/platform-mcp`.

- Recursively finds every `package.json` under the repo (skips `node_modules`, `.git`, `dist`, `.next`, …).
- Builds a **platform** source: one subsystem `subsystem.worken-os-repo` and `contains` edges to each workspace package (`package.<npm-name-with-dots>`), with `CodeRef` to the npm name and `path/to/package.json`.
- Builds a minimal **semantic** source with a single domain anchor (`domain.worken-os`) so the MCP stack stays valid; extend this package later to merge authored semantic manifests.

## Usage

From the repository root (recommended):

```bash
bun run mcp
```

Or set an explicit root:

```bash
WORKEN_REPO_ROOT=/absolute/path/to/os bun run mcp
```

The entrypoint is `src/mcp-stdio.ts` (also referenced from the root `package.json`).
