export type PlatformNodeKind =
	| "subsystem"
	| "package"
	| "contract"
	| "invariant"
	| "flow"
	| "adr"
	| "example"
	| "glossary-term"
	| "extension-point";

export type PlatformRelationKind =
	| "contains"
	| "depends-on"
	| "implements"
	| "constrains"
	| "documents"
	| "example-of"
	| "supersedes"
	| "see-also";

export interface CodeRef {
	kind: "file" | "package" | "export" | "adr";
	target: string;
	note?: string;
}

export interface PlatformNodeBase {
	id: string;
	kind: PlatformNodeKind;
	title: string;
	summary?: string;
	canonical?: boolean;
	status?: "draft" | "stable" | "deprecated";
	refs?: CodeRef[];
}

export interface SubsystemNode extends PlatformNodeBase {
	kind: "subsystem";
	owns?: string[];
	doesNotOwn?: string[];
}

export interface PackageNode extends PlatformNodeBase {
	kind: "package";
	publicApi?: string[];
	owns?: string[];
	doesNotOwn?: string[];
}

export interface ContractNode extends PlatformNodeBase {
	kind: "contract";
	inputs?: string[];
	outputs?: string[];
}

export interface InvariantNode extends PlatformNodeBase {
	kind: "invariant";
	statement: string;
	severity?: "warn" | "error";
}

export interface FlowNode extends PlatformNodeBase {
	kind: "flow";
	steps: { id: string; title: string; summary?: string }[];
}

export interface AdrNode extends PlatformNodeBase {
	kind: "adr";
	adrId: string;
}

export interface ExampleNode extends PlatformNodeBase {
	kind: "example";
	exampleKind: "package" | "adapter" | "workflow" | "contract" | "mcp";
}

export interface GlossaryTermNode extends PlatformNodeBase {
	kind: "glossary-term";
	definition?: string;
}

export interface ExtensionPointNode extends PlatformNodeBase {
	kind: "extension-point";
	extensionKind?: string;
}

export type PlatformNode =
	| SubsystemNode
	| PackageNode
	| ContractNode
	| InvariantNode
	| FlowNode
	| AdrNode
	| ExampleNode
	| GlossaryTermNode
	| ExtensionPointNode;

export interface PlatformRelation {
	id: string;
	kind: PlatformRelationKind;
	from: string;
	to: string;
}

export interface PlatformSource {
	version: string;
	nodes: PlatformNode[];
	relations?: PlatformRelation[];
}

export interface PlatformGraph {
	version: string;
	nodes: PlatformNode[];
	relations: PlatformRelation[];
	byId: Map<string, PlatformNode>;
	outgoing: Map<string, PlatformRelation[]>;
	incoming: Map<string, PlatformRelation[]>;
}
