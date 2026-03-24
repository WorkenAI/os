# Minimal example (demo graphs)

This folder is **not** a separate product. It shows how to:

1. Define small **semantic** and **platform** sources (`semantic.source.ts`, `platform.source.ts`).
2. **Compile** them with `@worken/semantic-core` and `@worken/platform-core`.
3. Pass the resulting graphs into the **real** `@worken/platform-mcp` server (`createPlatformMcpServer`).

The MCP server implementation lives in `packages/platform-mcp`. It always serves whatever graphs you pass at startup. This example passes **tiny demo graphs** so you can run `build-bundle` or wire MCP without loading the whole monorepo into a single manifest.

A “full Worken OS” MCP process is the same stack: compile **your** authoritative sources (colocated manifests, generated from CI, etc.) → same `createPlatformMcpServer({ semantic, platform })` → richer graphs, same tools and resources.

## Commands

From this directory after `bun install` at the repo root:

```bash
bun run build
bun run build-bundle
# bun run mcp-server   # stdio; point your MCP client at this command
```
