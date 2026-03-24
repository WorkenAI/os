import type { SemanticIR } from "@worken/semantic-ir";

export type SliceTargetKind =
	| "action"
	| "policy"
	| "entity"
	| "surface"
	| "role";

export interface SemanticSlice {
	targetKind: SliceTargetKind;
	targetId: string;
	/** Stable ids of IR nodes included in the slice */
	nodeIds: string[];
}

function uniq(ids: string[]): string[] {
	return [...new Set(ids)];
}

/**
 * Resolve a connected semantic slice around a focus id (action, policy, entity id key, surface, role).
 */
export function resolveSlice(ir: SemanticIR, target: string): SemanticSlice | null {
	const action = ir.actions[target];
	if (action) {
		const ids = [action.id];
		const polId = `policy.${action.id}.default`;
		if (ir.policies[polId]) {
			ids.push(polId);
		}
		ids.push(action.objectId);
		const b = ir.bindings[action.id];
		if (b?.workflow) {
			ids.push(`workflow:${b.workflow}`);
		}
		if (b?.tool) {
			ids.push(`tool:${b.tool}`);
		}
		for (const s of Object.values(ir.surfaces)) {
			if (s.actionBindings.includes(action.id)) {
				ids.push(s.id);
			}
		}
		for (const sub of ir.policies[polId]?.subjects ?? []) {
			if (ir.roles[sub]) {
				ids.push(sub);
			}
		}
		return {
			targetKind: "action",
			targetId: action.id,
			nodeIds: uniq(ids),
		};
	}

	const pol = ir.policies[target];
	if (pol) {
		const ids = [pol.id, pol.actionId];
		const act = ir.actions[pol.actionId];
		if (act) {
			ids.push(act.objectId);
		}
		for (const sub of pol.subjects) {
			if (ir.roles[sub]) {
				ids.push(sub);
			}
		}
		return {
			targetKind: "policy",
			targetId: pol.id,
			nodeIds: uniq(ids),
		};
	}

	if (ir.entities[target]) {
		const ids = [target];
		for (const a of Object.values(ir.actions)) {
			if (a.objectId === target) {
				ids.push(a.id);
				ids.push(`policy.${a.id}.default`);
			}
		}
		return {
			targetKind: "entity",
			targetId: target,
			nodeIds: uniq(ids),
		};
	}

	const surf = ir.surfaces[target];
	if (surf) {
		const ids = [surf.id];
		for (const aid of surf.actionBindings) {
			if (ir.actions[aid]) {
				ids.push(aid);
				ids.push(`policy.${aid}.default`);
			}
		}
		return {
			targetKind: "surface",
			targetId: surf.id,
			nodeIds: uniq(ids),
		};
	}

	const role = ir.roles[target];
	if (role) {
		const ids = [role.id];
		for (const p of Object.values(ir.policies)) {
			if (p.subjects.includes(role.id)) {
				ids.push(p.id, p.actionId);
			}
		}
		return {
			targetKind: "role",
			targetId: role.id,
			nodeIds: uniq(ids),
		};
	}

	return null;
}
