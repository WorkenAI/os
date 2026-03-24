# ADR 0002: Headless kernel v0

## Status

Accepted

## Context

Worken OS needs a browser-independent core that stores semantic truth and contributor/platform truth, builds compact context for code agents, and can expose read-only access via MCP before any Web Shell exists.

## Decision

The v0 headless kernel consists of:

- **Semantic graph** (`@worken/semantic-core`) — operational semantics, compile, predicate evaluation.
- **Platform graph** (`@worken/platform-core`) — subsystems, packages, contracts, invariants, examples, ADRs.
- **Context bundler** (`@worken/context-core`) — task presets and `ContextBundle` assembly.
- **Session coordination** (`@worken/session-core`) — minimal `WorkSession` without persistence.
- **MCP delivery** (`@worken/platform-mcp`) — read-only resources, tools, prompts over the graphs.
- **Examples** (`examples/minimal`) — canonical fixtures and onboarding.
- **Testkit** (`@worken/testkit`) — shared fixtures and assertions.

## Consequences

- Value is delivered as **bundles + MCP** without UI.
- **Web Shell** and future shells remain projection layers over the same graphs.
- The **platform graph** is explicitly separate from **runtime domain state** (see `semantic-protocol.md`).
