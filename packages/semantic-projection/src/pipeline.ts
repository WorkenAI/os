import type { SemanticIR } from "@worken/semantic-ir";
import { buildProjectionModel, type BuildProjectionOptions } from "./build-projection.js";
import type { ProjectionModel, RenderFormat } from "./projection-model.js";
import { renderProjection, type RenderProjectionOptions } from "./render.js";
import { resolveSlice } from "./slice.js";

export function projectSemanticSlice(
	ir: SemanticIR,
	targetId: string,
	buildOptions?: BuildProjectionOptions,
): ProjectionModel | null {
	const slice = resolveSlice(ir, targetId);
	if (!slice) {
		return null;
	}
	return buildProjectionModel(ir, slice, buildOptions);
}

export function projectAndRender(
	ir: SemanticIR,
	targetId: string,
	format: RenderFormat,
	options?: BuildProjectionOptions & RenderProjectionOptions,
): string | null {
	const model = projectSemanticSlice(ir, targetId, options);
	if (!model) {
		return null;
	}
	return renderProjection(model, format, options);
}
