export { compileSemanticIR } from "./compile.js";
export type { CompileSemanticIROptions } from "./compile.js";
export {
	explainAction,
	listAllowedActions,
	type ExplainActionInput,
	type ExplainActionResult,
	type ListAllowedActionsInput,
} from "./explain.js";
export type {
	ActionIRNode,
	BindingIRNode,
	EntityFieldSpec,
	EntityNode,
	PolicyIRNode,
	RoleKind,
	RoleNode,
	SemanticIR,
	SemanticIRSchemaMeta,
	SurfaceIRNode,
	TransitionIRNode,
} from "./model.js";
