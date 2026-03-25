# `@worken/shell-runtime` package scope

**Status:** Informative — names the tradeoff accepted during the shell-runtime extraction.

Today **`@worken/shell-runtime`** contains:

- **Shell session** contracts and helpers (`WorkenOsSession`, `createLocalShellSession`, …).
- **Semantic enrichment** for json-render (`enrichShellSpec`, `buildShellEvaluationContext`).
- **Execution / case** types that historically lived next to session contracts (`ExecutionCaseSnapshot`, checkpoints, ownership, …).

That is **broader** than “shell runtime” in the narrow sense. It is acceptable as a **migration bundle** to avoid churn.

**Likely future split:**

- `@worken/runtime-contracts` (or `worken-os-contracts`) — session + execution + WorkItem types.
- `@worken/shell-runtime` — enrichment + session helpers only, depending on contracts.

Until a split, treat imports from `@worken/shell-runtime` as **platform runtime contracts + shell enrichment**, not only UI shell.

---

*Update this file when packages are renamed or split.*
