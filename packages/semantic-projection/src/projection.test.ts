import assert from "node:assert/strict";
import { compileSemantic, type SemanticSource } from "@worken/semantic-core";
import { compileSemanticIR } from "@worken/semantic-ir";
import { test } from "node:test";
import { projectAndRender, projectSemanticSlice } from "./pipeline.js";

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
				properties: {
					status: { type: "string" },
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
				op: "and",
				args: [
					{
						op: "eq",
						left: { scope: "object", path: "status" },
						right: "qualified",
					},
					{ op: "exists", value: { scope: "object", path: "phone" } },
				],
			},
		},
		{
			id: "projection.surface.candidate.detail",
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
			id: "rel.allow",
			kind: "allowed-for",
			from: "role.hr_manager",
			to: "action.candidate.schedule_interview",
		},
	],
};

test("projectSemanticSlice builds edges for action", () => {
	const ir = compileSemanticIR(compileSemantic(demo), {
		workspaceId: "w",
		semanticProtocolVersion: "0.1.0",
	});
	const m = projectSemanticSlice(ir, "action.candidate.schedule_interview");
	assert.ok(m);
	assert.ok(m.edges.some((e) => e.type === "reads" && e.to.includes("status")));
	assert.ok(m.edges.some((e) => e.type === "guards"));
	assert.ok(m.edges.some((e) => e.type === "renders"));
});

test("projectAndRender formats", () => {
	const ir = compileSemanticIR(compileSemantic(demo), {
		workspaceId: "w",
		semanticProtocolVersion: "0.1.0",
	});
	const json = projectAndRender(
		ir,
		"action.candidate.schedule_interview",
		"json",
	);
	assert.ok(json?.includes('"focus"'));
	const llm = projectAndRender(ir, "action.candidate.schedule_interview", "llm");
	assert.ok(llm?.includes("Focus"));
	const mer = projectAndRender(
		ir,
		"action.candidate.schedule_interview",
		"mermaid",
	);
	assert.ok(mer?.includes("flowchart TD"));
});
