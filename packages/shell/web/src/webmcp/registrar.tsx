'use client'

import { useRouter } from 'next/navigation'
import { type MutableRefObject, useEffect, useMemo, useRef } from 'react'
import { DOMAIN_MANIFESTS } from '@worken/ir/domains/registry'
import { useShell } from '@worken/shell-web/machines/context'
import { usePermissions } from '@worken/shell-web/permissions/context'
import { useShellSession } from '@worken/shell-web/session/context'
import {
  createWorkenOsToolGenerationSnapshot,
  type GeneratedWorkenOsTool,
  generateWorkenOsTools,
  type WorkenOsToolGenerationSnapshot,
} from './generator'
import {
  getBrowserModelContext,
  type RegisteredWebMcpTool,
  type WebMcpModelContextClient,
  type WebMcpToolResult,
} from './types'

type ToolRuntimeState = {
  currentRoleName: string
  status: string
  domainId: string | null
  domainTitle: string | null
  activeViewId: string | null
  activeViewTitle: string | null
  breadcrumbs: string[]
  inspectorTarget: { entityType: string; id: string } | null
  accessibleDomains: WorkenOsToolGenerationSnapshot['accessibleDomains']
  currentDomainCapabilities: WorkenOsToolGenerationSnapshot['currentDomain']
  openDomain: (domainId: string) => void
  openView: (viewId: string) => Promise<void>
  executeVerb: (verbId: string, entityType?: string) => Promise<void>
  openInspector: (target: { entityType: string; id: string }) => void
  sendMessage: (text: string) => Promise<void>
}

type RegisteredSignatureMap = Map<string, string>

export function WorkenOsWebMcpRegistrar() {
  const router = useRouter()
  const { state } = useShell()
  const {
    activeView,
    canAccessCurrentDomain,
    domain,
    executeSidebarAction,
    navigateToSpec,
    openInspector,
    sendMessage,
    status,
    viewTitle,
  } = useShellSession()
  const { canAccessDomain, canExecuteVerb, canSeeEntity, canSeeSidebarItem, currentRole } =
    usePermissions()

  const accessibleDomains = useMemo(
    () => DOMAIN_MANIFESTS.filter((candidate) => canAccessDomain(candidate.id)),
    [canAccessDomain],
  )

  const snapshot = useMemo(
    () =>
      createWorkenOsToolGenerationSnapshot({
        currentRoleName: currentRole.name,
        accessibleDomains,
        currentDomain: canAccessCurrentDomain ? domain : null,
        activeViewId: activeView,
        canSeeSidebarItem,
        canSeeEntity,
        canExecuteVerb,
      }),
    [
      activeView,
      accessibleDomains,
      canAccessCurrentDomain,
      canExecuteVerb,
      canSeeEntity,
      canSeeSidebarItem,
      currentRole.name,
      domain,
    ],
  )

  const generatedTools = useMemo(() => generateWorkenOsTools(snapshot), [snapshot])
  const registeredSignaturesRef = useRef<RegisteredSignatureMap>(new Map())
  const snapshotRef = useRef(snapshot)
  const runtimeRef = useRef<ToolRuntimeState>({
    currentRoleName: currentRole.name,
    status,
    domainId: domain?.id ?? null,
    domainTitle: domain?.title ?? null,
    activeViewId: activeView,
    activeViewTitle: viewTitle,
    breadcrumbs: state.breadcrumbs,
    inspectorTarget: state.inspectorTarget,
    accessibleDomains: snapshot.accessibleDomains,
    currentDomainCapabilities: snapshot.currentDomain,
    openDomain: (domainId) => router.push(`/${domainId}`),
    openView: navigateToSpec,
    executeVerb: async (verbId, entityType) => {
      await executeSidebarAction({ verb: verbId, entityType })
    },
    openInspector,
    sendMessage,
  })

  useEffect(() => {
    snapshotRef.current = snapshot
    runtimeRef.current = {
      currentRoleName: currentRole.name,
      status,
      domainId: domain?.id ?? null,
      domainTitle: domain?.title ?? null,
      activeViewId: activeView,
      activeViewTitle: viewTitle,
      breadcrumbs: state.breadcrumbs,
      inspectorTarget: state.inspectorTarget,
      accessibleDomains: snapshot.accessibleDomains,
      currentDomainCapabilities: snapshot.currentDomain,
      openDomain: (domainId) => router.push(`/${domainId}`),
      openView: navigateToSpec,
      executeVerb: async (verbId, entityType) => {
        await executeSidebarAction({ verb: verbId, entityType })
      },
      openInspector,
      sendMessage,
    }
  }, [
    activeView,
    currentRole.name,
    domain?.id,
    domain?.title,
    executeSidebarAction,
    navigateToSpec,
    openInspector,
    router,
    sendMessage,
    snapshot,
    state.breadcrumbs,
    state.inspectorTarget,
    status,
    viewTitle,
  ])

  useEffect(() => {
    const modelContext = getBrowserModelContext()
    if (!modelContext) return

    const nextSignatures = new Map(
      generatedTools.map((tool) => [tool.name, JSON.stringify(normalizeToolSignature(tool))]),
    )
    const registeredSignatures = registeredSignaturesRef.current

    for (const name of [...registeredSignatures.keys()]) {
      if (nextSignatures.has(name)) continue

      safelyUnregisterTool(modelContext, name)
      registeredSignatures.delete(name)
    }

    for (const tool of generatedTools) {
      const nextSignature = nextSignatures.get(tool.name)
      if (!nextSignature) continue

      if (registeredSignatures.get(tool.name) === nextSignature) continue

      if (registeredSignatures.has(tool.name)) {
        safelyUnregisterTool(modelContext, tool.name)
      }

      modelContext.registerTool(toRegisteredTool(tool, runtimeRef, snapshotRef))
      registeredSignatures.set(tool.name, nextSignature)
    }
  }, [generatedTools])

  useEffect(() => {
    return () => {
      const modelContext = getBrowserModelContext()
      if (!modelContext) return

      for (const name of registeredSignaturesRef.current.keys()) {
        safelyUnregisterTool(modelContext, name)
      }

      registeredSignaturesRef.current.clear()
    }
  }, [])

  return null
}

function normalizeToolSignature(tool: GeneratedWorkenOsTool) {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema ?? null,
    annotations: tool.annotations ?? null,
    action: tool.action,
  }
}

function toRegisteredTool(
  tool: GeneratedWorkenOsTool,
  runtimeRef: MutableRefObject<ToolRuntimeState>,
  snapshotRef: MutableRefObject<WorkenOsToolGenerationSnapshot>,
): RegisteredWebMcpTool {
  return {
    name: tool.name,
    description: tool.description,
    ...(tool.inputSchema ? { inputSchema: tool.inputSchema } : {}),
    ...(tool.annotations ? { annotations: tool.annotations } : {}),
    execute: async (input, client) =>
      executeGeneratedTool(tool, input, client, runtimeRef.current, snapshotRef.current),
  }
}

async function executeGeneratedTool(
  tool: GeneratedWorkenOsTool,
  input: Record<string, unknown>,
  client: WebMcpModelContextClient,
  runtime: ToolRuntimeState | null,
  snapshot: WorkenOsToolGenerationSnapshot | null,
): Promise<WebMcpToolResult> {
  if (!runtime || !snapshot) {
    return createToolResult('Worken OS WebMCP runtime is unavailable.', {
      status: 'unavailable',
    })
  }

  switch (tool.action.kind) {
    case 'get_context':
      return createToolResult('Read the current Worken OS shell context.', {
        roleName: runtime.currentRoleName,
        status: runtime.status,
        domainId: runtime.domainId,
        domainTitle: runtime.domainTitle,
        activeViewId: runtime.activeViewId,
        activeViewTitle: runtime.activeViewTitle,
        breadcrumbs: runtime.breadcrumbs,
        inspectorTarget: runtime.inspectorTarget,
      })
    case 'list_domains':
      return createToolResult('Listed accessible Worken OS domains.', {
        roleName: snapshot.currentRoleName,
        domains: snapshot.accessibleDomains,
      })
    case 'list_current_domain_capabilities':
      return createToolResult('Listed visible capabilities in the current Worken OS domain.', {
        roleName: snapshot.currentRoleName,
        currentDomain: snapshot.currentDomain,
      })
    case 'open_domain': {
      const domainId = tool.action.domainId ?? readRequiredString(input, 'domainId')
      if (!domainId) {
        return createToolResult('Cannot open a domain because no domain id was provided.', {
          status: 'invalid_input',
        })
      }

      runtime.openDomain(domainId)
      return createToolResult(`Opened the ${domainId} domain in Worken OS.`, { domainId })
    }
    case 'open_view': {
      const viewId = tool.action.viewId ?? readRequiredString(input, 'viewId')
      if (!viewId) {
        return createToolResult('Cannot open a view because no view id was provided.', {
          status: 'invalid_input',
        })
      }

      await runtime.openView(viewId)
      return createToolResult(`Opened the ${viewId} view in Worken OS.`, {
        domainId: runtime.domainId,
        viewId,
      })
    }
    case 'execute_verb': {
      const verbId = tool.action.verbId ?? readRequiredString(input, 'verbId')
      if (!verbId) {
        return createToolResult('Cannot execute an action because no verb id was provided.', {
          status: 'invalid_input',
        })
      }

      const entityType = tool.action.entityType ?? readOptionalString(input, 'entityType')
      const confirmed = await confirmToolExecution(
        client,
        `Run "${verbId}" in ${runtime.domainTitle ?? 'Worken OS'}?`,
      )

      if (!confirmed) {
        return createToolResult('The requested Worken OS action was cancelled by the user.', {
          status: 'cancelled',
          verbId,
          entityType,
        })
      }

      await runtime.executeVerb(verbId, entityType ?? undefined)
      return createToolResult(`Executed the ${verbId} action in Worken OS.`, {
        domainId: runtime.domainId,
        verbId,
        entityType: entityType ?? null,
      })
    }
    case 'open_inspector': {
      const entityType = readRequiredString(input, 'entityType')
      const id = readRequiredString(input, 'id')
      if (!entityType || !id) {
        return createToolResult('Cannot open the inspector because entityType or id is missing.', {
          status: 'invalid_input',
        })
      }

      runtime.openInspector({ entityType, id })
      return createToolResult(`Opened ${entityType} ${id} in the Worken OS inspector.`, {
        entityType,
        id,
      })
    }
    case 'send_message': {
      const text = readRequiredString(input, 'text')
      if (!text) {
        return createToolResult('Cannot send a message because no text was provided.', {
          status: 'invalid_input',
        })
      }

      await runtime.sendMessage(text)
      return createToolResult('Sent a message to the Worken OS assistant.', {
        text,
        domainId: runtime.domainId,
        activeViewId: runtime.activeViewId,
      })
    }
  }
}

function createToolResult(text: string, structuredContent: unknown): WebMcpToolResult {
  return {
    content: [{ type: 'text', text }],
    structuredContent,
  }
}

async function confirmToolExecution(client: WebMcpModelContextClient, message: string) {
  if (typeof window === 'undefined') return false

  if (client.requestUserInteraction) {
    const result = await client.requestUserInteraction(() =>
      Promise.resolve(window.confirm(message)),
    )
    return Boolean(result)
  }

  return window.confirm(message)
}

function readRequiredString(input: Record<string, unknown>, key: string) {
  const value = input[key]
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readOptionalString(input: Record<string, unknown>, key: string) {
  const value = input[key]
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function safelyUnregisterTool(
  modelContext: NonNullable<ReturnType<typeof getBrowserModelContext>>,
  name: string,
) {
  try {
    modelContext.unregisterTool(name)
  } catch {
    // Ignore stale registrations during reconciliation.
  }
}
