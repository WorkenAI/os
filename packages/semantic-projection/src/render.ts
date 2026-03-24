import type {
	AsciiMode,
	ProjectionModel,
	RenderFormat,
} from "./projection-model.js";

function stableStringify(obj: unknown): string {
	return JSON.stringify(obj, null, 2);
}

function mermaidEscape(s: string): string {
	return s.replace(/"/g, "&quot;").replace(/\|/g, "&#124;");
}

function renderLlm(model: ProjectionModel): string {
	const lines: string[] = [];
	lines.push(`Focus: ${model.focus.kind} ${model.focus.id}`);
	if (model.focus.title) {
		lines.push(`Title: ${model.focus.title}`);
	}
	if (model.focus.summary) {
		lines.push(`Summary: ${model.focus.summary}`);
	}
	if (model.narrative?.purpose) {
		lines.push("");
		lines.push("Purpose:");
		lines.push(model.narrative.purpose);
	}
	if (model.snapshotId) {
		lines.push("");
		lines.push(`Snapshot: ${model.snapshotId}`);
	}
	lines.push("");
	lines.push("Boundaries (typed edges):");
	for (const e of model.edges) {
		const lbl = e.label ? ` [${e.label}]` : "";
		lines.push(`- ${e.from} --${e.type}--> ${e.to}${lbl}`);
	}
	if (model.diagnostics?.length) {
		lines.push("");
		lines.push("Diagnostics:");
		for (const d of model.diagnostics) {
			lines.push(`- [${d.severity}] ${d.message}`);
		}
	}
	if (model.narrative?.nextSteps?.length) {
		lines.push("");
		lines.push("Next steps:");
		for (const s of model.narrative.nextSteps) {
			lines.push(`- ${s}`);
		}
	}
	return lines.join("\n");
}

function renderAsciiCompact(model: ProjectionModel): string {
	const lines: string[] = [];
	lines.push(`${model.focus.id}`);
	for (const e of model.edges) {
		lines.push(`├─ ${e.type}: ${shortId(e.from)} → ${shortId(e.to)}`);
	}
	if (model.diagnostics?.length) {
		for (const d of model.diagnostics) {
			lines.push(`[${d.severity}] ${d.message}`);
		}
	}
	return lines.join("\n");
}

function shortId(id: string): string {
	return id.replace(/^field:/, "");
}

function renderAsciiExpanded(model: ProjectionModel): string {
	const lines: string[] = [];
	lines.push(`[${model.focus.kind}] ${model.focus.id}`);
	if (model.focus.title) {
		lines.push(`  title: ${model.focus.title}`);
	}
	if (model.focus.summary) {
		lines.push(`  ${model.focus.summary}`);
	}
	if (model.narrative?.purpose) {
		lines.push("");
		lines.push("Purpose:");
		lines.push(`  ${model.narrative.purpose}`);
	}
	lines.push("");
	lines.push("Edges:");
	for (const e of model.edges) {
		const lbl = e.label ? ` (${e.label})` : "";
		lines.push(`  ${e.from} --[${e.type}]--> ${e.to}${lbl}`);
	}
	if (model.diagnostics?.length) {
		lines.push("");
		lines.push("Diagnostics:");
		for (const d of model.diagnostics) {
			lines.push(`  [${d.severity}] ${d.message}`);
		}
	}
	return lines.join("\n");
}

function renderMermaid(model: ProjectionModel): string {
	const lines: string[] = [];
	lines.push("flowchart TD");
	const idMap = new Map<string, string>();
	let i = 0;
	function mid(raw: string): string {
		if (!idMap.has(raw)) {
			idMap.set(raw, `N${i++}`);
		}
		return idMap.get(raw) ?? "N0";
	}
	const all = new Set<string>();
	for (const n of model.nodes) {
		all.add(n.id);
	}
	for (const e of model.edges) {
		all.add(e.from);
		all.add(e.to);
	}
	for (const id of all) {
		const n = model.nodes.find((x) => x.id === id);
		const kind = n?.kind ?? "node";
		const title = n?.title ?? id;
		const safe = mid(id);
		lines.push(
			`  ${safe}["${mermaidEscape(kind)}: ${mermaidEscape(title)}"]`,
		);
	}
	for (const e of model.edges) {
		const a = mid(e.from);
		const b = mid(e.to);
		lines.push(`  ${a} -->|${e.type}| ${b}`);
	}
	return lines.join("\n");
}

export interface RenderProjectionOptions {
	asciiMode?: AsciiMode;
}

export function renderProjection(
	model: ProjectionModel,
	format: RenderFormat,
	options?: RenderProjectionOptions,
): string {
	switch (format) {
		case "json":
			return stableStringify(model);
		case "llm":
			return renderLlm(model);
		case "ascii":
			return options?.asciiMode === "expanded"
				? renderAsciiExpanded(model)
				: renderAsciiCompact(model);
		case "mermaid":
			return renderMermaid(model);
		default: {
			const _e: never = format;
			return _e;
		}
	}
}
