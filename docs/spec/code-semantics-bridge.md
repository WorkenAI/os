# Code semantics bridge (TypeScript → Worken IR)

## Status

Informative (companion to ADR 0003)

## Purpose

The **headless kernel** graphs (`semantic-core`, `platform-core`) describe **authored** domain and contributor truth. The **repository layout** graph in `repo-mcp` describes workspace packages and file-backed manifest overlays.

This document describes a **third projection**: facts about **TypeScript code** (projects, exports, imports, symbol references) and how they can be normalized into **Worken IR** for contract surfaces, impact hints, and agent context.

The TypeScript language service (e.g. **tsserver** or the **Compiler API** used programmatically) is the appropriate **source of truth for code semantics**: configured projects, quick info, definitions, references, and rename locations. Worken does not replace it; it **productizes** a stable interpretation.

## Principle

```text
tsserver / TS compiler fact  →  Worken semantic fact (IR node or edge)
```

Examples of mapping intent (not an exhaustive normative table):

| TS / IDE fact | Worken interpretation |
|---------------|------------------------|
| Configured project for a file | Package boundary (link to `package.json` / workspace member) |
| Export from package entry | Member of **public contract surface** |
| `import type` / value import | `depends-on` or `uses-type-from` (package → package, optionally via symbol) |
| Find all references | `used-by` (reverse edges for impact) |
| Rename / definition span | Breaking-change **risk** signal for public symbols |

Worken-specific **roles** (e.g. `compiler-entrypoint`, `policy-evaluator`) are **not** inferred by TypeScript; they are **annotations** layered in Worken manifests or codegen on top of symbol ids.

## Illustrative IR shape

The following is a **normalized example** of what a **code graph** layer might contain. It is **not** identical to `platform-core` node kinds today; it may converge via new kinds or a dedicated `code-graph` package later.

**Nodes** (examples): `package`, `exported-symbol`, `contract-surface` (public API of a package).

**Edges** (examples): `exports`, `depends-on`, `uses-type-from`, `reexports`, `part-of-surface`, `used-by`.

A minimal sketch for a package that consumes `PlatformGraph`, `SemanticGraph`, and `WorkSession` in its public API (e.g. `@worken/context-core`) would link:

- package node → exported symbols (`BuildContextInput`, `buildContextBundle`, …);
- contract-surface → those symbols as **members**;
- `depends-on` edges to `@worken/platform-core`, `@worken/semantic-core`, `@worken/session-core`;
- `uses-type-from` from types in `BuildContextInput` to the providing packages.

Downstream **impact**: if `SemanticGraph` changes in `@worken/semantic-core`, references from `BuildContextInput` and `buildContextBundle` surface as **consumers** via `used-by` or reference queries — closer to a **contract usage graph** than a folder tree.

## Relationship to existing graphs

- **Semantic graph** — operational domain meaning (actions, blockers, …). Filled from **authored** semantic sources, not from TS alone.
- **Platform graph** — subsystems, packages, contracts, invariants, ADRs. Can be **enriched** by codegen from TS facts (optional).
- **Code graph** (this bridge) — **symbol-level** structure and dependency facts. Sourced from **TS language service** or batch `tsc --generateTrace` / project references analysis, then merged or linked by stable ids.

## Non-goals

- Replacing `tsserver` or duplicating its full type checker in Worken.
- Claiming TS **types** as domain **semantic** truth without authored alignment.

## Implementation in this repo

The package **`@worken/code-graph`** builds a normalized `CodeGraph` from the TypeScript program and projects it into **`PlatformSource`** via `codeGraphToPlatformSource()` for merging with `repo-mcp` (always on for the live MCP server).

## References

- ADR 0003: TypeScript code semantics bridge
- ADR 0002: Headless kernel
