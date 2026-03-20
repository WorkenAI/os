# Worken OS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Worken OS is a place where humans and AI work together.

Under the hood, it is an operational model that ties together interaction surfaces, external systems, semantic interpretation, durable workflows, and domain policy around a single runtime object: **WorkSession**.

## Architecture (overview)

```mermaid
flowchart TB
    S[Surfaces] --> SA[Surface Adapters]
    E[External Systems] --> HA[System / Host Adapters]
    SA --> WS[WorkSession]
    HA --> WS
    WS --> SP[Semantic Protocol]
    WS --> WF[Workflow Runtime]
    WS --> DC[Domain Core<br/>Policies/State]
```

WorkSession is the hub: surfaces and host systems feed adapters, which update session state; semantics and workflows read that context, and the domain core enforces invariants and transitions.

## Architecture (detailed)

```mermaid
flowchart TB
    subgraph surfaces["Surfaces"]
        direction TB
        s1["Web Shell"]
        s2["Chat / Voice"]
        s3["Inbox / Review"]
        s4["Embedded Shell"]
    end

    subgraph external["External Systems"]
        direction TB
        e1["CRM / ERP"]
        e2["Email / Calendar"]
        e3["Telephony / Messengers"]
        e4["Other SaaS / APIs"]
    end

    subgraph surfAdapters["Surface Adapters"]
        direction TB
        sa1["render / input"]
        sa2["stream / reply"]
    end

    subgraph hostAdapters["System / Host Adapters"]
        direction TB
        ha1["sync / bridge"]
        ha2["auth / mounting"]
    end

    subgraph workSession["WorkSession"]
        direction TB
        ws1["actor • role • subject • ownership"]
        ws2["capabilities • current intent • pending action"]
        ws3["active surfaces • runtime context"]
    end

    subgraph semantic["Semantic Protocol"]
        direction TB
        sem1["subject/action/object"]
        sem2["commands / intents"]
    end

    subgraph workflow["Workflow / Execution"]
        direction TB
        wf1["durable process"]
        wf2["waits / timers / resume"]
    end

    subgraph domain["Domain Core"]
        direction TB
        d1["entities / policies"]
        d2["invariants / ownership"]
        d3["state transitions"]
    end

    surfaces -->|"user actions / UI events"| surfAdapters
    external -->|"webhooks / sync / host context"| hostAdapters
    surfAdapters --> workSession
    hostAdapters --> workSession
    workSession --> semantic
    workSession --> workflow
    semantic --> domain
    workflow --> domain
```

## Repository layout

| Path | Role |
|------|------|
| `apps/landing` | Next.js app (marketing / shell entrypoints) |
| `packages/tsconfig` | Shared TypeScript presets (`@worken/tsconfig`) |

## Development

**Prerequisites:** [Bun](https://bun.sh)

This repo is a [Turborepo](https://turbo.build/repo) monorepo. 

Install dependencies and run tasks from the repository root:

```bash
git clone https://github.com/WorkenAI/os.git
cd os
bun install
bun run dev
```

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first so we can align on direction and scope.

- Keep commits focused and messages descriptive.
- Run `bun run lint` and `bun run check-types` before submitting when you touch that app.
