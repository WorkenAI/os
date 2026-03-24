import type { PlatformRelation, PlatformSource } from "./model.js";

/**
 * Merge platform sources. Later sources override nodes with the same id.
 * Relations are merged by id; later wins.
 */
export function mergePlatformSources(
	...sources: PlatformSource[]
): PlatformSource {
	if (sources.length === 0) {
		return { version: "0.1.0", nodes: [] };
	}
	const version = sources[sources.length - 1]?.version ?? "0.1.0";
	const byId = new Map<string, PlatformSource["nodes"][number]>();
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
	const relById = new Map<string, PlatformRelation>();
	for (const s of sources) {
		for (const r of s.relations ?? []) {
			relById.set(r.id, r);
		}
	}
	return {
		version,
		nodes: [...byId.values()],
		relations: [...relById.values()],
	};
}
