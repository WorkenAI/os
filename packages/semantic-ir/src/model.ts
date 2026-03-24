import type { PredicateExpr } from "@worken/semantic-core";

/**
 * Stage 1 Semantic IR — canonical, headless, interface-agnostic.
 * @see docs/adrs/0004-semantic-ir.md
 */
export interface SemanticIRSchemaMeta {
	schemaVersion: string;
	/** Workspace or product id (e.g. monorepo product name) */
	workspaceId: string;
	/** Deterministic id from canonical IR payload (sha256 hex) */
	snapshotId: string;
	generatedAt: string;
	/** Protocol version of the source semantic graph */
	semanticProtocolVersion: string;
}

/** Entity field — semantic shape, not ORM */
export interface EntityFieldSpec {
	type: "string" | "number" | "boolean" | "enum";
	required?: boolean;
	values?: string[];
	format?: string;
}

export interface EntityNode {
	id: string;
	title: string;
	fields: Record<string, EntityFieldSpec>;
}

export type RoleKind = "human" | "agent" | "system";

export interface RoleNode {
	id: string;
	title: string;
	kind?: RoleKind;
}

export interface ActionIRNode {
	id: string;
	title: string;
	domainId: string;
	objectId: string;
	objectType: string;
	inputSchema?: unknown;
	/** Operational gate from semantic graph (same as ActionNode.when) */
	when?: PredicateExpr;
}

export interface PolicyIRNode {
	id: string;
	actionId: string;
	effect: "allow";
	subjects: string[];
	when?: PredicateExpr;
	reasonTemplates?: {
		allow?: string;
		deny?: string;
	};
}

export interface SurfaceIRNode {
	id: string;
	title: string;
	entity: string;
	regions?: Record<string, string[]>;
	actionBindings: string[];
}

export interface TransitionIRNode {
	id: string;
	entity: string;
	from: string;
	to: string;
	actionId: string;
}

export interface BindingIRNode {
	actionId: string;
	tool?: string;
	workflow?: string;
	uiIntent?: string;
}

export interface SemanticIR {
	schema: SemanticIRSchemaMeta;
	entities: Record<string, EntityNode>;
	roles: Record<string, RoleNode>;
	actions: Record<string, ActionIRNode>;
	policies: Record<string, PolicyIRNode>;
	surfaces: Record<string, SurfaceIRNode>;
	transitions: Record<string, TransitionIRNode>;
	bindings: Record<string, BindingIRNode>;
}
