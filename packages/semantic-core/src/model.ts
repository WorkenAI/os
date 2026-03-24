export type SemanticNodeKind =
	| "domain"
	| "object"
	| "role"
	| "action"
	| "blocker"
	| "effect"
	| "binding"
	| "projection"
	| "glossary-term";

export type SemanticRelationKind =
	| "belongs-to"
	| "acts-on"
	| "allowed-for"
	| "blocked-by"
	| "has-effect"
	| "bound-to"
	| "projects-to"
	| "see-also";

export interface SemanticNodeBase {
	id: string;
	kind: SemanticNodeKind;
	title: string;
	summary?: string;
	tags?: string[];
	deprecatedSince?: string;
	supersededBy?: string;
}

export interface DomainNode extends SemanticNodeBase {
	kind: "domain";
}

export interface ObjectNode extends SemanticNodeBase {
	kind: "object";
	domainId: string;
	schema: unknown;
}

export interface RoleNode extends SemanticNodeBase {
	kind: "role";
}

export type PredicateExpr =
	| { op: "eq"; left: ValueRef; right: LiteralValue }
	| { op: "exists"; value: ValueRef }
	| { op: "and"; args: PredicateExpr[] }
	| { op: "or"; args: PredicateExpr[] }
	| { op: "not"; arg: PredicateExpr };

export type ValueRef =
	| { scope: "object"; path: string }
	| { scope: "subject"; path: string }
	| { scope: "context"; path: string };

export type LiteralValue = string | number | boolean | null;

export interface ActionNode extends SemanticNodeBase {
	kind: "action";
	domainId: string;
	objectId: string;
	inputSchema?: unknown;
	outputSchema?: unknown;
	when?: PredicateExpr;
	blockedBy?: string[];
	effects?: string[];
	bindingId?: string;
	projections?: string[];
}

export interface BlockerNode extends SemanticNodeBase {
	kind: "blocker";
	code: string;
	message: string;
	remediation?: string;
	responsibleRole?: string;
	severity?: "info" | "warn" | "error";
}

export interface EffectNode extends SemanticNodeBase {
	kind: "effect";
	effectKind: "state-change" | "notification" | "review" | "external-call";
}

export interface BindingNode extends SemanticNodeBase {
	kind: "binding";
	bindingKind: "handler" | "tool" | "workflow-step" | "external-port";
	key: string;
	approvalRequired?: boolean;
	sideEffectClass?: "none" | "local" | "external";
}

export interface ProjectionNode extends SemanticNodeBase {
	kind: "projection";
	target: "web-shell" | "chat-shell" | "voice-shell" | "api" | "model-context";
	payload: unknown;
}

export interface GlossaryTermSemanticNode extends SemanticNodeBase {
	kind: "glossary-term";
	definition?: string;
}

export type SemanticNode =
	| DomainNode
	| ObjectNode
	| RoleNode
	| ActionNode
	| BlockerNode
	| EffectNode
	| BindingNode
	| ProjectionNode
	| GlossaryTermSemanticNode;

export interface SemanticRelation {
	id: string;
	kind: SemanticRelationKind;
	from: string;
	to: string;
}

export interface SemanticSource {
	protocolVersion: string;
	nodes: SemanticNode[];
	relations?: SemanticRelation[];
}

export interface SemanticGraph {
	protocolVersion: string;
	nodes: SemanticNode[];
	relations: SemanticRelation[];
	byId: Map<string, SemanticNode>;
	outgoing: Map<string, SemanticRelation[]>;
	incoming: Map<string, SemanticRelation[]>;
}
