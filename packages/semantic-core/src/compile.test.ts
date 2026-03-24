import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileSemantic, evaluateAction } from "./compile.js";

describe("compileSemantic", () => {
	it("indexes nodes and relations", () => {
		const g = compileSemantic({
			protocolVersion: "0.1.0",
			nodes: [
				{ id: "domain.a", kind: "domain", title: "A" },
				{
					id: "object.b",
					kind: "object",
					title: "B",
					domainId: "domain.a",
					schema: {},
				},
			],
			relations: [
				{ id: "r1", kind: "belongs-to", from: "object.b", to: "domain.a" },
			],
		});
		assert.equal(g.byId.get("domain.a")?.kind, "domain");
		assert.equal(g.outgoing.get("object.b")?.[0]?.kind, "belongs-to");
		assert.equal(g.incoming.get("domain.a")?.[0]?.from, "object.b");
	});
});

describe("evaluateAction", () => {
	it("allows when predicate passes", () => {
		const g = compileSemantic({
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
					id: "action.test",
					kind: "action",
					title: "Test",
					domainId: "domain.d",
					objectId: "object.o",
					when: {
						op: "eq",
						left: { scope: "object", path: "status" },
						right: "ready",
					},
				},
			],
		});
		const r = evaluateAction(g, {
			actionId: "action.test",
			subject: {},
			object: { status: "ready" },
		});
		assert.equal(r.allowed, true);
		assert.equal(r.blockers.length, 0);
	});

	it("blocks and returns blockers when predicate fails", () => {
		const g = compileSemantic({
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
					id: "blocker.bad",
					kind: "blocker",
					title: "Bad",
					code: "bad",
					message: "Not ready",
				},
				{
					id: "action.test",
					kind: "action",
					title: "Test",
					domainId: "domain.d",
					objectId: "object.o",
					when: {
						op: "eq",
						left: { scope: "object", path: "status" },
						right: "ready",
					},
					blockedBy: ["blocker.bad"],
				},
			],
		});
		const r = evaluateAction(g, {
			actionId: "action.test",
			subject: {},
			object: { status: "pending" },
		});
		assert.equal(r.allowed, false);
		assert.equal(r.blockers[0]?.code, "bad");
	});
});
