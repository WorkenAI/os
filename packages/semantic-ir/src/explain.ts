import type { EvaluationInput } from "@worken/semantic-core";
import { evaluatePredicate } from "@worken/semantic-core";
import type { SemanticIR } from "./model.js";

export interface ExplainActionInput {
	actionId: string;
	/** When set, policy must list this role or have empty subjects */
	roleId?: string;
	subject: Record<string, unknown>;
	object: Record<string, unknown>;
	context?: Record<string, unknown>;
}

export interface ExplainActionResult {
	allowed: boolean;
	reason: string;
	actionId: string;
	policyId?: string;
}

function evalInput(input: ExplainActionInput): EvaluationInput {
	return input.context !== undefined
		? {
				subject: input.subject,
				object: input.object,
				context: input.context,
			}
		: { subject: input.subject, object: input.object };
}

/**
 * Explain allow/deny from compiled IR policies and action gates (read-only).
 */
export function explainAction(
	ir: SemanticIR,
	input: ExplainActionInput,
): ExplainActionResult {
	const action = ir.actions[input.actionId];
	if (!action) {
		return {
			allowed: false,
			reason: `Unknown action: ${input.actionId}`,
			actionId: input.actionId,
		};
	}

	const policyId = `policy.${input.actionId}.default`;
	const policy = ir.policies[policyId];
	const ei = evalInput(input);

	if (input.roleId !== undefined && policy) {
		const subs = policy.subjects;
		if (subs.length > 0 && !subs.includes(input.roleId)) {
			return {
				allowed: false,
				reason:
					policy.reasonTemplates?.deny ??
					`Role ${input.roleId} is not allowed for this action.`,
				actionId: input.actionId,
				policyId,
			};
		}
	}

	if (action.when !== undefined && !evaluatePredicate(action.when, ei)) {
		return {
			allowed: false,
			reason:
				policy?.reasonTemplates?.deny ??
				"Action precondition (when) is not satisfied.",
			actionId: input.actionId,
			policyId,
		};
	}

	if (policy?.when !== undefined && !evaluatePredicate(policy.when, ei)) {
		return {
			allowed: false,
			reason:
				policy.reasonTemplates?.deny ??
				"Policy precondition (when) is not satisfied.",
			actionId: input.actionId,
			policyId,
		};
	}

	return {
		allowed: true,
		reason:
			policy?.reasonTemplates?.allow ?? "Preconditions satisfied; action allowed.",
		actionId: input.actionId,
		policyId,
	};
}

export interface ListAllowedActionsInput {
	roleId?: string;
	subject: Record<string, unknown>;
	object: Record<string, unknown>;
	context?: Record<string, unknown>;
}

/**
 * List action ids that would be allowed for the given evaluation context.
 */
export function listAllowedActions(
	ir: SemanticIR,
	input: ListAllowedActionsInput,
): string[] {
	const out: string[] = [];
	for (const actionId of Object.keys(ir.actions)) {
		const r = explainAction(ir, {
			actionId,
			...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
			subject: input.subject,
			object: input.object,
			...(input.context !== undefined ? { context: input.context } : {}),
		});
		if (r.allowed) {
			out.push(actionId);
		}
	}
	return out;
}
