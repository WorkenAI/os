import type {
	PlatformNode,
	PlatformRelation,
	PlatformSource,
} from "@worken/platform-core";
import type { CodeGraph } from "./model.js";

const SUBSYSTEM_ID = "subsystem.worken-code-graph";

/**
 * Project TypeScript code graph into platform graph nodes for MCP merge.
 * Uses extension-point for exported symbols and contract for public API surfaces.
 */
export function codeGraphToPlatformSource(graph: CodeGraph): PlatformSource {
	const nodes: PlatformNode[] = [
		{
			id: SUBSYSTEM_ID,
			kind: "subsystem",
			title: "TypeScript code graph",
			summary:
				"Derived from the TypeScript program (exports, imports, package boundaries). See docs/spec/code-semantics-bridge.md",
			status: "stable",
		},
	];

	const relations: PlatformRelation[] = [];
	let rel = 0;

	for (const n of graph.nodes) {
		if (n.kind === "package") {
			const title = n.packageName ?? n.title;
			const base = {
				id: n.id,
				kind: "package" as const,
				title,
				status: "stable" as const,
			};
			nodes.push(
				n.packageRoot
					? {
							...base,
							refs: [
								{
									kind: "file" as const,
									target: `${n.packageRoot}/package.json`,
								},
							],
						}
					: base,
			);
			relations.push({
				id: `code.rel.${++rel}`,
				kind: "contains",
				from: SUBSYSTEM_ID,
				to: n.id,
			});
		} else if (n.kind === "contract-surface") {
			nodes.push({
				id: n.id,
				kind: "contract",
				title: n.title,
				summary: "Public API surface (from entry exports)",
				status: "stable",
			});
			relations.push({
				id: `code.rel.${++rel}`,
				kind: "contains",
				from: SUBSYSTEM_ID,
				to: n.id,
			});
		} else if (n.kind === "exported-symbol") {
			const ext: PlatformNode = {
				id: n.id,
				kind: "extension-point",
				title: n.title,
				extensionKind: n.symbolKind ?? "other",
				status: "stable",
			};
			if (n.signature !== undefined) {
				ext.summary = n.signature;
			}
			if (n.declaredIn !== undefined) {
				ext.refs = [
					{ kind: "file" as const, target: n.declaredIn, note: "declaration" },
				];
			}
			nodes.push(ext);
		}
	}

	for (const e of graph.edges) {
		if (e.kind === "depends-on") {
			relations.push({
				id: `code.rel.${++rel}`,
				kind: "depends-on",
				from: e.from,
				to: e.to,
			});
		} else if (e.kind === "exports") {
			relations.push({
				id: `code.rel.${++rel}`,
				kind: "contains",
				from: e.from,
				to: e.to,
			});
		} else if (e.kind === "part-of-surface") {
			relations.push({
				id: `code.rel.${++rel}`,
				kind: "documents",
				from: e.from,
				to: e.to,
			});
		} else if (e.kind === "uses-type-from") {
			relations.push({
				id: `code.rel.${++rel}`,
				kind: "see-also",
				from: e.from,
				to: e.to,
			});
		}
	}

	return {
		version: "0.1.0",
		nodes,
		relations,
	};
}
