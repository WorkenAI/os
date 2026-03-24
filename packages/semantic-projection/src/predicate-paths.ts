import type { PredicateExpr } from "@worken/semantic-core";

/** Collect object.* field paths referenced in a predicate (for projection edges). */
export function collectObjectFieldPaths(expr: PredicateExpr): string[] {
	const out: string[] = [];
	function walk(e: PredicateExpr): void {
		switch (e.op) {
			case "eq":
			case "exists": {
				const ref = e.op === "eq" ? e.left : e.value;
				if (ref.scope === "object" && ref.path) {
					out.push(ref.path);
				}
				break;
			}
			case "and":
			case "or":
				for (const a of e.args) {
					walk(a);
				}
				break;
			case "not":
				walk(e.arg);
				break;
			default: {
				const _x: never = e;
				void _x;
			}
		}
	}
	walk(expr);
	return [...new Set(out)];
}
