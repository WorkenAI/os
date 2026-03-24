import type { SemanticRelation, SemanticSource } from "./model.js";

/**
 * Merge semantic sources. Later sources override nodes with the same id.
 * Relations are merged by id; later wins.
 */
export function mergeSemanticSources(
	...sources: SemanticSource[]
): SemanticSource {
	if (sources.length === 0) {
		return { protocolVersion: "0.1.0", nodes: [] };
	}
	const protocolVersion =
		sources[sources.length - 1]?.protocolVersion ?? "0.1.0";
	const byId = new Map<string, SemanticSource["nodes"][number]>();
	for (const n of sources[0]?.nodes ?? []) {
		byId.set(n.id, n);
	}
	for (let i = 1; i < sources.length; i++) {
		const s = sources[i];
		if (!s) {
			continue;
		}
		for (const n of s.nodes) {
			byId.set(n.id, n);
		}
	}
	const relById = new Map<string, SemanticRelation>();
	for (const s of sources) {
		for (const r of s.relations ?? []) {
			relById.set(r.id, r);
		}
	}
	return {
		protocolVersion,
		nodes: [...byId.values()],
		relations: [...relById.values()],
	};
}
