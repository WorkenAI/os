import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession } from "./index.js";

describe("createSession", () => {
	it("initializes focus arrays", () => {
		const s = createSession({ id: "s1", actorId: "a1" });
		assert.deepEqual(s.semanticFocusIds, []);
		assert.deepEqual(s.platformFocusIds, []);
	});
});
