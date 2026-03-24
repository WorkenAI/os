import type {
	PlatformNode,
	PlatformRelation,
	PlatformSource,
} from "@worken/platform-core";
import type { SemanticSource } from "@worken/semantic-core";
import { packageNodeId } from "./ids.js";
import type { WorkspacePackage } from "./scan-workspace.js";

const SUBSYSTEM_ID = "subsystem.worken-os-repo";

/**
 * Build platform graph nodes from live `package.json` scan + one subsystem root.
 * This is the repo-as-model-context projection (packages, paths, descriptions).
 */
export function buildPlatformSourceFromWorkspace(
	packages: WorkspacePackage[],
): PlatformSource {
	const nodes: PlatformNode[] = [
		{
			id: SUBSYSTEM_ID,
			kind: "subsystem",
			title: "Worken OS repository",
			summary:
				"Monorepo workspace: packages and apps discovered from package.json. Regenerated when MCP starts.",
			canonical: true,
			status: "stable",
		},
	];

	const relations: PlatformRelation[] = [];

	for (const pkg of packages) {
		const id = packageNodeId(pkg.name);
		const refs = [
			{ kind: "package" as const, target: pkg.name },
			{
				kind: "file" as const,
				target: `${pkg.relativeDir}/package.json`,
				note: "Package manifest",
			},
		];
		const base = {
			id,
			kind: "package" as const,
			title: pkg.name,
			status: "stable" as const,
			refs,
		};
		const withSummary =
			pkg.description !== undefined
				? { ...base, summary: pkg.description }
				: base;
		const node =
			pkg.private === true
				? withSummary
				: { ...withSummary, canonical: true as const };
		nodes.push(node);
		relations.push({
			id: `rel.contains.${id}`,
			kind: "contains",
			from: SUBSYSTEM_ID,
			to: id,
		});
	}

	return {
		version: "0.1.0",
		nodes,
		relations,
	};
}

/** Minimal semantic graph: domain anchor only (extend later with extracted semantics). */
export function buildSemanticSourceForRepo(): SemanticSource {
	return {
		protocolVersion: "0.1.0",
		nodes: [
			{
				id: "domain.worken-os",
				kind: "domain",
				title: "Worken OS",
				summary:
					"Repository-scoped semantic anchor; extend with authored semantic sources.",
			},
		],
	};
}

/**
 * Small authored slice for Semantic IR (Stage 1): entities, roles, actions, surface projection.
 * Demonstrates compile → IR → explain; not full product domain.
 */
export function buildSemanticIRDemoSource(): SemanticSource {
	return {
		protocolVersion: "0.1.0",
		nodes: [
			{
				id: "domain.demo-recruitment",
				kind: "domain",
				title: "Recruitment (demo)",
				summary: "Illustrative domain for Semantic IR tooling",
			},
			{
				id: "object.candidate",
				kind: "object",
				title: "Candidate",
				domainId: "domain.demo-recruitment",
				schema: {
					type: "object",
					required: ["status"],
					properties: {
						status: {
							type: "string",
							enum: ["new", "screening", "qualified", "rejected", "hired"],
						},
						phone: { type: "string" },
						name: { type: "string" },
					},
				},
			},
			{
				id: "role.hr_manager",
				kind: "role",
				title: "HR Manager",
			},
			{
				id: "role.recruiter_bot",
				kind: "role",
				title: "Recruiter Bot",
			},
			{
				id: "action.candidate.schedule_interview",
				kind: "action",
				title: "Schedule interview",
				domainId: "domain.demo-recruitment",
				objectId: "object.candidate",
				when: {
					op: "and",
					args: [
						{
							op: "eq",
							left: { scope: "object", path: "status" },
							right: "qualified",
						},
						{ op: "exists", value: { scope: "object", path: "phone" } },
					],
				},
			},
			{
				id: "projection.surface.candidate.detail",
				kind: "projection",
				title: "Candidate detail surface",
				target: "model-context",
				payload: {
					id: "surface.candidate.detail",
					title: "Candidate detail",
					entity: "candidate",
					regions: {
						header: ["candidate.name", "candidate.status"],
						main: ["candidate.timeline"],
					},
					actionBindings: ["action.candidate.schedule_interview"],
				},
			},
		],
		relations: [
			{
				id: "rel.role.hr.schedule",
				kind: "allowed-for",
				from: "role.hr_manager",
				to: "action.candidate.schedule_interview",
			},
			{
				id: "rel.role.bot.schedule",
				kind: "allowed-for",
				from: "role.recruiter_bot",
				to: "action.candidate.schedule_interview",
			},
		],
	};
}
