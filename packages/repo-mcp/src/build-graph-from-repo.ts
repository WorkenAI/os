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
