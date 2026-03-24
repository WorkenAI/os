import assert from "node:assert/strict";
import { compileSemantic, type SemanticSource } from "@worken/semantic-core";
import { test } from "node:test";
import { compileSemanticIR } from "./compile.js";

const demo: SemanticSource = {
	protocolVersion: "0.1.0",
	nodes: [
		{
			id: "domain.demo",
			kind: "domain",
			title: "Demo",
		},
		{
			id: "object.candidate",
			kind: "object",
			title: "Candidate",
			domainId: "domain.demo",
			schema: {
				type: "object",
				required: ["status"],
				properties: {
					status: {
						type: "string",
						enum: ["new", "qualified", "rejected"],
					},
					phone: { type: "string" },
				},
			},
		},
		{
			id: "role.hr_manager",
			kind: "role",
			title: "HR Manager",
		},
		{
			id: "action.candidate.schedule_interview",
			kind: "action",
			title: "Schedule interview",
			domainId: "domain.demo",
			objectId: "object.candidate",
			when: {
				op: "eq",
				left: { scope: "object", path: "status" },
				right: "qualified",
			},
		},
		{
			id: "projection.candidate.detail",
			kind: "projection",
			title: "Candidate detail",
			target: "model-context",
			payload: {
				id: "surface.candidate.detail",
				title: "Candidate detail",
				entity: "candidate",
				actionBindings: ["action.candidate.schedule_interview"],
			},
		},
	],
	relations: [
		{
			id: "rel.allow.schedule",
			kind: "allowed-for",
			from: "role.hr_manager",
			to: "action.candidate.schedule_interview",
		},
	],
};

test("compileSemanticIR is deterministic snapshot for same graph", () => {
	const g = compileSemantic(demo);
	const a = compileSemanticIR(g, {
		workspaceId: "test",
		semanticProtocolVersion: "0.1.0",
	});
	const b = compileSemanticIR(g, {
		workspaceId: "test",
		semanticProtocolVersion: "0.1.0",
	});
	assert.equal(a.schema.snapshotId, b.schema.snapshotId);
	assert.ok(a.actions["action.candidate.schedule_interview"]);
	assert.equal(
		a.policies["policy.action.candidate.schedule_interview.default"]?.subjects[0],
		"role.hr_manager",
	);
	const surf = a.surfaces["surface.candidate.detail"];
	assert.ok(surf);
	assert.equal(surf.projectionTarget, "model-context");
});

test("different workspaceId changes schema but not body hash", () => {
	const g = compileSemantic(demo);
	const a = compileSemanticIR(g, {
		workspaceId: "a",
		semanticProtocolVersion: "0.1.0",
	});
	const b = compileSemanticIR(g, {
		workspaceId: "b",
		semanticProtocolVersion: "0.1.0",
	});
	assert.notEqual(a.schema.workspaceId, b.schema.workspaceId);
	assert.equal(a.schema.snapshotId, b.schema.snapshotId);
});
