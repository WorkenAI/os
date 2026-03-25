/**
 * Intentional layering for `@worken/dsl`. Host apps may use only a subset; web-shell
 * wires **semantic runtime** (layer 4) in `shell/server/semantic` (after `resolveShellSession`)
 * + optional **shell bridge** (layer 5).
 *
 * 1. **Process graph** — `BusinessProcessDefinition`: states, transitions, events, actors.
 * 2. **Process UI** — `ProcessUiDefinition`: surfaces per state, optional role overlays.
 * 3. **Workspace** — `WorkspaceDefinition`: bundles processes + their UI skins.
 * 4. **Semantic protocol runtime** — `EvaluationContext`, `seedSemanticState`, data bindings,
 *    `buildEnrichedSpec` / `$semantic` → json-render `$state` (aligns with `docs/spec/semantic-protocol.md`).
 * 5. **Shell bridge** — `ProcessDomainBridge`: maps process state → shell `domainId` / view ids.
 *
 * Domain **surface** manifest (entities, verbs, views, navigation) remains in the host (`DomainDefinition`
 * in demo data / web-shell) until a single manifest compiles into both process and semantic graphs.
 */
export const DslLayer = {
	processGraph: "process-graph",
	processUi: "process-ui",
	workspaceBundle: "workspace",
	semanticProtocolRuntime: "semantic-protocol-runtime",
	shellDomainBridge: "shell-domain-bridge",
} as const;

export type DslLayerId = (typeof DslLayer)[keyof typeof DslLayer];
