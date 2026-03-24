export { buildProjectionModel, type BuildProjectionOptions } from "./build-projection.js";
export { collectObjectFieldPaths } from "./predicate-paths.js";
export type {
	AsciiMode,
	ProjectionDiagnostic,
	ProjectionEdge,
	ProjectionFocus,
	ProjectionModel,
	ProjectionNarrative,
	ProjectionNode,
	RenderFormat,
} from "./projection-model.js";
export { projectAndRender, projectSemanticSlice } from "./pipeline.js";
export { renderProjection, type RenderProjectionOptions } from "./render.js";
export { resolveSlice, type SemanticSlice, type SliceTargetKind } from "./slice.js";
