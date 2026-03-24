import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compilePlatform, relatedPlatformNodes } from "./compile.js";

describe("compilePlatform", () => {
	it("builds graph indexes", () => {
		const g = compilePlatform({
			version: "0.1.0",
			nodes: [
				{ id: "sub.a", kind: "subsystem", title: "A" },
				{ id: "pkg.b", kind: "package", title: "B" },
			],
			relations: [{ id: "r1", kind: "contains", from: "sub.a", to: "pkg.b" }],
		});
		assert.equal(g.byId.get("pkg.b")?.kind, "package");
		assert.equal(g.outgoing.get("sub.a")?.[0]?.to, "pkg.b");
	});
});

describe("relatedPlatformNodes", () => {
	it("returns neighbors by relation", () => {
		const g = compilePlatform({
			version: "0.1.0",
			nodes: [
				{ id: "sub.a", kind: "subsystem", title: "A" },
				{ id: "pkg.b", kind: "package", title: "B" },
				{ id: "inv.c", kind: "invariant", title: "C", statement: "Always" },
			],
			relations: [
				{ id: "r1", kind: "contains", from: "sub.a", to: "pkg.b" },
				{ id: "r2", kind: "constrains", from: "inv.c", to: "pkg.b" },
			],
		});
		const related = relatedPlatformNodes(g, "pkg.b");
		const kinds = new Set(related.map((n) => n.id));
		assert.ok(kinds.has("sub.a"));
		assert.ok(kinds.has("inv.c"));
	});
});
