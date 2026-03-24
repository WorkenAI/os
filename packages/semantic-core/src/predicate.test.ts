import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluatePredicate } from "./predicate.js";

describe("evaluatePredicate eq", () => {
	it("does not treat missing path as null", () => {
		const ok = evaluatePredicate(
			{
				op: "eq",
				left: { scope: "object", path: "x" },
				right: null,
			},
			{ subject: {}, object: {} },
		);
		assert.equal(ok, false);
	});
});
