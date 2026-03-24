export { compileSemantic, evaluateAction } from "./compile.js";
export { mergeSemanticSources } from "./merge.js";
export type {
	ActionNode,
	BindingNode,
	BlockerNode,
	DomainNode,
	EffectNode,
	GlossaryTermSemanticNode,
	LiteralValue,
	ObjectNode,
	PredicateExpr,
	ProjectionNode,
	RoleNode,
	SemanticGraph,
	SemanticNode,
	SemanticNodeBase,
	SemanticNodeKind,
	SemanticRelation,
	SemanticRelationKind,
	SemanticSource,
	ValueRef,
} from "./model.js";
export type { EvaluationInput } from "./predicate.js";
export { evaluatePredicate } from "./predicate.js";
export { SemanticCompileError, validateSemanticStructure } from "./validate.js";
