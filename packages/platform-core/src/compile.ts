import type {
	PlatformGraph,
	PlatformNode,
	PlatformRelation,
	PlatformSource,
} from "./model.js";

function indexRelations(relations: PlatformRelation[]): {
	outgoing: Map<string, PlatformRelation[]>;
	incoming: Map<string, PlatformRelation[]>;
} {
	const outgoing = new Map<string, PlatformRelation[]>();
	const incoming = new Map<string, PlatformRelation[]>();
	for (const rel of relations) {
		if (!outgoing.has(rel.from)) {
			outgoing.set(rel.from, []);
		}
		outgoing.get(rel.from)?.push(rel);
		if (!incoming.has(rel.to)) {
			incoming.set(rel.to, []);
		}
		incoming.get(rel.to)?.push(rel);
	}
	return { outgoing, incoming };
}

export function compilePlatform(source: PlatformSource): PlatformGraph {
	const relations = source.relations ?? [];
	const byId = new Map<string, PlatformNode>();
	for (const n of source.nodes) {
		if (byId.has(n.id)) {
			throw new Error(`Duplicate platform node id: ${n.id}`);
		}
		byId.set(n.id, n);
	}
	for (const r of relations) {
		if (!byId.has(r.from) || !byId.has(r.to)) {
			throw new Error(
				`Platform relation ${r.id} references missing node(s): ${r.from} -> ${r.to}`,
			);
		}
	}
	const { outgoing, incoming } = indexRelations(relations);
	return {
		version: source.version,
		nodes: source.nodes,
		relations,
		byId,
		outgoing,
		incoming,
	};
}

export function relatedPlatformNodes(
	graph: PlatformGraph,
	nodeId: string,
): PlatformNode[] {
	const rels = graph.outgoing.get(nodeId) ?? [];
	const incoming = graph.incoming.get(nodeId) ?? [];
	const ids = new Set<string>();
	for (const r of rels) {
		ids.add(r.to);
	}
	for (const r of incoming) {
		ids.add(r.from);
	}
	ids.delete(nodeId);
	const out: PlatformNode[] = [];
	for (const id of ids) {
		const n = graph.byId.get(id);
		if (n) {
			out.push(n);
		}
	}
	return out;
}
