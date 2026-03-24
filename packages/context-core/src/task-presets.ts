export type TaskPresetId =
	| "onboard_repo"
	| "understand_subsystem"
	| "add_adapter"
	| "change_contract"
	| "change_invariant"
	| "add_mcp_resource";

export interface TaskPreset {
	id: TaskPresetId;
	title: string;
	summary: string;
	risks: string[];
	nextQuestions: string[];
	/** Match platform subsystem or package ids containing this substring (case-insensitive) */
	areaHints?: string[];
	/** Extra terms to match invariant ids/titles when selecting context (OR with area filter) */
	invariantKeywords?: string[];
}

export const TASK_PRESETS: Record<TaskPresetId, TaskPreset> = {
	onboard_repo: {
		id: "onboard_repo",
		title: "Onboard to repository",
		summary:
			"Build a mental model of subsystems, packages, and contracts before changing code.",
		risks: [
			"Assuming folder layout equals semantic truth without checking the platform graph.",
			"Skipping invariants that constrain public APIs.",
		],
		nextQuestions: [
			"Which subsystem owns the change you are about to make?",
			"Which contracts does this code implement?",
		],
	},
	understand_subsystem: {
		id: "understand_subsystem",
		title: "Understand a subsystem",
		summary:
			"Collect owned packages, contracts, flows, and glossary terms for one subsystem.",
		risks: [
			"Mixing contributor/platform concerns with runtime business semantics.",
			"Missing extension points that affect integration boundaries.",
		],
		nextQuestions: [
			"What does this subsystem explicitly not own?",
			"Which ADRs document non-obvious decisions?",
		],
		areaHints: ["subsystem"],
	},
	add_adapter: {
		id: "add_adapter",
		title: "Add a new adapter",
		summary:
			"Translate external transport and payloads without owning business semantics.",
		risks: [
			"Encoding business rules in the adapter instead of semantic/core layers.",
			"Leaking side effects across boundaries without contract review.",
		],
		nextQuestions: [
			"Which contract defines the adapter surface?",
			"Which invariants forbid owning domain truth in adapters?",
		],
		areaHints: ["integrations", "adapter", "platform-mcp"],
		invariantKeywords: ["adapter", "integration"],
	},
	change_contract: {
		id: "change_contract",
		title: "Change a contract",
		summary:
			"Review dependents, invariants, and examples before changing inputs/outputs.",
		risks: [
			"Breaking consumers that are not visible in the same folder.",
			"Drift between documented contract and implementation.",
		],
		nextQuestions: [
			"Who is allowed to depend on this contract?",
			"Is this a breaking change or a compatible extension?",
		],
	},
	change_invariant: {
		id: "change_invariant",
		title: "Change an invariant",
		summary:
			"Invariants are global constraints; trace impact across packages and flows.",
		risks: [
			"Weakening invariants without updating ADRs or examples.",
			"Conflicting invariants across subsystems.",
		],
		nextQuestions: [
			"Which packages does this invariant constrain?",
			"Is severity warn vs error still correct?",
		],
	},
	add_mcp_resource: {
		id: "add_mcp_resource",
		title: "Add an MCP resource",
		summary:
			"Expose read-only platform truth with stable URIs and clear scope.",
		risks: [
			"Exposing mutable or sensitive data through read-only resources.",
			"URI patterns that do not compose with future clients.",
		],
		nextQuestions: [
			"Which platform graph nodes back this resource?",
			"Should this be a resource template or a static URI?",
		],
		areaHints: ["mcp", "platform-mcp"],
	},
};

export function isTaskPresetId(task: string): task is TaskPresetId {
	return task in TASK_PRESETS;
}
