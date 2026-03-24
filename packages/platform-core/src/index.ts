export { compilePlatform, relatedPlatformNodes } from "./compile.js";
export { mergePlatformSources } from "./merge.js";
export type {
	AdrNode,
	CodeRef,
	ContractNode,
	ExampleNode,
	ExtensionPointNode,
	FlowNode,
	GlossaryTermNode,
	InvariantNode,
	PackageNode,
	PlatformGraph,
	PlatformNode,
	PlatformNodeBase,
	PlatformNodeKind,
	PlatformRelation,
	PlatformRelationKind,
	PlatformSource,
	SubsystemNode,
} from "./model.js";
export { PlatformCompileError, validatePlatformStructure } from "./validate.js";
