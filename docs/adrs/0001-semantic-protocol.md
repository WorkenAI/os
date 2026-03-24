# ADR 0001: Semantic Protocol

## Status

Accepted — see [Semantic Protocol specification](../spec/semantic-protocol.md).

## Context

Worken OS needs a single, machine-compilable way to describe operational meaning (domains, objects, actions, blockers, effects) and projections.

## Decision

The normative specification lives in `docs/spec/semantic-protocol.md`. Implementations (for example `@worken/semantic-core`) compile sources into a semantic graph and evaluate predicates against that graph.

## Consequences

- Authoring can evolve in files; runtime truth is the compiled graph.
- Multiple surfaces (web, chat, voice, API, model-context, MCP) consume the same compiled semantics.
