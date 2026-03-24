# ADR 0003: TypeScript code semantics bridge

## Status

Accepted

## Context

Worken OS already has:

- **Authored graphs** (semantic + platform) and **repo layout** projection (`repo-mcp`).
- Agents and IDEs that rely on **TypeScript** for accurate **project model**, **exports**, **imports**, **definitions**, and **references**.

For **contract surfaces**, **impact analysis**, and **documentation** aligned with real code, we need a clear rule: where does **code-level** truth live, and how does it connect to Worken IR?

## Decision

1. **TypeScript language service facts** (via **tsserver** or **Compiler API** in tooling) are the **canonical source of truth for code structure**: which file belongs to which project, what each package exports, what symbols are referenced across package boundaries.

2. Worken defines a **code semantics bridge**: a documented mapping from those facts to **Worken-normalized IR** (packages, exported symbols, contract surfaces, `depends-on`, `uses-type-from`, `used-by`). See `docs/spec/code-semantics-bridge.md`.

3. **Worken-specific interpretation** (e.g. labeling `compileSemantic` as a compiler entrypoint) is **authored** in manifests or codegen — it is **not** something tsserver infers automatically.

4. The bridge is **complementary** to the semantic and platform graphs: it answers **“what does the code actually import and export?”** rather than **“what must be true in the domain?”**

## Consequences

- Future tooling may **generate or validate** platform edges (e.g. `depends-on` between packages) from TS reference data.
- MCP may expose **code-graph** resources or tools once a concrete implementation exists; v0 can rely on **manual** platform graph + **this ADR** as the contract for the next step.
- Agents should combine **MCP graphs** (meaning + repo layout) with **IDE/TS** features (go-to-definition, find references) for **editing**; the bridge document explains how those layers **merge conceptually**.

## References

- `docs/spec/code-semantics-bridge.md`
- ADR 0002 (Headless kernel)
