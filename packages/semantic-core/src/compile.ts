import type {
	ActionNode,
	BlockerNode,
	SemanticGraph,
	SemanticNode,
	SemanticRelation,
	SemanticSource,
} from "./model.js";
import type { EvaluationInput } from "./predicate.js";
import { evaluatePredicate } from "./predicate.js";
import { validateSemanticStructure } from "./validate.js";

function indexRelations(relations: SemanticRelation[]): {
	outgoing: Map<string, SemanticRelation[]>;
	incoming: Map<string, SemanticRelation[]>;
} {
	const outgoing = new Map<string, SemanticRelation[]>();
	const incoming = new Map<string, SemanticRelation[]>();
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

export function compileSemantic(source: SemanticSource): SemanticGraph {
	const relations = source.relations ?? [];
	const byId = new Map<string, SemanticNode>();
	for (const n of source.nodes) {
		if (byId.has(n.id)) {
			throw new Error(`Duplicate semantic node id: ${n.id}`);
		}
		byId.set(n.id, n);
	}
	for (const r of relations) {
		if (!byId.has(r.from) || !byId.has(r.to)) {
			throw new Error(
				`Semantic relation ${r.id} references missing node(s): ${r.from} -> ${r.to}`,
			);
		}
	}
	validateSemanticStructure(source.nodes, relations);
	const { outgoing, incoming } = indexRelations(relations);
	return {
		protocolVersion: source.protocolVersion,
		nodes: source.nodes,
		relations,
		byId,
		outgoing,
		incoming,
	};
}

function resolveBlockers(
	graph: SemanticGraph,
	actionNode: ActionNode,
): BlockerNode[] {
	const result: BlockerNode[] = [];
	const ids = actionNode.blockedBy ?? [];
	for (const bid of ids) {
		const node = graph.byId.get(bid);
		if (node?.kind === "blocker") {
			result.push(node);
		} else {
			throw new Error(
				`Action ${actionNode.id}: blockedBy id "${bid}" must reference a blocker node`,
			);
		}
	}
	if (result.length > 0) {
		return result;
	}
	const rels = graph.outgoing.get(actionNode.id) ?? [];
	for (const r of rels) {
		if (r.kind !== "blocked-by") {
			continue;
		}
		const node = graph.byId.get(r.to);
		if (node?.kind === "blocker") {
			result.push(node);
		}
	}
	return result;
}

export function evaluateAction(
	graph: SemanticGraph,
	input: {
		actionId: string;
		subject: Record<string, unknown>;
		object: Record<string, unknown>;
		context?: Record<string, unknown>;
	},
): {
	allowed: boolean;
	blockers: BlockerNode[];
} {
	const action = graph.byId.get(input.actionId);
	if (!action || action.kind !== "action") {
		return { allowed: false, blockers: [] };
	}
	const actionNode = action;
	const evalInput: EvaluationInput =
		input.context !== undefined
			? { subject: input.subject, object: input.object, context: input.context }
			: { subject: input.subject, object: input.object };
	const whenOk =
		actionNode.when === undefined
			? true
			: evaluatePredicate(actionNode.when, evalInput);
	if (!whenOk) {
		const blockers = resolveBlockers(graph, actionNode);
		return { allowed: false, blockers };
	}
	return { allowed: true, blockers: [] };
}
