import type { SemanticSource } from "@worken/semantic-core";

/**
 * Landing baseline DSL: operational semantics + **surface projections** for the
 * interaction layers named in the Semantic Protocol (web / chat / voice / model-context).
 *
 * Web Shell surfaces use `target: "web-shell"` and optional `shellLayoutId` in the
 * payload so the Next.js shell registry (`DomainShellSurfaceLayoutId`) can align with IR.
 *
 * Pair with `buildSemanticSourceForRepo()` when merging into repo MCP.
 */
export const landingSemanticSource: SemanticSource = {
	protocolVersion: "0.1.0",
	nodes: [
		{
			id: "domain.worken.shell",
			kind: "domain",
			title: "Worken Shell",
			summary:
				"Platform shell: surfaces, navigation, and cross-cutting actions that make Web Shell UI possible.",
		},
		{
			id: "domain.demo-recruitment",
			kind: "domain",
			title: "Recruitment (demo)",
			summary: "Illustrative business domain for Semantic IR tooling",
		},
		{
			id: "object.shell_session",
			kind: "object",
			title: "Shell session",
			domainId: "domain.worken.shell",
			schema: {
				type: "object",
				required: ["activeDomainId", "activeViewId"],
				properties: {
					activeDomainId: { type: "string" },
					activeViewId: { type: "string" },
					layerId: { type: "string", enum: ["business", "roles"] },
				},
			},
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
			id: "role.shell_operator",
			kind: "role",
			title: "Shell operator",
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
			id: "action.shell.navigate",
			kind: "action",
			title: "Navigate shell",
			domainId: "domain.worken.shell",
			objectId: "object.shell_session",
			projections: [
				"projection.shell.web.default",
				"projection.shell.chat.primary",
				"projection.shell.voice.primary",
			],
		},
		{
			id: "action.candidate.schedule_interview",
			kind: "action",
			title: "Schedule interview",
			domainId: "domain.demo-recruitment",
			objectId: "object.candidate",
			projections: [
				"projection.candidate.web.pipeline",
				"projection.candidate.chat.followup",
				"projection.candidate.model.detail",
			],
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
			id: "projection.shell.web.default",
			kind: "projection",
			title: "Default Web Shell surface",
			target: "web-shell",
			payload: {
				id: "surface.shell.web.default",
				title: "Default shell (sidebar + conversation + inspector)",
				entity: "shell_session",
				shellLayoutId: "default",
				regions: {
					sidebar: ["shell.nav", "shell.actions"],
					conversation: ["shell.chat"],
					inspector: ["shell.selection"],
				},
				actionBindings: ["action.shell.navigate"],
			},
		},
		{
			id: "projection.shell.chat.primary",
			kind: "projection",
			title: "Primary chat shell",
			target: "chat-shell",
			payload: {
				id: "surface.shell.chat.primary",
				title: "Chat shell",
				entity: "shell_session",
				regions: {
					thread: ["shell.messages"],
					composer: ["shell.input"],
				},
				actionBindings: ["action.shell.navigate"],
			},
		},
		{
			id: "projection.shell.voice.primary",
			kind: "projection",
			title: "Primary voice shell",
			target: "voice-shell",
			payload: {
				id: "surface.shell.voice.primary",
				title: "Voice shell",
				entity: "shell_session",
				actionBindings: ["action.shell.navigate"],
			},
		},
		{
			id: "projection.candidate.web.pipeline",
			kind: "projection",
			title: "Candidate pipeline (web)",
			target: "web-shell",
			payload: {
				id: "surface.candidate.web.pipeline",
				title: "Candidate pipeline",
				entity: "candidate",
				shellLayoutId: "default",
				regions: {
					header: ["candidate.name", "candidate.status"],
					main: ["candidate.pipeline"],
				},
				actionBindings: ["action.candidate.schedule_interview"],
			},
		},
		{
			id: "projection.candidate.chat.followup",
			kind: "projection",
			title: "Candidate follow-up (chat)",
			target: "chat-shell",
			payload: {
				id: "surface.candidate.chat.followup",
				title: "Candidate follow-up",
				entity: "candidate",
				regions: {
					suggestions: ["next.actions"],
				},
				actionBindings: ["action.candidate.schedule_interview"],
			},
		},
		{
			id: "projection.candidate.model.detail",
			kind: "projection",
			title: "Candidate detail (model context)",
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
			id: "rel.role.shell.navigate",
			kind: "allowed-for",
			from: "role.shell_operator",
			to: "action.shell.navigate",
		},
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
