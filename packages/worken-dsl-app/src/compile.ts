import type { ProcessDomainBridge, WorkspaceDefinition } from '@worken/dsl'
import type { BusinessProcessDefinition, ProcessId } from '@worken/dsl'
import type { ProcessUiDefinition } from '@worken/dsl'
import type { UiWidgetRegion } from '@worken/dsl'
import type { WorkspaceDomainBridge } from '@worken/dsl'
import { assertValidProcess, assertValidWorkspace } from '@worken/dsl'
import type { WorkenAppDefinition } from './types.js'

export type CompiledWorkenApp = {
  definition: WorkenAppDefinition
  workspace: WorkspaceDefinition
  bridges: WorkspaceDomainBridge
  /** Process id → emitted shapes (for tooling / tests). */
  byProcess: Record<
    ProcessId,
    {
      process: BusinessProcessDefinition
      ui: ProcessUiDefinition
      bridge?: ProcessDomainBridge
    }
  >
}

function compileProcess(processKey: string, p: WorkenAppDefinition['processes'][string]) {
  if (p.id !== processKey) {
    throw new Error(
      `Worken process key "${processKey}" must equal process.id "${p.id}" (single source of truth).`,
    )
  }

  const nodes: BusinessProcessDefinition['nodes'] = {}
  for (const [stateId, s] of Object.entries(p.states)) {
    nodes[stateId] = {
      id: stateId,
      kind: s.kind,
      label: s.label,
      ...(s.description !== undefined ? { description: s.description } : {}),
      ...(s.tag !== undefined ? { tag: s.tag } : {}),
      ...(s.actor !== undefined ? { actor: s.actor } : {}),
    }
  }

  const events: BusinessProcessDefinition['events'] = {}
  for (const [eventId, e] of Object.entries(p.events)) {
    events[eventId] = {
      id: eventId,
      label: e.label,
      ...(e.description !== undefined ? { description: e.description } : {}),
    }
  }

  const process: BusinessProcessDefinition = {
    id: p.id,
    version: p.version,
    title: p.title,
    ...(p.description !== undefined ? { description: p.description } : {}),
    initial: p.initial,
    nodes,
    transitions: p.transitions,
    events,
    ...(p.actors !== undefined ? { actors: p.actors } : {}),
  }

  const mapSurface = (s: (typeof p.ui.surfaces)[number]): ProcessUiDefinition['surfaces'][number] => ({
    matchStateId: s.matchStateId === '*' ? '*' : s.matchStateId,
    ...(s.title !== undefined ? { title: s.title } : {}),
    view: {
      kind: s.view.kind,
      ...(s.view.specId !== undefined ? { specId: s.view.specId } : {}),
      ...(s.view.entityId !== undefined ? { entityId: s.view.entityId } : {}),
    },
    ...(s.layoutId !== undefined ? { layoutId: s.layoutId } : {}),
    ...(s.widgets !== undefined
      ? {
          widgets: s.widgets.map((w) => ({
            id: w.id,
            region: w.region as UiWidgetRegion,
            ...(w.order !== undefined ? { order: w.order } : {}),
          })),
        }
      : {}),
  })

  const ui: ProcessUiDefinition = {
    processId: p.id,
    surfaces: p.ui.surfaces.map(mapSurface),
  }
  if (p.ui.byRole !== undefined) {
    ui.byRole = Object.fromEntries(
      Object.entries(p.ui.byRole).map(([role, surfaces]) => [
        role,
        (surfaces ?? []).map(mapSurface),
      ]),
    ) as NonNullable<ProcessUiDefinition['byRole']>
  }

  let bridge: ProcessDomainBridge | undefined
  if (p.bridge !== undefined) {
    bridge = {
      processId: p.id,
      domainId: p.bridge.domainId,
      ...(p.bridge.stateToViewId !== undefined ? { stateToViewId: p.bridge.stateToViewId } : {}),
      ...(p.bridge.fallbackViewId !== undefined ? { fallbackViewId: p.bridge.fallbackViewId } : {}),
    }
  }

  return { process, ui, bridge }
}

/**
 * Compile a single-entry {@link WorkenAppDefinition} into `@worken/dsl` types.
 * Validates each process graph and workspace consistency.
 */
export function compileWorkenApp(def: WorkenAppDefinition): CompiledWorkenApp {
  const processes: WorkspaceDefinition['processes'] = {}
  const processUi: WorkspaceDefinition['processUi'] = {}
  const bridgeProcesses: WorkspaceDomainBridge['processes'] = {}
  const byProcess: CompiledWorkenApp['byProcess'] = {}

  for (const [key, proc] of Object.entries(def.processes)) {
    const compiled = compileProcess(key, proc)
    assertValidProcess(compiled.process)
    processes[compiled.process.id] = compiled.process
    processUi[compiled.process.id] = compiled.ui
    if (compiled.bridge !== undefined) {
      bridgeProcesses[compiled.process.id] = compiled.bridge
    }
    byProcess[compiled.process.id] = {
      process: compiled.process,
      ui: compiled.ui,
      ...(compiled.bridge !== undefined ? { bridge: compiled.bridge } : {}),
    }
  }

  const workspace: WorkspaceDefinition = {
    id: def.id,
    title: def.title,
    ...(def.version !== undefined ? { version: def.version } : {}),
    processes,
    processUi,
  }

  assertValidWorkspace(workspace)

  const bridges: WorkspaceDomainBridge =
    Object.keys(bridgeProcesses).length > 0 ? { processes: bridgeProcesses } : { processes: {} }

  return {
    definition: def,
    workspace,
    bridges,
    byProcess,
  }
}
