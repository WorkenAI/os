import type { PlatformGraph, PlatformNode } from "@worken/platform-core";
import { relatedPlatformNodes } from "@worken/platform-core";
import type { SemanticGraph } from "@worken/semantic-core";
import type { WorkSession } from "@worken/session-core";
import type { ContextBundle } from "./bundle.js";
import {
	isTaskPresetId,
	TASK_PRESETS,
	type TaskPresetId,
} from "./task-presets.js";

export interface BuildContextInput {
	task: string;
	area?: string;
	semantic: SemanticGraph;
	platform: PlatformGraph;
	session?: WorkSession;
	depth?: "compact" | "normal";
}

function normalizeArea(s?: string): string | undefined {
	if (!s) {
		return undefined;
	}
	return s.trim().toLowerCase();
}

function nodeMatchesArea(node: PlatformNode, area: string): boolean {
	const hay = `${node.id} ${node.title} ${node.summary ?? ""}`.toLowerCase();
	return hay.includes(area);
}

function collectGlossary(
	platform: PlatformGraph,
	semantic: SemanticGraph,
): ContextBundle["glossary"] {
	const out: ContextBundle["glossary"] = [];
	for (const n of platform.nodes) {
		if (n.kind === "glossary-term") {
			const summary = n.summary ?? n.definition;
			out.push(
				summary !== undefined
					? { id: n.id, title: n.title, summary }
					: { id: n.id, title: n.title },
			);
		}
	}
	for (const n of semantic.nodes) {
		if (n.kind === "glossary-term") {
			const summary = n.summary ?? n.definition;
			out.push(
				summary !== undefined
					? { id: n.id, title: n.title, summary }
					: { id: n.id, title: n.title },
			);
		}
	}
	return out;
}

function invariantMatchesKeywords(
	n: PlatformNode,
	keywords: string[] | undefined,
): boolean {
	if (!keywords?.length) {
		return false;
	}
	const hay =
		`${n.id} ${n.title} ${n.summary ?? ""} ${n.kind === "invariant" ? n.statement : ""}`.toLowerCase();
	return keywords.some((k) => hay.includes(k.toLowerCase()));
}

function collectInvariants(
	platform: PlatformGraph,
	area?: string,
	invariantKeywords?: string[],
): ContextBundle["invariants"] {
	const a = normalizeArea(area);
	const invs = platform.nodes.filter((n) => n.kind === "invariant");
	const hasArea = a !== undefined;
	const hasKeywords =
		invariantKeywords !== undefined && invariantKeywords.length > 0;
	const filtered =
		!hasArea && !hasKeywords
			? invs
			: invs.filter((n) => {
					const areaOk =
						hasArea &&
						(n.id.toLowerCase().includes(a) ||
							Boolean(a && nodeMatchesArea(n, a)));
					const keywordOk =
						hasKeywords && invariantMatchesKeywords(n, invariantKeywords);
					return areaOk || keywordOk;
				});
	return filtered.map((n) =>
		n.severity !== undefined
			? { id: n.id, statement: n.statement, severity: n.severity }
			: { id: n.id, statement: n.statement },
	);
}

function collectExamples(
	platform: PlatformGraph,
	area?: string,
): ContextBundle["examples"] {
	const a = normalizeArea(area);
	const ex = platform.nodes.filter((n) => n.kind === "example");
	const filtered =
		a === undefined
			? ex
			: ex.filter(
					(n) => n.id.toLowerCase().includes(a) || (a && nodeMatchesArea(n, a)),
				);
	return filtered.map((n) =>
		n.refs !== undefined
			? { id: n.id, title: n.title, refs: n.refs }
			: { id: n.id, title: n.title },
	);
}

function relatedFromSession(
	platform: PlatformGraph,
	semantic: SemanticGraph,
	session?: WorkSession,
): { platform: PlatformNode[]; semantic: SemanticGraph["nodes"] } {
	const pIds = session?.platformFocusIds ?? [];
	const sIds = session?.semanticFocusIds ?? [];
	const platformNodes: PlatformNode[] = [];
	for (const id of pIds) {
		const n = platform.byId.get(id);
		if (n) {
			platformNodes.push(n);
		}
	}
	const semanticNodes = semantic.nodes.filter((n) => sIds.includes(n.id));
	return { platform: platformNodes, semantic: semanticNodes };
}

function buildRelatedNodes(
	platform: PlatformGraph,
	semantic: SemanticGraph,
	task: TaskPresetId | undefined,
	area: string | undefined,
	session?: WorkSession,
	depth: "compact" | "normal" = "compact",
): ContextBundle["relatedNodes"] {
	const related: ContextBundle["relatedNodes"] = [];
	const a = normalizeArea(area);
	const { platform: pf, semantic: sf } = relatedFromSession(
		platform,
		semantic,
		session,
	);

	for (const n of pf) {
		related.push({
			id: n.id,
			kind: n.kind,
			title: n.title,
			whyRelevant: "session focus",
		});
	}
	for (const n of sf) {
		related.push({
			id: n.id,
			kind: n.kind,
			title: n.title,
			whyRelevant: "session focus",
		});
	}

	const subsystems = platform.nodes.filter((n) => n.kind === "subsystem");
	const pkgs = platform.nodes.filter((n) => n.kind === "package");

	if (a) {
		for (const n of subsystems) {
			if (nodeMatchesArea(n, a)) {
				related.push({
					id: n.id,
					kind: n.kind,
					title: n.title,
					whyRelevant: "area match (subsystem)",
				});
				for (const neighbor of relatedPlatformNodes(platform, n.id)) {
					if (
						depth === "normal" ||
						neighbor.kind === "package" ||
						neighbor.kind === "contract"
					) {
						related.push({
							id: neighbor.id,
							kind: neighbor.kind,
							title: neighbor.title,
							whyRelevant: `related to ${n.id}`,
						});
					}
				}
			}
		}
		for (const n of pkgs) {
			if (nodeMatchesArea(n, a)) {
				related.push({
					id: n.id,
					kind: n.kind,
					title: n.title,
					whyRelevant: "area match (package)",
				});
			}
		}
	}

	if (task === "add_adapter") {
		for (const n of platform.nodes) {
			if (
				n.kind === "subsystem" &&
				(n.id.toLowerCase().includes("integration") ||
					n.title.toLowerCase().includes("integration"))
			) {
				related.push({
					id: n.id,
					kind: n.kind,
					title: n.title,
					whyRelevant: "task preset: integrations",
				});
			}
			if (n.kind === "package" && n.id.includes("platform-mcp")) {
				related.push({
					id: n.id,
					kind: n.kind,
					title: n.title,
					whyRelevant: "task preset: platform-mcp",
				});
			}
			if (n.kind === "contract" && n.id.includes("context")) {
				related.push({
					id: n.id,
					kind: n.kind,
					title: n.title,
					whyRelevant: "task preset: context bundle contract",
				});
			}
		}
	}

	const seen = new Set<string>();
	const deduped: ContextBundle["relatedNodes"] = [];
	for (const r of related) {
		const key = `${r.id}:${r.whyRelevant}`;
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		deduped.push(r);
	}
	return deduped;
}

export function buildContextBundle(input: BuildContextInput): ContextBundle {
	const preset = isTaskPresetId(input.task)
		? TASK_PRESETS[input.task]
		: undefined;
	const depth = input.depth ?? "compact";
	const glossary = collectGlossary(input.platform, input.semantic);
	const invKeywords = preset?.invariantKeywords;
	const invariants = collectInvariants(input.platform, input.area, invKeywords);
	const examples = collectExamples(input.platform, input.area);
	const relatedNodes = buildRelatedNodes(
		input.platform,
		input.semantic,
		preset?.id,
		input.area,
		input.session,
		depth,
	);

	const title = preset?.title ?? `Task: ${input.task}`;
	const summary =
		preset?.summary ??
		`Context bundle for task "${input.task}"${input.area ? ` in area "${input.area}"` : ""}.`;

	const bundleId = `ctx.${input.task}${input.area ? `.${input.area}` : ""}`;

	return {
		id: bundleId,
		title,
		summary,
		task: input.task,
		...(input.area !== undefined ? { area: input.area } : {}),
		glossary,
		invariants,
		examples,
		relatedNodes,
		risks: preset?.risks ?? [],
		nextQuestions: preset?.nextQuestions ?? [],
	};
}

export function buildImpactBundle(input: {
	nodeId: string;
	semantic?: SemanticGraph;
	platform?: PlatformGraph;
}): ContextBundle {
	const related: ContextBundle["relatedNodes"] = [];
	const invariants: ContextBundle["invariants"] = [];
	const examples: ContextBundle["examples"] = [];
	const risks: string[] = [
		"Impact analysis is limited to graph neighborhood; repository-wide search may still be required.",
	];

	if (input.platform) {
		const node = input.platform.byId.get(input.nodeId);
		if (node) {
			related.push({
				id: node.id,
				kind: node.kind,
				title: node.title,
				whyRelevant: "change target",
			});
		}
		for (const n of relatedPlatformNodes(input.platform, input.nodeId)) {
			related.push({
				id: n.id,
				kind: n.kind,
				title: n.title,
				whyRelevant: "graph neighbor",
			});
			if (n.kind === "invariant") {
				invariants.push(
					n.severity !== undefined
						? { id: n.id, statement: n.statement, severity: n.severity }
						: { id: n.id, statement: n.statement },
				);
			}
			if (n.kind === "example") {
				examples.push(
					n.refs !== undefined
						? { id: n.id, title: n.title, refs: n.refs }
						: { id: n.id, title: n.title },
				);
			}
		}
	}

	if (input.semantic) {
		const n = input.semantic.byId.get(input.nodeId);
		if (n) {
			related.push({
				id: n.id,
				kind: n.kind,
				title: n.title,
				whyRelevant: "change target",
			});
		}
		const rels = [
			...(input.semantic.outgoing.get(input.nodeId) ?? []),
			...(input.semantic.incoming.get(input.nodeId) ?? []),
		];
		for (const r of rels) {
			const other = r.from === input.nodeId ? r.to : r.from;
			const otherNode = input.semantic.byId.get(other);
			if (otherNode) {
				related.push({
					id: otherNode.id,
					kind: otherNode.kind,
					title: otherNode.title,
					whyRelevant: `semantic relation ${r.kind}`,
				});
			}
		}
	}

	return {
		id: `impact.${input.nodeId}`,
		title: `Impact: ${input.nodeId}`,
		summary: `Neighborhood and constraints around node ${input.nodeId}.`,
		glossary: [],
		invariants,
		examples,
		relatedNodes: related,
		risks,
		nextQuestions: [
			"Which tests cover this node?",
			"Which contracts or ADRs must be updated together?",
		],
	};
}
