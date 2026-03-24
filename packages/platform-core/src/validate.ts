import type {
	FlowNode,
	InvariantNode,
	PlatformNode,
	PlatformRelation,
} from "./model.js";

export class PlatformCompileError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PlatformCompileError";
	}
}

export function validatePlatformStructure(
	nodes: PlatformNode[],
	relations: PlatformRelation[],
): void {
	const byId = new Map(nodes.map((n) => [n.id, n] as const));

	for (const n of nodes) {
		if (n.kind === "invariant") {
			const inv = n as InvariantNode;
			if (!inv.statement?.trim()) {
				throw new PlatformCompileError(
					`Invariant ${inv.id}: statement is required`,
				);
			}
		}
		if (n.kind === "flow") {
			const f = n as FlowNode;
			if (!f.steps?.length) {
				throw new PlatformCompileError(
					`Flow ${f.id}: at least one step is required`,
				);
			}
		}
	}

	for (const r of relations) {
		if (r.kind === "constrains") {
			const from = byId.get(r.from);
			if (!from || from.kind !== "invariant") {
				throw new PlatformCompileError(
					`Relation ${r.id}: constrains source must be an invariant node`,
				);
			}
		}
	}
}
