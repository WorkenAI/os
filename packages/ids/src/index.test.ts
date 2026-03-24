import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { makeId, nodeRef } from "./index.js";

describe("@worken/ids", () => {
	it("makeId joins parts", () => {
		assert.equal(makeId(["a", "b", undefined, 1]), "a.b.1");
	});
	it("nodeRef", () => {
		assert.deepEqual(nodeRef("pkg", "foo"), { kind: "pkg", id: "foo" });
	});
});
