import type { SemanticIR } from "@worken/semantic-ir";
import { collectObjectFieldPaths } from "./predicate-paths.js";
import type {
	ProjectionEdge,
	ProjectionFocus,
	ProjectionFocusKind,
	ProjectionModel,
	ProjectionNarrative,
	ProjectionNode,
} from "./projection-model.js";
import type { SemanticSlice } from "./slice.js";

function nodeIdForField(entityId: string, path: string): string {
	return `field:${entityId}.${path}`;
}

export interface BuildProjectionOptions {
	narrative?: {
		purpose?: string;
		nextSteps?: string[];
	};
}

function buildNodesFromSlice(
	ir: SemanticIR,
	slice: SemanticSlice,
): ProjectionNode[] {
	const nodes: ProjectionNode[] = [];
	const seen = new Set<string>();

	for (const id of slice.nodeIds) {
		if (seen.has(id)) {
			continue;
		}
		if (id.startsWith("workflow:")) {
			const w = id.slice("workflow:".length);
			nodes.push({
				id,
				kind: "workflow",
				title: w,
			});
			seen.add(id);
			continue;
		}
		if (id.startsWith("tool:")) {
			const t = id.slice("tool:".length);
			nodes.push({
				id,
				kind: "tool",
				title: t,
			});
			seen.add(id);
			continue;
		}

		const act = ir.actions[id];
		if (act) {
			nodes.push({
				id: act.id,
				kind: "action",
				title: act.title,
				attrs: { objectType: act.objectType },
			});
			seen.add(id);
			continue;
		}
		const pol = ir.policies[id];
		if (pol) {
			nodes.push({
				id: pol.id,
				kind: "policy",
				title: pol.id,
				attrs: { effect: pol.effect },
			});
			seen.add(id);
			continue;
		}
		const ent = ir.entities[id];
		if (ent) {
			nodes.push({
				id: ent.id,
				kind: "entity",
				title: ent.title,
			});
			seen.add(id);
			continue;
		}
		const surf = ir.surfaces[id];
		if (surf) {
			nodes.push({
				id: surf.id,
				kind: "surface",
				title: surf.title,
				attrs: { entity: surf.entity },
			});
			seen.add(id);
			continue;
		}
		const role = ir.roles[id];
		if (role) {
			nodes.push({
				id: role.id,
				kind: "role",
				title: role.title,
			});
			seen.add(id);
			continue;
		}
	}

	return nodes;
}

function buildEdgesForAction(
	ir: SemanticIR,
	actionId: string,
	edges: ProjectionEdge[],
	fieldNodes: Map<string, ProjectionNode>,
): void {
	const act = ir.actions[actionId];
	if (!act) {
		return;
	}
	const polId = `policy.${actionId}.default`;
	const policyWhen = ir.policies[polId]?.when;

	const paths = new Set<string>();
	if (act.when) {
		for (const p of collectObjectFieldPaths(act.when)) {
			paths.add(p);
		}
	}
	if (policyWhen) {
		for (const p of collectObjectFieldPaths(policyWhen)) {
			paths.add(p);
		}
	}
	for (const path of paths) {
		const fid = nodeIdForField(act.objectId, path);
		if (!fieldNodes.has(fid)) {
			fieldNodes.set(fid, {
				id: fid,
				kind: "field",
				title: `${act.objectId}.${path}`,
				attrs: { path },
			});
		}
		edges.push({
			from: actionId,
			to: fid,
			type: "reads",
		});
	}

	if (ir.policies[polId]) {
		edges.push({
			from: polId,
			to: actionId,
			type: "guards",
		});
		const pol = ir.policies[polId];
		for (const sub of pol.subjects) {
			if (ir.roles[sub]) {
				edges.push({
					from: sub,
					to: polId,
					type: "depends_on",
					label: "subject",
				});
			}
		}
	}

	const b = ir.bindings[actionId];
	if (b?.workflow) {
		const wid = `workflow:${b.workflow}`;
		edges.push({
			from: actionId,
			to: wid,
			type: "invokes",
		});
	}
	if (b?.tool) {
		const tid = `tool:${b.tool}`;
		edges.push({
			from: actionId,
			to: tid,
			type: "binds_to",
		});
	}

	for (const s of Object.values(ir.surfaces)) {
		if (s.actionBindings.includes(actionId)) {
			edges.push({
				from: s.id,
				to: actionId,
				type: "renders",
			});
		}
	}
}

function focusFromSlice(
	ir: SemanticIR,
	slice: SemanticSlice,
): ProjectionFocus {
	const kindMap: Record<SemanticSlice["targetKind"], ProjectionFocusKind> = {
		action: "action",
		policy: "policy",
		entity: "entity",
		surface: "surface",
		role: "role",
	};
	const k = kindMap[slice.targetKind];

	if (slice.targetKind === "action") {
		const a = ir.actions[slice.targetId];
		const base: ProjectionFocus = {
			id: slice.targetId,
			kind: k,
			title: a?.title ?? slice.targetId,
		};
		return a
			? { ...base, summary: `Object: ${a.objectType}` }
			: base;
	}
	if (slice.targetKind === "policy") {
		const p = ir.policies[slice.targetId];
		return {
			id: slice.targetId,
			kind: k,
			title: p?.id ?? slice.targetId,
		};
	}
	if (slice.targetKind === "entity") {
		const e = ir.entities[slice.targetId];
		return {
			id: slice.targetId,
			kind: k,
			title: e?.title ?? slice.targetId,
		};
	}
	if (slice.targetKind === "surface") {
		const s = ir.surfaces[slice.targetId];
		return {
			id: slice.targetId,
			kind: k,
			title: s?.title ?? slice.targetId,
		};
	}
	const r = ir.roles[slice.targetId];
	return {
		id: slice.targetId,
		kind: k,
		title: r?.title ?? slice.targetId,
	};
}

export function buildProjectionModel(
	ir: SemanticIR,
	slice: SemanticSlice,
	options?: BuildProjectionOptions,
): ProjectionModel {
	const focus = focusFromSlice(ir, slice);
	const edges: ProjectionEdge[] = [];
	const fieldNodes = new Map<string, ProjectionNode>();

	if (slice.targetKind === "action") {
		buildEdgesForAction(ir, slice.targetId, edges, fieldNodes);
	} else if (slice.targetKind === "policy") {
		const p = ir.policies[slice.targetId];
		if (p) {
			buildEdgesForAction(ir, p.actionId, edges, fieldNodes);
		}
	} else if (slice.targetKind === "surface") {
		const s = ir.surfaces[slice.targetId];
		if (s) {
			for (const aid of s.actionBindings) {
				buildEdgesForAction(ir, aid, edges, fieldNodes);
			}
		}
	} else if (slice.targetKind === "entity") {
		for (const id of slice.nodeIds) {
			if (ir.actions[id]) {
				buildEdgesForAction(ir, id, edges, fieldNodes);
			}
		}
	} else if (slice.targetKind === "role") {
		for (const id of slice.nodeIds) {
			if (ir.actions[id]) {
				buildEdgesForAction(ir, id, edges, fieldNodes);
			}
		}
	}

	const baseNodes = buildNodesFromSlice(ir, slice);
	const byId = new Map(baseNodes.map((n) => [n.id, n]));
	for (const fn of fieldNodes.values()) {
		if (!byId.has(fn.id)) {
			byId.set(fn.id, fn);
		}
	}
	const nodes = [...byId.values()];

	let narrative: ProjectionNarrative | undefined;
	if (options?.narrative !== undefined) {
		narrative = options.narrative;
	} else if (slice.targetKind === "action") {
		const purpose = ir.actions[slice.targetId]?.title;
		narrative = purpose !== undefined ? { purpose } : undefined;
	}

	return {
		focus,
		nodes,
		edges,
		...(narrative !== undefined ? { narrative } : {}),
		snapshotId: ir.schema.snapshotId,
	};
}
