import { defineHook } from '@workflow/core'
import { z } from 'zod'

export const reviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_changes']),
  comment: z.string().trim().optional(),
})

export type ReviewDecisionPayload = z.infer<typeof reviewDecisionSchema>

export const leadReviewHook = defineHook({
  schema: reviewDecisionSchema,
})

export function createReviewToken(runId: string, stage: 'sales' | 'finance') {
  return `worken-os:${runId}:${stage}-review`
}
