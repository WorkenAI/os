import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { compilePlatform, mergePlatformSources } from "@worken/platform-core";
import { compileSemantic, mergeSemanticSources } from "@worken/semantic-core";
import { compileSemanticIR } from "@worken/semantic-ir";
import {
	buildPlatformSourceFromWorkspace,
	buildSemanticIRDemoSource,
	buildSemanticSourceForRepo,
} from "./build-graph-from-repo.js";
import { buildRepoManifestSource } from "./repo-manifest.js";
import { loadWorkspacePackages } from "./scan-workspace.js";
import { buildSemanticOverlayFromRepo } from "./semantic-overlay.js";

function findRepoRoot(): string {
	let dir = dirname(fileURLToPath(import.meta.url));
	for (let i = 0; i < 16; i++) {
		const pkg = join(dir, "package.json");
		if (existsSync(pkg)) {
			try {
				const j = JSON.parse(readFileSync(pkg, "utf8")) as { name?: string };
				if (j.name === "worken-os") {
					return dir;
				}
			} catch {
				/* */
			}
		}
		const parent = dirname(dir);
		if (parent === dir) {
			break;
		}
		dir = parent;
	}
	return process.cwd();
}

const REPO_ROOT = findRepoRoot();

describe("live repo MCP graphs", () => {
	it("workspace scan excludes repo root and nested packages", async () => {
		const pkgs = await loadWorkspacePackages(REPO_ROOT);
		const names = new Set(pkgs.map((p) => p.name));
		assert.equal(names.has("worken-os"), false);
		const deepNested = pkgs.some((p) => p.relativeDir.includes("node_modules"));
		assert.equal(deepNested, false);
		assert.ok(
			names.has("@worken/platform-mcp") || names.has("@worken/semantic-core"),
		);
	});

	it("merged platform includes manifest invariant and ADR nodes", () => {
		const merged = mergePlatformSources(
			buildPlatformSourceFromWorkspace([]),
			buildRepoManifestSource(REPO_ROOT),
		);
		const g = compilePlatform(merged);
		assert.ok(g.byId.get("invariant.repo.mcp-readonly"));
		assert.ok(
			g.nodes.some((n) => n.kind === "adr" && n.id.startsWith("adr.000")),
		);
	});

	it("bundle_for_task onboard_repo lists repo invariant when area unset", async () => {
		const { buildContextBundle } = await import("@worken/context-core");
		const pkgs = await loadWorkspacePackages(REPO_ROOT);
		const platform = compilePlatform(
			mergePlatformSources(
				buildPlatformSourceFromWorkspace(pkgs),
				buildRepoManifestSource(REPO_ROOT),
			),
		);
		const semantic = compileSemantic(
			mergeSemanticSources(
				buildSemanticSourceForRepo(),
				buildSemanticIRDemoSource(),
				buildSemanticOverlayFromRepo(REPO_ROOT),
			),
		);
		const bundle = buildContextBundle({
			task: "onboard_repo",
			semantic,
			platform,
			depth: "compact",
		});
		assert.ok(
			bundle.invariants.some(
				(i: { id: string }) => i.id === "invariant.repo.mcp-readonly",
			),
		);
	});

	it("Semantic IR demo compiles with schedule_interview and surface", () => {
		const semantic = compileSemantic(
			mergeSemanticSources(
				buildSemanticSourceForRepo(),
				buildSemanticIRDemoSource(),
			),
		);
		const ir = compileSemanticIR(semantic, {
			workspaceId: "worken-os",
			semanticProtocolVersion: semantic.protocolVersion,
		});
		assert.ok(ir.actions["action.candidate.schedule_interview"]);
		assert.ok(ir.surfaces["surface.candidate.detail"]);
		assert.ok(ir.policies["policy.action.candidate.schedule_interview.default"]);
	});
});
