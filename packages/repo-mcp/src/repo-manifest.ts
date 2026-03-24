import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PlatformSource } from "@worken/platform-core";

const SUBSYSTEM_ID = "subsystem.worken-os-repo";

/**
 * Canonical platform nodes backed by files in this repository (ADRs, docs).
 * Merged on top of the workspace package scan so live MCP has real invariants/examples.
 */
export function buildRepoManifestSource(repoRoot: string): PlatformSource {
	const nodes: PlatformSource["nodes"] = [
		{
			id: "invariant.repo.mcp-readonly",
			kind: "invariant",
			title: "MCP server is read-only",
			statement:
				"The platform MCP server exposes graphs and bundles for agents; it does not write files or mutate repository state.",
			severity: "error",
			status: "stable",
			canonical: true,
			refs: [
				{
					kind: "file",
					target: "packages/platform-mcp/src/server.ts",
					note: "createPlatformMcpServer instructions",
				},
			],
		},
		{
			id: "example.repo.semantic-protocol-doc",
			kind: "example",
			title: "Semantic protocol specification",
			exampleKind: "contract",
			status: "stable",
			summary: "Normative semantic protocol for Worken OS.",
			refs: [
				{
					kind: "file",
					target: "docs/spec/semantic-protocol.md",
				},
			],
		},
	];

	const relations: PlatformSource["relations"] = [];

	for (const nid of [
		"invariant.repo.mcp-readonly",
		"example.repo.semantic-protocol-doc",
	]) {
		relations.push({
			id: `rel.contains.${nid}`,
			kind: "contains",
			from: SUBSYSTEM_ID,
			to: nid,
		});
	}

	const adrFiles = [
		{
			id: "adr.0001.semantic-protocol",
			file: "docs/adrs/0001-semantic-protocol.md",
		},
		{
			id: "adr.0002.headless-kernel",
			file: "docs/adrs/0002-headless-kernel.md",
		},
	];

	for (const { id, file } of adrFiles) {
		const abs = join(repoRoot, file);
		if (!existsSync(abs)) {
			continue;
		}
		const title =
			readFileSync(abs, "utf8").split("\n")[0]?.replace(/^#\s*/, "") ?? id;
		const adrId = file.match(/(\d{4})[^/]*$/)?.[1] ?? id.replace(/^adr\./, "");
		nodes.push({
			id,
			kind: "adr",
			title,
			adrId,
			status: "stable",
			refs: [{ kind: "file", target: file }],
		});
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
