import { createHash } from "node:crypto";
import type {
	ActionNode,
	BindingNode,
	ObjectNode,
	ProjectionNode,
	SemanticGraph,
} from "@worken/semantic-core";
import type {
	ActionIRNode,
	BindingIRNode,
	EntityNode,
	PolicyIRNode,
	RoleNode,
	SemanticIR,
	SemanticIRSchemaMeta,
	SurfaceIRNode,
	TransitionIRNode,
} from "./model.js";

function stableStringify(value: unknown): string {
	return JSON.stringify(value, (_k, v) => {
		if (v !== null && typeof v === "object" && !Array.isArray(v)) {
			return Object.keys(v as object)
				.sort()
				.reduce(
					(acc, key) => {
						(acc as Record<string, unknown>)[key] = (v as Record<string, unknown>)[
							key
						];
						return acc;
					},
					{} as Record<string, unknown>,
				);
		}
		return v;
	});
}

function snapshotHash(ir: Omit<SemanticIR, "schema">): string {
	const h = createHash("sha256");
	h.update(stableStringify(ir));
	return `sha256:${h.digest("hex")}`;
}

function objectToEntity(o: ObjectNode): EntityNode {
	const schema = o.schema;
	const fields: EntityNode["fields"] = {};
	if (
		schema !== null &&
		typeof schema === "object" &&
		!Array.isArray(schema) &&
		"properties" in schema
	) {
		const raw = schema as {
			properties?: Record<string, unknown>;
			required?: string[];
		};
		const props = raw.properties;
		const required = Array.isArray(raw.required) ? raw.required : [];
		if (props && typeof props === "object") {
			for (const [key, val] of Object.entries(props)) {
				if (val !== null && typeof val === "object" && !Array.isArray(val)) {
					const v = val as Record<string, unknown>;
					const t = v.type;
					if (Array.isArray(v.enum) && v.enum.every((x) => typeof x === "string")) {
						fields[key] = {
							type: "enum",
							values: v.enum as string[],
							...(required.includes(key) ? { required: true } : {}),
						};
					} else if (t === "string" || t === "number" || t === "boolean") {
						fields[key] = {
							type: t,
							...(required.includes(key) ? { required: true } : {}),
						};
					}
				}
			}
		}
	}
	return {
		id: o.id,
		title: o.title,
		fields,
	};
}

function rolesForAction(graph: SemanticGraph, actionId: string): string[] {
	const roles: string[] = [];
	for (const r of graph.relations) {
		if (r.kind !== "allowed-for" || r.to !== actionId) {
			continue;
		}
		const node = graph.byId.get(r.from);
		if (node?.kind === "role") {
			roles.push(node.id);
		}
	}
	return roles;
}

function projectionToSurface(p: ProjectionNode): SurfaceIRNode | undefined {
	const pl = p.payload;
	if (pl === null || typeof pl !== "object" || Array.isArray(pl)) {
		return undefined;
	}
	const bag = pl as Record<string, unknown>;
	const entity = bag.entity;
	const actionBindings = bag.actionBindings;
	if (typeof entity !== "string" || !Array.isArray(actionBindings)) {
		return undefined;
	}
	const id =
		typeof bag.id === "string" ? bag.id : p.id.replace(/^projection\./, "surface.");
	const shellLayoutId =
		p.target === "web-shell" && typeof bag.shellLayoutId === "string"
			? bag.shellLayoutId
			: undefined;
	return {
		id,
		title: typeof bag.title === "string" ? bag.title : p.title,
		entity,
		projectionTarget: p.target,
		...(shellLayoutId !== undefined ? { shellLayoutId } : {}),
		...(typeof bag.regions === "object" &&
		bag.regions !== null &&
		!Array.isArray(bag.regions)
			? { regions: bag.regions as Record<string, string[]> }
			: {}),
		actionBindings: actionBindings.filter((x): x is string => typeof x === "string"),
	};
}

export interface CompileSemanticIROptions {
	workspaceId: string;
	semanticProtocolVersion: string;
}

/**
 * Deterministic projection: same SemanticGraph → same IR payload and snapshotId
 * (given same workspaceId / protocol version inputs).
 */
export function compileSemanticIR(
	graph: SemanticGraph,
	options: CompileSemanticIROptions,
): SemanticIR {
	const entities: Record<string, EntityNode> = {};
	const roles: Record<string, RoleNode> = {};
	const actions: Record<string, ActionIRNode> = {};
	const policies: Record<string, PolicyIRNode> = {};
	const surfaces: Record<string, SurfaceIRNode> = {};
	const transitions: Record<string, TransitionIRNode> = {};
	const bindings: Record<string, BindingIRNode> = {};

	for (const n of graph.nodes) {
		if (n.kind === "object") {
			entities[n.id] = objectToEntity(n);
		}
		if (n.kind === "role") {
			roles[n.id] = {
				id: n.id,
				title: n.title,
			};
		}
		if (n.kind === "action") {
			const a = n as ActionNode;
			const obj = graph.byId.get(a.objectId);
			const objectType =
				obj?.kind === "object" ? (obj as ObjectNode).id : a.objectId;
			actions[a.id] = {
				id: a.id,
				title: a.title,
				domainId: a.domainId,
				objectId: a.objectId,
				objectType,
				...(a.inputSchema !== undefined
					? { inputSchema: a.inputSchema }
					: {}),
				...(a.when !== undefined ? { when: a.when } : {}),
			};
			const subj = rolesForAction(graph, a.id);
			const policyId = `policy.${a.id}.default`;
			policies[policyId] = {
				id: policyId,
				actionId: a.id,
				effect: "allow",
				subjects: subj.length > 0 ? subj : [],
				...(a.when !== undefined ? { when: a.when } : {}),
			};
		}
		if (n.kind === "projection") {
			const s = projectionToSurface(n as ProjectionNode);
			if (s) {
				surfaces[s.id] = s;
			}
		}
	}

	for (const n of graph.nodes) {
		if (n.kind !== "action") {
			continue;
		}
		const a = n as ActionNode;
		if (a.bindingId !== undefined) {
			const b = graph.byId.get(a.bindingId);
			if (b?.kind === "binding") {
				const bn = b as BindingNode;
				bindings[a.id] = {
					actionId: a.id,
					tool: bn.key,
				};
			}
		}
	}

	const irBody: Omit<SemanticIR, "schema"> = {
		entities,
		roles,
		actions,
		policies,
		surfaces,
		transitions,
		bindings,
	};

	const snapshotId = snapshotHash(irBody);
	const schema: SemanticIRSchemaMeta = {
		schemaVersion: "0.1.0",
		workspaceId: options.workspaceId,
		snapshotId,
		generatedAt: new Date().toISOString(),
		semanticProtocolVersion: options.semanticProtocolVersion,
	};

	return {
		schema: {
			...schema,
			snapshotId,
		},
		...irBody,
	};
}
