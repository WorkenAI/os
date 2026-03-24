import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compilePlatform } from "./compile.js";
import { mergePlatformSources } from "./merge.js";

describe("mergePlatformSources", () => {
	it("later source overrides node id", () => {
		const a = mergePlatformSources(
			{
				version: "0.1.0",
				nodes: [{ id: "pkg.a", kind: "package", title: "First" }],
			},
			{
				version: "0.2.0",
				nodes: [{ id: "pkg.a", kind: "package", title: "Second" }],
			},
		);
		const g = compilePlatform(a);
		assert.equal(g.byId.get("pkg.a")?.title, "Second");
		assert.equal(g.version, "0.2.0");
	});
});
