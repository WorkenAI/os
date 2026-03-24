import type { SemanticSource } from "@worken/semantic-core";

/**
 * Recruitment slice used for Semantic IR demos (landing baseline + repo MCP merge).
 * Pair with `buildSemanticSourceForRepo()` from `@worken/repo-mcp` for the same anchor
 * the monorepo MCP uses.
 */
export const landingSemanticSource: SemanticSource = {
	protocolVersion: "0.1.0",
	nodes: [
		{
			id: "domain.demo-recruitment",
			kind: "domain",
			title: "Recruitment (demo)",
			summary: "Illustrative domain for Semantic IR tooling",
		},
		{
			id: "object.candidate",
			kind: "object",
			title: "Candidate",
			domainId: "domain.demo-recruitment",
			schema: {
				type: "object",
				required: ["status"],
				properties: {
					status: {
						type: "string",
						enum: ["new", "screening", "qualified", "rejected", "hired"],
					},
					phone: { type: "string" },
					name: { type: "string" },
				},
			},
		},
		{
			id: "role.hr_manager",
			kind: "role",
			title: "HR Manager",
		},
		{
			id: "role.recruiter_bot",
			kind: "role",
			title: "Recruiter Bot",
		},
		{
			id: "action.candidate.schedule_interview",
			kind: "action",
			title: "Schedule interview",
			domainId: "domain.demo-recruitment",
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
			title: "Candidate detail surface",
			target: "model-context",
			payload: {
				id: "surface.candidate.detail",
				title: "Candidate detail",
				entity: "candidate",
				regions: {
					header: ["candidate.name", "candidate.status"],
					main: ["candidate.timeline"],
				},
				actionBindings: ["action.candidate.schedule_interview"],
			},
		},
	],
	relations: [
		{
			id: "rel.role.hr.schedule",
			kind: "allowed-for",
			from: "role.hr_manager",
			to: "action.candidate.schedule_interview",
		},
		{
			id: "rel.role.bot.schedule",
			kind: "allowed-for",
			from: "role.recruiter_bot",
			to: "action.candidate.schedule_interview",
		},
	],
};
