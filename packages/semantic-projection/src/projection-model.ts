/**
 * Normalized view for visualization — not canonical source (Semantic IR is).
 * @see docs/adrs/0005-semantic-projection-engine.md
 */
export type ProjectionFocusKind =
	| "entity"
	| "action"
	| "policy"
	| "workflow"
	| "surface"
	| "role"
	| "field"
	| "tool";

export interface ProjectionFocus {
	id: string;
	kind: ProjectionFocusKind;
	title: string;
	summary?: string;
}

export interface ProjectionNode {
	id: string;
	kind: string;
	title: string;
	attrs?: Record<string, string | number | boolean>;
}

export type ProjectionEdgeType =
	| "reads"
	| "writes"
	| "guards"
	| "renders"
	| "invokes"
	| "binds_to"
	| "depends_on";

export interface ProjectionEdge {
	from: string;
	to: string;
	type: ProjectionEdgeType;
	label?: string;
}

export interface ProjectionDiagnostic {
	id: string;
	severity: "info" | "warning" | "error";
	message: string;
	nodeId?: string;
}

export interface ProjectionNarrative {
	purpose?: string;
	whyAllowed?: string[];
	whyDenied?: string[];
	nextSteps?: string[];
}

export interface ProjectionModel {
	focus: ProjectionFocus;
	nodes: ProjectionNode[];
	edges: ProjectionEdge[];
	diagnostics?: ProjectionDiagnostic[];
	narrative?: ProjectionNarrative;
	/** IR snapshot id when projection was built */
	snapshotId?: string;
}

export type RenderFormat = "json" | "llm" | "ascii" | "mermaid";

export type AsciiMode = "compact" | "expanded";
