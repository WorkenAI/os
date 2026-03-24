import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { getDomainViewExecution } from '@worken/ir/domains/manifest'
import { loadDomain } from '@worken/ir/domains/registry'
import {
  applyExecutionVerb,
  ensureExecutionRun,
  getExecutionCaseForView,
} from '@/execution/service'
import type { ExecutionProjectionBlock } from '@/execution/types'
import {
  ACTIVE_ROLE_COOKIE,
  SHELL_SESSION_COOKIE,
  toPermissionSnapshot,
} from '@worken/shell-web/permissions/shared'
import { getActiveRoleIdFromCookie, getShellSessionIdFromCookie } from '@worken/shell-web/server/auth/session'
import { buildShellStreamResponse } from '@worken/shell-web/server/orchestrator'
import { resolveShellSession } from '@worken/shell-web/server/session/service'
import { createShellStream } from '@worken/shell-web/server/stream'
import { toReasoningEnvelope } from '@worken/shell-web/session/message-format'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

type ChatRouteBody = {
  mode?: 'bootstrap' | 'view' | 'user' | 'verb'
  specId?: string
  verb?: string
  entityType?: string
  ids?: string[]
  messages?: Array<{ role: string; content: string }>
}

type SpecProjectionBlock = Extract<ExecutionProjectionBlock, { type: 'spec' }>
type TextProjectionBlock = Extract<ExecutionProjectionBlock, { type: 'text' }>

function toExecutionText(input: {
  mode: ChatRouteBody['mode']
  domainLabel: string
  summary?: string
  body?: string
}) {
  const title =
    input.mode === 'verb'
      ? `Updating execution in ${input.domainLabel}`
      : input.mode === 'user'
        ? `Reviewing execution in ${input.domainLabel}`
        : `Connecting execution in ${input.domainLabel}`

  const body = [input.summary, input.body].filter(Boolean).join('\n\n')
  return `${toReasoningEnvelope({ title, body: body || 'Loading durable execution state.' })}`
}

function createJsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ChatRouteBody
  const domainId = request.nextUrl.searchParams.get('domainId')
  const activeView = request.nextUrl.searchParams.get('activeView') ?? undefined

  if (!domainId) {
    return createJsonError('Missing domainId')
  }

  const cookieStore = await cookies()
  const runtimeSession = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: request.headers,
  })
  const permissions = toPermissionSnapshot(runtimeSession.currentRole)
  const mode = body.mode ?? (Array.isArray(body.messages) ? 'user' : 'bootstrap')

  try {
    const domain = await loadDomain(domainId)
    const execution = getDomainViewExecution(domain, activeView)

    if (execution) {
      const caseRecord =
        mode === 'verb' && body.verb
          ? await applyExecutionVerb({
              signalType: execution.signalType,
              domainId,
              viewId: activeView ?? domain.surfaces.defaultViewId,
              verb: body.verb,
              session: runtimeSession.shellSession,
            })
          : mode === 'bootstrap' || mode === 'view' || mode === 'user'
            ? await ensureExecutionRun({
                signalType: execution.signalType,
                domainId,
                viewId: activeView ?? domain.surfaces.defaultViewId,
                autoStart: execution.autoStart ?? false,
                session: runtimeSession.shellSession,
              })
            : await getExecutionCaseForView({
                signalType: execution.signalType,
                domainId,
                session: runtimeSession.shellSession,
              })

      const specBlock = caseRecord?.projection.blocks.find(
        (block): block is SpecProjectionBlock => block.type === 'spec',
      )
      const textBlock = caseRecord?.projection.blocks.find(
        (block): block is TextProjectionBlock => block.type === 'text',
      )

      return new Response(
        createShellStream(async (writer) => {
          await writer.text(
            toExecutionText({
              mode,
              domainLabel: domain.title,
              summary: caseRecord?.projection.summary,
              body: textBlock?.type === 'text' ? textBlock.text : undefined,
            }),
          )

          if (specBlock?.type === 'spec') {
            await writer.pause(120)
            await writer.spec(specBlock.spec as never, {
              stageRootChildren: true,
              stepDelayMs: 220,
            })
          }
        }),
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
          },
        },
      )
    }

    const response = await buildShellStreamResponse({
      domainId,
      mode,
      activeView,
      specId: body.specId,
      verb: body.verb,
      entityType: body.entityType,
      ids: body.ids,
      messages: body.messages,
      permissions,
    })

    return new Response(
      createShellStream(async (writer) => {
        if (response.text) {
          await writer.text(response.text)
          await writer.pause(160)
        }

        if (response.spec) {
          await writer.spec(response.spec, {
            stageRootChildren: response.stageRootChildren,
            stepDelayMs: response.stepDelayMs,
          })
        }
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown shell stream error'
    return createJsonError(message, 500)
  }
}
