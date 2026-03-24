# Worken OS — web app (`apps/web`)

Production Next.js app: **shell routes** (`/(shell)/[domain]`), **shell/session APIs** under `src/app/api/`, and **execution** code under `src/execution/`.

- **Server config:** compose `withWorkflow` from `@workflow/next` with `withWorkenOS` from `@worken/next-os` in `next.config.ts`.
- **Client:** `src/hooks/useOS.ts` — permissions + shell theme (requires `PermissionsProvider` + `ShellThemeProvider` in the root layout). For full shell chat/session, use `useShellSession()` inside routes wrapped by `ShellSessionProvider`.

Marketing / 3D demo landing lives in **`examples/landing-demo`** (separate Next app, default port **3001**).

See the repository root [`README.md`](../../README.md) for the monorepo overview.
