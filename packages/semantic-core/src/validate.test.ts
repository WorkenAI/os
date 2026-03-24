import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileSemantic } from "./compile.js";
import { SemanticCompileError, validateSemanticStructure } from "./validate.js";

describe("validateSemanticStructure", () => {
	it("rejects action with invalid blockedBy ref", () => {
		assert.throws(
			() =>
				validateSemanticStructure(
					[
						{ id: "domain.d", kind: "domain", title: "D" },
						{
							id: "object.o",
							kind: "object",
							title: "O",
							domainId: "domain.d",
							schema: {},
						},
						{
							id: "action.a",
							kind: "action",
							title: "A",
							domainId: "domain.d",
							objectId: "object.o",
							blockedBy: ["no-such-blocker"],
						},
					],
					[],
				),
			SemanticCompileError,
		);
	});
});

describe("compileSemantic validation", () => {
	it("runs validateSemanticStructure", () => {
		assert.throws(
			() =>
				compileSemantic({
					protocolVersion: "0.1.0",
					nodes: [
						{ id: "domain.d", kind: "domain", title: "D" },
						{
							id: "object.o",
							kind: "object",
							title: "O",
							domainId: "domain.d",
							schema: {},
						},
						{
							id: "action.a",
							kind: "action",
							title: "A",
							domainId: "domain.d",
							objectId: "object.o",
							blockedBy: ["missing"],
						},
					],
				}),
			SemanticCompileError,
		);
	});
});
