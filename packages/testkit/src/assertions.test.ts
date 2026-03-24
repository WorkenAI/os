import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContextBundle } from "@worken/context-core";
import { compilePlatform } from "@worken/platform-core";
import { compileSemantic } from "@worken/semantic-core";
import { expectBundleHasInvariant } from "./assertions.js";
import { createTestPlatformGraph, createTestSemanticGraph } from "./graphs.js";

describe("expectBundleHasInvariant", () => {
	it("passes when invariant present", () => {
		const platform = compilePlatform({
			version: "0.1.0",
			nodes: [
				{
					id: "invariant.x",
					kind: "invariant",
					title: "X",
					statement: "Always",
				},
			],
		});
		const bundle = buildContextBundle({
			task: "change_invariant",
			semantic: compileSemantic({ protocolVersion: "0.1.0", nodes: [] }),
			platform,
		});
		expectBundleHasInvariant(bundle, "invariant.x");
		assert.ok(true);
	});
});

describe("createTest graphs", () => {
	it("compile", () => {
		const s = createTestSemanticGraph();
		const p = createTestPlatformGraph();
		assert.ok(s.byId.size > 0);
		assert.ok(p.byId.size > 0);
	});
});
