# Worken OS Semantic Protocol

## Status

Draft

## Normative and informative sections

This specification contains both normative and informative content.

### Normative content

Normative content defines requirements for compliant authoring tools, compilers, and runtimes.
Normative statements use the keywords:

- MUST
- MUST NOT
- SHOULD
- SHOULD NOT
- MAY

These keywords are to be interpreted as requirement levels of this specification.

### Informative content

Informative content exists to explain intent, provide examples, and illustrate possible implementations.
Informative content does not define compliance requirements.

Unless explicitly marked otherwise, the following sections are normative:

- Purpose
- Design goals
- Non-goals
- Core concepts
- Normative minimal schema
- Normative predicate and evaluation model
- Execution model
- Versioning

The following sections are informative unless otherwise stated:

- Problem
- Authoring model
- Example action card
- Why action-centric authoring
- Ownership and responsibility
- Surface projections
- Relationship to policy systems
- Relationship to workflows
- Informative compiled IR example
- Compilation model
- Recommended repository layout
- Authoring rules

---

## Purpose

Worken OS Semantic Protocol defines a human-readable, machine-compilable way to describe:

- what domain objects exist
- which actions can be performed on them
- who may perform those actions
- under which conditions actions are available
- why actions are blocked
- what effects successful actions produce
- how actions should be projected into UI, chat, and voice environments

A **domain** is any coherent area of work—commercial, internal, technical, scientific, or otherwise. The protocol does not assume a particular industry or profit motive.

The protocol exists to give Worken OS a stable semantic layer between:

- domain data
- policy evaluation
- agent reasoning
- human interfaces
- execution runtimes

It is not only an authorization format. It is a protocol for **operational meaning**.

**Bootstrap target.** The protocol is not only for arbitrary third-party domains. It is written so **Worken OS can be specified, governed, and surfaced through the same semantic layer**—platform objects and actions, shells, and agent affordances included. The first serious consumer of the compiled graph is the OS itself. If the spec cannot carry Worken OS without parallel ad hoc logic, it is not yet sufficient.

---

## Problem

Traditional systems split this meaning across too many places:

- database schemas define objects
- RBAC tables define permissions
- workflow engines define transitions
- UI code decides which buttons to show
- agents infer available actions from prompts
- domain rules live in backend code
- blocked reasons are usually implicit or missing

As a result:

- humans do not understand what is possible right now
- agents cannot reliably reason about action availability
- interfaces become inconsistent across web, chat, and voice
- explainability is poor
- policy and UX drift apart
- domain behavior is hard to inspect and evolve

Worken OS needs one shared semantic contract that can answer:

1. What is this object?
2. What can this actor do right now?
3. Why are other actions blocked?
4. What happens if an action succeeds?
5. How should this be rendered in a given surface?

---

## Design goals

The protocol MUST be:

### 1. Human-readable

A product owner, operator, or domain designer should be able to inspect a protocol file and understand the action model without reading engine code.

### 2. Machine-compilable

The authoring format must compile into normalized runtime structures, indexes, and evaluators.

### 3. Explainable

Blocked actions must carry explicit machine-readable and human-readable reasons.

### 4. Surface-agnostic

The same semantic definition should project into:

- web UI
- chat UI
- voice UI
- agent tool selection
- model context (prompts, citations, compact cards for LLMs)
- API exposure

### 5. Action-centric

The primary unit of authoring should be the **semantic action** (what can be done in the domain), not a low-level permission rule.

### 6. Stable under refactoring

Stable semantic identifiers must matter more than file paths.

### 7. Extensible by domain

Different Worken OS domains must be able to introduce their own objects, actions, roles, and conditions without breaking the core model.

### 8. Accountable to the platform

The format must stay honest under **real product pressure**: Worken OS should be buildable and operable with semantics authored in this protocol, so the same action cards, evaluation, and projections apply to **customer work and to the platform’s own behavior**. Convenience shortcuts that only work for toy examples are out of scope.

---

## Non-goals

This protocol is not intended to be:

- a general-purpose programming language
- a full workflow engine
- a UI component library
- a transport protocol
- a persistence format
- a replacement for backend application logic
- a full continuity model for durable responsibilities, claims, leases, wake triggers, or loop deduplication

The protocol describes **semantic availability and meaning** centered on actions.

It does not yet standardize continuity semantics for work that remains open over time, such as:

- what responsibility remains open beyond a single interaction
- who currently owns or has claimed that responsibility
- when that responsibility should wake or be re-evaluated
- how parallel planning or looping should be deduplicated before execution

Those concerns likely require a companion semantic layer or follow-up specification. Until then, runtimes may implement them separately, but they are outside the scope of this draft.

Execution remains the responsibility of runtime handlers.

---

## Core concepts

The central abstraction of the protocol is the **action card**.

Each action card answers:

- what action is being defined
- which object it applies to
- who may attempt it
- when it is allowed
- why it can be blocked
- what it does
- how it should appear to humans and agents

This action-centric model is the authoring format.

The runtime format is a compiled semantic graph and lookup index.

In other words:

```text
human-authored action cards
        ↓
parser + validator
        ↓
normalized semantic IR
        ↓
policy evaluation + surface projection + execution binding
```

### Domain

A domain is a bounded area of capability or concern.

Examples:

- operations
- platform
- research
- support
- security

A domain groups related objects, actions, and semantic conventions.

### Object

An object is an entity in the domain that actions can target (not necessarily a database row or a commercial artifact).

Examples:

- task
- issue
- deployment
- experiment
- resource
- ticket

Objects may have:

- fields
- state
- ownership
- relationships
- external bindings

### Actor

An actor is the subject attempting or performing an action.

Examples:

- human user
- role-bearing operator
- AI agent
- integration bot
- system process

The protocol does not require all actors to be human.

### Role

A role is a semantic capability profile used to constrain action availability.

Examples:

- operator
- maintainer
- viewer

Roles are semantic, not merely visual. They influence what can be attempted and how actions are presented.

### Action

An action is a named operation on an object.

Examples:

- hand-off
- approve-change
- publish
- rollback

An action is the primary authoring unit of the protocol.

### Condition

A condition is a predicate that must hold for an action to be available.

Examples:

- `object.status == "ready"`
- `exists(object.assignee)`
- `actor.id == object.ownerId`

Conditions are evaluated against runtime context (see [Normative predicate and evaluation model](#normative-predicate-and-evaluation-model)).

### Blocker

A blocker is an explicit reason why an action is unavailable.

A blocker MUST contain:

- a stable code
- a human-readable message

A blocker MAY also define:

- remediation hints
- responsible role
- severity
- conditional predicate

### Effect

An effect describes the semantic outcome of a successful action.

Examples:

- notify subscribers
- transfer ownership
- emit event
- transition object state
- enqueue follow-up work

Effects describe semantic intent. Concrete execution is bound by runtime handlers.

### Surface hint

A surface hint describes how an action should be projected into an interaction surface.

Examples:

- primary vs secondary action
- visible when blocked
- voice phrasing
- agent recommendation weight
- confirmation requirement

---

## Authoring model

The authoring model is organized by:

`domain → object → action`

Example:

```text
docs/spec/
domains/
  operations/
    task/
      hand-off.md
      assign-owner.md
      publish.md
```

This structure is intentionally optimized for human navigation:

- domain designers think in problem areas and boundaries
- operators think in objects
- users and agents think in actions

The filesystem is an authoring convenience, not the semantic source of truth. The semantic source of truth is the compiled protocol graph built from stable IDs.

---

## Normative minimal schema

This section is normative.

An action card MUST be a structured document that contains a metadata object with the following fields.

### Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Globally stable semantic identifier |
| `domain` | string | Domain identifier |
| `object` | string | Target object type |
| `action` | string | Canonical action name |
| `roles` | string[] | Roles that may attempt evaluation of the action |
| `when` | PredicateExpression[] | Predicates that MUST evaluate to true for the action to be available |
| `blocked` | Blocker[] | Explicit blocker definitions that explain unavailable states |
| `effects` | Effect[] | Semantic outcomes of successful execution |
| `ui` | UiHints | Surface projection hints |

### Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `protocolVersion` | string | Protocol version understood by the author |
| `title` | string | Human-readable title |
| `description` | string | Human-readable description |
| `appliesTo` | string[] | Additional compatible object kinds |
| `tags` | string[] | Non-authoritative indexing metadata |

### Structural requirements

1. `id` MUST be globally unique within the compiled semantic graph.
2. `domain`, `object`, and `action` MUST be stable semantic identifiers, not UI labels.
3. `roles` MUST contain at least one role.
4. `when` MAY be empty only if the action is always eligible for the listed roles.
5. `blocked` MUST define at least one blocker whenever `when` is non-empty.
6. Each blocker MUST contain:
   - `code`
   - `message`
7. `ui.label` MUST be present.
8. Unknown fields MUST be ignored by compliant runtimes unless the active protocol version defines them.

### Canonical shape

```yaml
protocolVersion: 0.1
id: operations.task.hand-off
domain: operations
object: task
action: hand-off

roles:
  - operator
  - maintainer

when:
  - object.status == "ready"
  - exists(object.assignee)

blocked:
  - code: wrong_status
    message: Task must be in ready status
    when: object.status != "ready"
  - code: missing_assignee
    message: Task must have an assignee
    when: not exists(object.assignee)

effects:
  - kind: ownership.transfer
  - kind: object.touch
    field: updatedAt
    value: now

ui:
  label: Hand off
  priority: primary
  showWhenBlocked: true
```

---

## Normative predicate and evaluation model

This section is normative.

### Evaluation context

Each action MUST be evaluated against an evaluation context with the following namespaces:

- `actor` — the subject attempting the action
- `object` — the target object instance
- `env` — runtime environment values
- `time` — evaluation timestamp
- `input` — optional user-supplied action input

A runtime MAY provide domain aliases such as `task` for `object`, but the canonical namespace is `object`.

### Predicate language

A predicate expression MUST evaluate to either `true` or `false`.

The minimal predicate language supports:

- equality: `==`
- inequality: `!=`
- boolean conjunction: `and`
- boolean disjunction: `or`
- boolean negation: `not`
- existence checks: `exists(path)`
- membership checks: `in`
- parenthesized grouping

### Path resolution

A path expression resolves against one of the evaluation namespaces.

Examples:

- `actor.id`
- `actor.role`
- `object.status`
- `object.ownerId`
- `env.workspaceId`

A missing path resolves to `null`.

### Truth rules

1. An action is `available` only if:
   - the actor role is listed in `roles`
   - every expression in `when` evaluates to `true`
2. An action is `blocked` if:
   - the actor role is not listed in `roles`, or
   - any expression in `when` evaluates to `false`
3. A blocker is included in the evaluation result if:
   - the blocker has no `when` predicate and the action is blocked, or
   - the blocker `when` predicate evaluates to `true`

### Blocker derivation

Blockers are explanatory metadata, not primary policy rules.

Normative rule:

- `when` determines availability
- `blocked` explains unavailability

A compliant compiler SHOULD warn if a blocker cannot be matched to any failing condition.
A compliant compiler MAY support derived blockers generated automatically from failed predicates, but authored blockers take precedence.

### Evaluation result

A runtime MUST be able to produce a result in this shape:

```yaml
id: operations.task.hand-off
status: blocked
allowed: false
reasons:
  - code: wrong_status
    message: Task must be in ready status
  - code: missing_assignee
    message: Task must have an assignee
```

---

## Execution model

The protocol does not execute actions by itself.

Instead, each semantic action is bound at runtime to an execution handler.

Example separation:

- protocol says `operations.task.hand-off` is available
- runtime handler updates assignments in the work system
- event pipeline updates the object state
- UI reprojects the new action availability

This allows the protocol to stay stable even when infrastructure changes.

---

## Ownership and responsibility

Many actions depend not only on state and role, but also on ownership.

Examples:

- only the current owner may advance the work
- only a maintainer may approve certain transitions
- an agent may act only on objects it controls

Ownership therefore belongs in runtime evaluation context.

Typical condition examples:

```yaml
when:
  - object.ownerId == actor.id
```

or

```yaml
when:
  - actor.role == maintainer
```

The protocol does not hardcode one ownership model. It only provides the semantic places where ownership predicates can be expressed.

---

## Versioning

The protocol should evolve explicitly.

Future action cards MAY include:

```yaml
protocolVersion: 0.1
```

The spec itself should maintain:

- status
- version
- change log
- migration notes

For this initial draft, the protocol version is conceptual only.

---

## Example action card

````markdown
---
id: operations.task.hand-off
domain: operations
object: task
action: hand-off

roles:
  - operator
  - maintainer

when:
  - object.status == "ready"
  - exists(object.assignee)

blocked:
  - code: wrong_status
    message: Task must be in ready status
  - code: missing_assignee
    message: Task must have an assignee

effects:
  - kind: ownership.transfer
  - kind: object.touch
    field: updatedAt
    value: now

ui:
  label: Hand off
  priority: primary
  showWhenBlocked: true
---

# Hand off

Transfers responsibility for a ready task that already has an assignee.
````

---

## Informative compiled IR example

This section is informative.

The following example shows one possible compiled representation of an authored action card.

### Authored card

```yaml
id: operations.task.hand-off
domain: operations
object: task
action: hand-off
roles: [operator, maintainer]

when:
  - object.status == "ready"
  - exists(object.assignee)

blocked:
  - code: wrong_status
    message: Task must be in ready status
    when: object.status != "ready"
  - code: missing_assignee
    message: Task must have an assignee
    when: not exists(object.assignee)

effects:
  - kind: ownership.transfer
  - kind: object.touch
    field: updatedAt
    value: now

ui:
  label: Hand off
  priority: primary
  showWhenBlocked: true
```

### Example compiled IR

```json
{
  "id": "operations.task.hand-off",
  "protocolVersion": "0.1",
  "domain": "operations",
  "object": "task",
  "action": "hand-off",
  "roles": ["operator", "maintainer"],
  "eligibility": {
    "all": [
      { "op": "eq", "left": { "path": "object.status" }, "right": { "const": "ready" } },
      { "op": "exists", "arg": { "path": "object.assignee" } }
    ]
  },
  "blockers": [
    {
      "code": "wrong_status",
      "message": "Task must be in ready status",
      "when": {
        "op": "ne",
        "left": { "path": "object.status" },
        "right": { "const": "ready" }
      }
    },
    {
      "code": "missing_assignee",
      "message": "Task must have an assignee",
      "when": {
        "op": "not",
        "arg": { "op": "exists", "arg": { "path": "object.assignee" } }
      }
    }
  ],
  "effects": [
    { "kind": "ownership.transfer" },
    { "kind": "object.touch", "field": "updatedAt", "value": "now" }
  ],
  "projection": {
    "ui": {
      "label": "Hand off",
      "priority": "primary",
      "showWhenBlocked": true
    }
  },
  "bindings": {
    "handlerKey": "operations.task.handOff"
  }
}
```

### Notes

This IR is illustrative, not mandatory.
The normative requirement is that a compiler preserves:

- stable action identity
- role constraints
- predicate semantics
- blocker explainability
- effect semantics
- surface projection metadata

Important point: the **IR shape itself can stay informative**, while the semantic guarantees around it are normative. That gives you freedom to change implementation later.

---

## Compilation model

A reference implementation SHOULD compile action cards into:

### 1. Parsed AST

Parsed front matter and markdown metadata.

### 2. Normalized semantic IR

Canonical representation of:

- domains
- objects
- actions
- conditions
- blockers
- effects
- UI hints

The repository implementation of this layer is **`@worken/semantic-ir`**: it projects a compiled `SemanticGraph` into **Semantic IR** (schema metadata, entities, roles, actions, policies, surfaces, transitions, bindings) with a deterministic `snapshotId`. See `docs/spec/semantic-ir.md` and ADR `docs/adrs/0004-semantic-ir.md`.

### 3. Evaluation indexes

Fast lookup structures by:

- domain
- object
- role
- action id

### 4. Surface projections

Derived representations for:

- web shell
- chat shell
- voice shell
- model context
- agent runtime

### 5. Execution bindings

References to runtime handlers or tool adapters.

---

## Why action-centric authoring

The protocol is action-centric because that is the most natural unit for both humans and agents.

Humans think:

- what can I do with this object?
- why can’t I do that yet?
- what is the next step?

Agents think:

- what tools are currently available?
- what preconditions are missing?
- which action advances the objective?

By contrast, policy-first authoring usually forces people to think in fragmented abstractions such as:

- allow / deny rules
- state machine internals
- UI visibility flags
- backend-only guards

Worken OS Semantic Protocol unifies these perspectives around a single semantic unit.

---

## Surface projections

The protocol must support multiple projections of the same semantic truth.

A blocked action MUST be representable as structured output (see [Evaluation result](#evaluation-result)). That enables:

- disabled buttons with reasons in web UI
- inline remediation in chat
- spoken explanations in voice UI
- better agent planning
- auditable decision traces

A system that knows an action is unavailable but cannot explain why is incomplete.

### Web UI projection

The runtime may render:

- available actions
- blocked actions
- reason tooltips
- primary next action
- actions visible only to elevated roles

### Chat projection

The runtime may render:

- suggested replies
- slash commands
- remediation prompts
- structured action lists

### Voice projection

The runtime may render:

- short action prompts
- spoken blocker explanations
- confirmation requirements
- next-best-action phrasing

### Agent projection

The runtime may expose:

- currently callable actions
- blockers
- missing prerequisites
- semantic affordances
- action selection metadata

The protocol therefore separates **semantic truth** from **surface-specific presentation**.

### Model-context projection

**Normative.** `model-context` is a first-class projection target for compiled semantic nodes (for example, projection nodes whose `target` is `model-context`). Runtimes that assemble prompts, tool lists, or RAG context for agents MUST treat model-context projections as a supported surface alongside web, chat, voice, and API projections.

Authoring tools SHOULD allow defining how an action or semantic unit is summarized or structured for inclusion in model context (for example, compact card text, field hints, or citation ids).

---

## Compiled semantic graph guarantees

**Normative.** A compliant compiler that emits a compiled semantic graph MUST preserve the following so that all consumers (UI, agents, MCP, workflows) share one interpretation:

1. **Stable ids** — Node and relation identifiers MUST remain stable across refactors that do not change semantic identity. File paths MUST NOT be the sole source of identity.
2. **Relation kinds** — Only relation kinds defined by the protocol version (or explicitly extended under documented rules) MAY appear in the compiled graph.
3. **Binding metadata** — Execution bindings (handler keys, tool keys, side-effect class, approval requirements) MUST be recorded on binding nodes or equivalent IR so runtimes can route execution without re-parsing markdown.
4. **Deprecation metadata** — When a node is superseded or deprecated, `deprecatedSince` and `supersededBy` (or equivalent) MUST be present on the compiled node so clients can migrate deterministically.

---

## Action cards vs canonical runtime truth

**Normative.** Action cards (human-authored units) are the primary authoring format; the **canonical runtime truth** for availability, eligibility, and structure is the **compiled semantic graph** (normalized nodes, relations, indexes). Runtimes MUST evaluate against the compiled graph, not against raw authoring files alone.

Authoring tools MAY keep auxiliary formats; the compiler is responsible for producing the graph that is authoritative for evaluation.

---

## Contributor platform graph vs runtime semantics

**Normative.** The **contributor / platform graph** (subsystems, packages, contracts, invariants, ADRs, examples) describes how the product and repository are structured and governed. It MUST NOT be confused with **runtime domain semantics** (customer objects, live state, workflow execution).

These two layers MAY reference each other (for example, a platform invariant constraining an adapter), but compilers and tools MUST keep their storage, compilation, and delivery paths distinct so that contributor truth and operational domain truth do not collapse into a single undifferentiated graph.

---

## Relationship to policy systems

The protocol is compatible with traditional policy systems, but not limited to them.

It can compile to or coexist with:

- backend guards
- RBAC/ABAC checks
- OPA/Rego policies
- workflow state evaluators
- UI visibility logic
- agent tool registries

This separation mirrors established practice where human-oriented authoring is compiled into machine-evaluated runtime structures, rather than authored directly in low-level logic languages.

---

## Relationship to workflows

The protocol is not a full workflow language.

However, it can represent workflow-adjacent semantics:

- allowed action by current state
- expected next step
- transition intent
- remediation path
- action availability over time

This makes the protocol complementary to workflow systems rather than a replacement for them.

A workflow engine may orchestrate long-running processes. Semantic Protocol tells the system what an actor can meaningfully do **now**.

---

## Recommended repository layout

A recommended future layout is:

```text
semantic/
  domains/
    operations/
      task/
        hand-off.md
        assign-owner.md
        publish.md
      deployment/
        rollback.md
        promote.md
  shared/
    roles.md
    reason-codes.md
    predicates.md
  schema/
    action.schema.json
```

This is only a recommended authoring layout. Alternative layouts are acceptable if they compile to the same semantic model.

---

## Authoring rules

| Rule | Guidance |
|------|----------|
| **1** | Prefer one action per file. |
| **2** | Prefer stable IDs over path-derived identity. |
| **3** | Prefer short predicates over deeply nested logic. |
| **4** | Prefer explicit blockers over implicit failure. |
| **5** | Prefer semantic effect descriptions over transport-level implementation details. |
| **6** | Prefer domain language over framework language. |
| **7** | Keep UI hints advisory, not authoritative. |

**Bad:** `invokeMutation`, `openModal`, `setFlag`

**Better:** `hand-off`, `publish`, `rollback`

Action availability must come from semantic evaluation, not only UI flags.

---

## Summary

Worken OS Semantic Protocol is a shared semantic layer for humans, agents, and runtimes.

It defines:

- domain objects
- actions
- actor eligibility
- action conditions
- explicit blockers
- semantic effects
- surface hints

Its core design choice is simple: **author semantics as action cards, compile them into runtime truth**. That gives Worken OS a path to consistent action availability, explainable interfaces, and cross-surface operational meaning without forcing humans to author low-level policy logic directly.

The intended end state is **one stack**: Worken OS shipped and run with its operational meaning expressed in this protocol—not a separate rules engine for the product and another for everyone else.
