import type {
	ActionNode,
	ObjectNode,
	SemanticNode,
	SemanticRelation,
} from "./model.js";

export class SemanticCompileError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SemanticCompileError";
	}
}

export function validateSemanticStructure(
	nodes: SemanticNode[],
	relations: SemanticRelation[],
): void {
	const byId = new Map(nodes.map((n) => [n.id, n] as const));

	for (const n of nodes) {
		switch (n.kind) {
			case "object": {
				const o = n as ObjectNode;
				const d = byId.get(o.domainId);
				if (!d || d.kind !== "domain") {
					throw new SemanticCompileError(
						`Object ${o.id}: domainId "${o.domainId}" must reference a domain node`,
					);
				}
				break;
			}
			case "action": {
				const a = n as ActionNode;
				const d = byId.get(a.domainId);
				if (!d || d.kind !== "domain") {
					throw new SemanticCompileError(
						`Action ${a.id}: domainId "${a.domainId}" must reference a domain node`,
					);
				}
				const o = byId.get(a.objectId);
				if (!o || o.kind !== "object") {
					throw new SemanticCompileError(
						`Action ${a.id}: objectId "${a.objectId}" must reference an object node`,
					);
				}
				for (const bid of a.blockedBy ?? []) {
					const b = byId.get(bid);
					if (!b || b.kind !== "blocker") {
						throw new SemanticCompileError(
							`Action ${a.id}: blockedBy id "${bid}" must reference a blocker node`,
						);
					}
				}
				for (const eid of a.effects ?? []) {
					const e = byId.get(eid);
					if (!e || e.kind !== "effect") {
						throw new SemanticCompileError(
							`Action ${a.id}: effects id "${eid}" must reference an effect node`,
						);
					}
				}
				for (const pid of a.projections ?? []) {
					const p = byId.get(pid);
					if (!p || p.kind !== "projection") {
						throw new SemanticCompileError(
							`Action ${a.id}: projections id "${pid}" must reference a projection node`,
						);
					}
				}
				if (a.bindingId !== undefined) {
					const b = byId.get(a.bindingId);
					if (!b || b.kind !== "binding") {
						throw new SemanticCompileError(
							`Action ${a.id}: bindingId "${a.bindingId}" must reference a binding node`,
						);
					}
				}
				break;
			}
			default:
				break;
		}
	}

	for (const r of relations) {
		if (r.kind === "blocked-by") {
			const to = byId.get(r.to);
			if (!to || to.kind !== "blocker") {
				throw new SemanticCompileError(
					`Relation ${r.id}: blocked-by target must be a blocker node`,
				);
			}
		}
	}
}
