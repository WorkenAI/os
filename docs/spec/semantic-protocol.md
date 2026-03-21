# Worken OS Semantic Protocol

## Status

Draft

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

The protocol describes **semantic availability and meaning**. Execution remains the responsibility of runtime handlers.

---

## Core idea

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

## Core concepts

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

- `task.status == ready`
- `task.assignee` exists
- `actor.id == task.ownerId`

Conditions are evaluated against runtime context.

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

## Minimal action schema

Each action definition SHOULD include the following fields:

- id
- domain
- object
- action
- roles
- when
- blocked
- effects
- ui

### Field meanings

#### `id`

Globally stable semantic identifier.

Example:

```yaml
id: operations.task.hand-off
```

#### `domain`

Domain name.

```yaml
domain: operations
```

#### `object`

Object type.

```yaml
object: task
```

#### `action`

Canonical action name.

```yaml
action: hand-off
```

#### `roles`

List of roles allowed to attempt the action.

```yaml
roles:
  - operator
  - maintainer
```

#### `when`

List of predicates that must hold for the action to be available.

```yaml
when:
  - task.status == ready
  - task.assignee exists
```

#### `blocked`

Explicit blockers for explainability.

```yaml
blocked:
  - code: wrong_status
    message: Task must be in ready status
  - code: missing_assignee
    message: Task must have an assignee
```

#### `effects`

Semantic outcomes of successful execution.

```yaml
effects:
  - transfer ownership
  - set task.updatedAt = now
```

#### `ui`

Surface projection hints.

```yaml
ui:
  label: Hand off
  priority: primary
  show_when_blocked: true
```

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
  - task.status == ready
  - task.assignee exists

blocked:
  - code: wrong_status
    message: Task must be in ready status
  - code: missing_assignee
    message: Task must have an assignee

effects:
  - transfer ownership
  - set task.updatedAt = now

ui:
  label: Hand off
  priority: primary
  show_when_blocked: true
---

# Hand off

Transfers responsibility for a ready task that already has an assignee.
````

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

## Explainability model

Explainability is a first-class part of the protocol.

A blocked action MUST be representable as structured output.

Example runtime projection:

```yaml
action: publish
status: blocked
reasons:
  - code: wrong_status
    message: Task must be in review status
  - code: missing_description
    message: Task must have a description
```

This enables:

- disabled buttons with reasons in web UI
- inline remediation in chat
- spoken explanations in voice UI
- better agent planning
- auditable decision traces

A system that knows an action is unavailable but cannot explain why is incomplete.

---

## Surface projections

The protocol must support multiple projections of the same semantic truth.

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
  - task.ownerId == actor.id
```

or

```yaml
when:
  - actor.role == maintainer
```

The protocol does not hardcode one ownership model. It only provides the semantic places where ownership predicates can be expressed.

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
- agent runtime

### 5. Execution bindings

References to runtime handlers or tool adapters.

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
