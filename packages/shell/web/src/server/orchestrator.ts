import type { Spec } from '@json-render/core'
import {
  buildLocalSurfaceAssistantText,
  getDomainViewSpecId,
  getViewLabel,
} from '@worken/ir/domains/manifest'
import { loadDomain } from '@worken/ir/domains/registry'
import { normalizeDomainSpec } from '@worken/ir/domains/spec-normalizer'
import type { PermissionSnapshot } from '@worken/shell-web/permissions/shared'
import {
  canAccessDomain,
  canExecuteEntityAction,
  canExecuteVerb,
  getAllowedViewId,
  getVisibleNavigation,
} from '@worken/shell-web/runtime/policy/selectors'
import { toReasoningEnvelope } from '@worken/shell-web/session/message-format'

type ShellStreamMode = 'bootstrap' | 'view' | 'user' | 'verb'

type StreamRequest = {
  domainId: string
  mode: ShellStreamMode
  activeView?: string
  specId?: string
  verb?: string
  entityType?: string
  ids?: string[]
  messages?: Array<{ role: string; content: string }>
  permissions: PermissionSnapshot | null
}

type StreamResponse = {
  text: string
  spec: Spec | null
  stageRootChildren?: boolean
  stepDelayMs?: number
}

function resolveSpec(domain: Awaited<ReturnType<typeof loadDomain>>, viewId: string | null) {
  if (!viewId) {
    return {
      viewId: null,
      specId: null,
      spec: null as Spec | null,
    }
  }

  const specId = getDomainViewSpecId(domain, viewId)
  const normalizedSpec = specId ? normalizeDomainSpec(domain.specs[specId] ?? null) : null
  return {
    viewId,
    specId,
    spec: normalizedSpec,
  }
}

function findViewIdFromPrompt(
  domain: Awaited<ReturnType<typeof loadDomain>>,
  permissions: PermissionSnapshot | null,
  prompt: string,
  activeView?: string | null,
) {
  const normalizedPrompt = prompt.toLowerCase()
  const visibleViews = getVisibleNavigation(domain, permissions)

  const matchedView =
    visibleViews.find(
      (item) =>
        normalizedPrompt.includes(item.label.toLowerCase()) ||
        normalizedPrompt.includes(item.viewId.toLowerCase()),
    ) ?? null

  return matchedView?.viewId ?? activeView ?? getAllowedViewId(domain, permissions)
}

function buildLocalSurfaceText(
  domain: Awaited<ReturnType<typeof loadDomain>>,
  prompt: string,
  activeView?: string | null,
) {
  return buildLocalSurfaceAssistantText(domain, prompt, activeView)
}

async function buildBootstrapResponse(
  domain: Awaited<ReturnType<typeof loadDomain>>,
  permissions: PermissionSnapshot | null,
): Promise<StreamResponse> {
  const preferredViewId = getAllowedViewId(domain, permissions)
  const preferredSpec = resolveSpec(domain, preferredViewId)
  const visibleLabels = getVisibleNavigation(domain, permissions)
    .slice(0, 3)
    .map((item) => item.label)
    .join(', ')

  const reasoning = toReasoningEnvelope({
    title: `Connecting to ${domain.title}`,
    body: [
      `Spinning up working context for ${domain.title}.`,
      preferredSpec.spec
        ? 'Selecting a starting surface and allowed actions for the current role.'
        : 'Checking available sections and restrictions for the current role.',
      visibleLabels
        ? `Available starter sections: ${visibleLabels}.`
        : 'No visible sections for this role.',
    ].join('\n'),
  })

  if (!canAccessDomain(permissions, domain.id)) {
    return {
      text: `${reasoning}\n\nDomain ${domain.title} is not available for the current role. Open Admin and adjust permissions.`,
      spec: null,
    }
  }

  if (!preferredSpec.viewId || !preferredSpec.spec) {
    return {
      text: `${reasoning}\n\n${domain.title} context is connected, but there are no renderable surfaces.`,
      spec: null,
    }
  }

  return {
    text: `${reasoning}\n\nCurrent snapshot in ${domain.title}:`,
    spec: preferredSpec.spec,
    stageRootChildren: true,
    stepDelayMs: 260,
  }
}

async function buildViewResponse(
  domain: Awaited<ReturnType<typeof loadDomain>>,
  permissions: PermissionSnapshot | null,
  requestedViewId?: string,
): Promise<StreamResponse> {
  const viewId = getAllowedViewId(domain, permissions, requestedViewId)
  const resolved = resolveSpec(domain, viewId)
  const label = getViewLabel(domain, viewId)

  if (!requestedViewId || requestedViewId === viewId) {
    if (!resolved.viewId || !resolved.specId || !resolved.spec) {
      return {
        text: `Could not open the section. Domain ${domain.title} has no allowed views for the current role.`,
        spec: null,
      }
    }

    return {
      text: `Opening ${label} in ${domain.title}.`,
      spec: resolved.spec,
    }
  }

  return {
    text: `Section ${requestedViewId} is not available for the current role. Opening the nearest allowed section: ${label}.`,
    spec: resolved.spec,
  }
}

async function buildUserResponse(
  domain: Awaited<ReturnType<typeof loadDomain>>,
  permissions: PermissionSnapshot | null,
  prompt: string,
  activeView?: string | null,
): Promise<StreamResponse> {
  const viewId = findViewIdFromPrompt(domain, permissions, prompt, activeView)
  const resolved = resolveSpec(domain, viewId)
  const label = getViewLabel(domain, viewId)

  if (resolved.viewId && !resolved.specId && !resolved.spec) {
    return {
      text: buildLocalSurfaceText(domain, prompt, viewId),
      spec: null,
    }
  }

  if (!resolved.viewId || !resolved.specId || !resolved.spec) {
    return {
      text: `Processed "${prompt}", but there is no available working surface in ${domain.title} for the current role.`,
      spec: null,
    }
  }

  return {
    text: `Handling "${prompt}" in ${domain.title}. Showing the most relevant section: ${label}.`,
    spec: resolved.spec,
  }
}

async function buildVerbResponse(
  domain: Awaited<ReturnType<typeof loadDomain>>,
  permissions: PermissionSnapshot | null,
  input: { verb?: string; entityType?: string; ids?: string[]; activeView?: string | null },
): Promise<StreamResponse> {
  if (!input.verb || !input.entityType) {
    return {
      text: `Could not run the action in ${domain.title}: missing operation context.`,
      spec: null,
    }
  }

  const isAllowed =
    canExecuteVerb(permissions, domain.id, input.verb) ||
    canExecuteEntityAction(permissions, domain.id, input.entityType, input.verb)

  if (!isAllowed) {
    return {
      text: `Action "${input.verb}" is not allowed for the current role in ${domain.title}.`,
      spec: null,
    }
  }

  const resolved = resolveSpec(domain, getAllowedViewId(domain, permissions, input.activeView))

  return {
    text: `Running "${input.verb}" on ${input.entityType}${input.ids?.length ? ` (${input.ids.join(', ')})` : ''}. Refreshing the working surface.`,
    spec: resolved.spec,
  }
}

export async function buildShellStreamResponse(request: StreamRequest): Promise<StreamResponse> {
  const domain = await loadDomain(request.domainId)

  if (request.mode === 'bootstrap') {
    return buildBootstrapResponse(domain, request.permissions)
  }

  if (!canAccessDomain(request.permissions, domain.id)) {
    return {
      text: `Domain ${domain.title} is not available for the current role.`,
      spec: null,
    }
  }

  switch (request.mode) {
    case 'view':
      return buildViewResponse(domain, request.permissions, request.specId)
    case 'verb':
      return buildVerbResponse(domain, request.permissions, {
        verb: request.verb,
        entityType: request.entityType,
        ids: request.ids,
        activeView: request.activeView,
      })
    case 'user': {
      const prompt = request.messages?.at(-1)?.content?.trim() ?? ''
      return buildUserResponse(domain, request.permissions, prompt, request.activeView)
    }
    default:
      return {
        text: 'Unknown stream mode.',
        spec: null,
      }
  }
}
