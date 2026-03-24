import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SemanticSource } from "@worken/semantic-core";

/** Extra semantic nodes derived from repo files (glossary), merged with the domain anchor. */
export function buildSemanticOverlayFromRepo(repoRoot: string): SemanticSource {
	const nodes: SemanticSource["nodes"] = [];
	const headlessPath = join(repoRoot, "docs/adrs/0002-headless-kernel.md");
	if (existsSync(headlessPath)) {
		const firstLine =
			readFileSync(headlessPath, "utf8").split("\n")[0]?.replace(/^#\s*/, "") ??
			"";
		nodes.push({
			id: "glossary.semantic.headless-kernel",
			kind: "glossary-term",
			title: "Headless kernel",
			summary: firstLine || "Headless kernel ADR",
		});
	}
	return {
		protocolVersion: "0.1.0",
		nodes,
	};
}
