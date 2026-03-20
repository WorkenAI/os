export function buildChatRouteUrl(domainId: string | null, activeView: string | null) {
  const params = new URLSearchParams()
  if (domainId) params.set('domainId', domainId)
  if (activeView) params.set('activeView', activeView)
  return `/api/chat?${params.toString()}`
}

export function buildExecutionRunsUrl(params: {
  signalType: string
  domainId: string
  viewId: string
  autoStart?: boolean
}) {
  const query = new URLSearchParams({
    signalType: params.signalType,
    domainId: params.domainId,
    viewId: params.viewId,
  })
  if (typeof params.autoStart === 'boolean') {
    query.set('autoStart', String(params.autoStart))
  }
  return `/api/shell/execution/runs?${query.toString()}`
}

export function buildExecutionRunUrl(runId: string, domainId: string) {
  return `/api/shell/execution/runs/${runId}?${new URLSearchParams({ domainId }).toString()}`
}

export function buildExecutionCheckpointUrl(token: string) {
  return `/api/shell/execution/checkpoints/${encodeURIComponent(token)}`
}

export function buildExecutionPolicyUrl(signalType: string) {
  return `/api/shell/execution/policy?${new URLSearchParams({ signalType }).toString()}`
}

export async function parseJsonError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string }
    return payload.error ?? `HTTP error: ${response.status}`
  } catch {
    return `HTTP error: ${response.status}`
  }
}
