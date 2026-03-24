import type { LiteralValue, PredicateExpr, ValueRef } from "./model.js";

export type EvaluationInput = {
	subject: Record<string, unknown>;
	object: Record<string, unknown>;
} & ({ context: Record<string, unknown> } | { context?: never });

function getByPath(root: Record<string, unknown>, path: string): unknown {
	const parts = path.split(".").filter(Boolean);
	let cur: unknown = root;
	for (const p of parts) {
		if (cur === null || cur === undefined || typeof cur !== "object") {
			return undefined;
		}
		cur = (cur as Record<string, unknown>)[p];
	}
	return cur;
}

function resolveValue(ref: ValueRef, input: EvaluationInput): unknown {
	const contextBag = "context" in input ? input.context : {};
	const bag =
		ref.scope === "object"
			? input.object
			: ref.scope === "subject"
				? input.subject
				: contextBag;
	return getByPath(bag, ref.path);
}

export function evaluatePredicate(
	expr: PredicateExpr,
	input: EvaluationInput,
): boolean {
	switch (expr.op) {
		case "eq": {
			const left = resolveValue(expr.left, input);
			return deepEqual(left, expr.right);
		}
		case "exists": {
			const v = resolveValue(expr.value, input);
			return v !== undefined && v !== null;
		}
		case "and":
			return expr.args.every((a) => evaluatePredicate(a, input));
		case "or":
			return expr.args.some((a) => evaluatePredicate(a, input));
		case "not":
			return !evaluatePredicate(expr.arg, input);
		default: {
			const _exhaustive: never = expr;
			return _exhaustive;
		}
	}
}

function deepEqual(a: unknown, b: LiteralValue): boolean {
	if (a === b) {
		return true;
	}
	if (a === undefined || a === null) {
		return b === null;
	}
	return a === b;
}
