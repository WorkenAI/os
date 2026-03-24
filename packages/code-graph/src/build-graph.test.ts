import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { buildCodeGraph } from "./build-graph.js";

function repoRoot(): string {
	let dir = dirname(fileURLToPath(import.meta.url));
	for (let i = 0; i < 8; i++) {
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
		dir = dirname(dir);
	}
	return process.cwd();
}

describe("buildCodeGraph", () => {
	it("includes context-core exports and depends-on to workspace packages", () => {
		const root = repoRoot();
		const g = buildCodeGraph(root, {
			includePackages: ["@worken/context-core"],
		});
		const ids = new Set(g.nodes.map((n) => n.id));
		assert.ok(ids.has("pkg.worken.context-core"));
		assert.ok(
			g.nodes.some(
				(n) => n.kind === "exported-symbol" && n.title === "buildContextBundle",
			),
		);
		assert.ok(
			g.edges.some(
				(e) =>
					e.kind === "depends-on" &&
					e.from === "pkg.worken.context-core" &&
					e.to.includes("platform-core"),
			),
		);
	});
});
