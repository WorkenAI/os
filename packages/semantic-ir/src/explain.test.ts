import assert from "node:assert/strict";
import { compileSemantic, type SemanticSource } from "@worken/semantic-core";
import { test } from "node:test";
import { compileSemanticIR } from "./compile.js";
import { explainAction, listAllowedActions } from "./explain.js";

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

test("explainAction allows when predicate and role match", () => {
	const ir = compileSemanticIR(compileSemantic(demo), {
		workspaceId: "w",
		semanticProtocolVersion: "0.1.0",
	});
	const ok = explainAction(ir, {
		actionId: "action.candidate.schedule_interview",
		roleId: "role.hr_manager",
		subject: {},
		object: { status: "qualified" },
	});
	assert.equal(ok.allowed, true);
});

test("explainAction denies wrong role", () => {
	const ir = compileSemanticIR(compileSemantic(demo), {
		workspaceId: "w",
		semanticProtocolVersion: "0.1.0",
	});
	const bad = explainAction(ir, {
		actionId: "action.candidate.schedule_interview",
		roleId: "role.other",
		subject: {},
		object: { status: "qualified" },
	});
	assert.equal(bad.allowed, false);
});

test("listAllowedActions respects predicates", () => {
	const ir = compileSemanticIR(compileSemantic(demo), {
		workspaceId: "w",
		semanticProtocolVersion: "0.1.0",
	});
	const allowed = listAllowedActions(ir, {
		roleId: "role.hr_manager",
		subject: {},
		object: { status: "new" },
	});
	assert.equal(allowed.includes("action.candidate.schedule_interview"), false);
	const allowed2 = listAllowedActions(ir, {
		roleId: "role.hr_manager",
		subject: {},
		object: { status: "qualified" },
	});
	assert.ok(allowed2.includes("action.candidate.schedule_interview"));
});
