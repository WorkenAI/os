import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileSemantic } from "./compile.js";
import { mergeSemanticSources } from "./merge.js";

describe("mergeSemanticSources", () => {
	it("later source overrides node id", () => {
		const m = mergeSemanticSources(
			{
				protocolVersion: "0.1.0",
				nodes: [{ id: "domain.a", kind: "domain", title: "First" }],
			},
			{
				protocolVersion: "0.2.0",
				nodes: [{ id: "domain.a", kind: "domain", title: "Second" }],
			},
		);
		const g = compileSemantic(m);
		assert.equal(g.byId.get("domain.a")?.title, "Second");
	});
});
