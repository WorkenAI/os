/**
 * Normalized “code semantics” graph derived from the TypeScript program.
 * See docs/spec/code-semantics-bridge.md
 */
export type CodeGraphNodeKind =
	| "package"
	| "exported-symbol"
	| "contract-surface";

export type CodeGraphEdgeKind =
	| "exports"
	| "depends-on"
	| "uses-type-from"
	| "part-of-surface";

export interface CodeGraphNode {
	id: string;
	kind: CodeGraphNodeKind;
	title: string;
	/** npm package name for kind package */
	packageName?: string;
	/** workspace-relative dir e.g. packages/context-core */
	packageRoot?: string;
	/** tsconfig path used for this package */
	tsconfigPath?: string;
	/** for exported-symbol */
	symbolKind?:
		| "function"
		| "type"
		| "interface"
		| "class"
		| "const"
		| "enum"
		| "namespace"
		| "other";
	declaredIn?: string;
	exportedFrom?: string;
	signature?: string;
}

export interface CodeGraphEdge {
	id: string;
	kind: CodeGraphEdgeKind;
	from: string;
	to: string;
	/** imported/exported symbol name for uses-type-from */
	via?: string;
}

export interface CodeGraph {
	version: string;
	repoRoot: string;
	nodes: CodeGraphNode[];
	edges: CodeGraphEdge[];
}
