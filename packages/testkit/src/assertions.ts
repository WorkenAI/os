import assert from "node:assert/strict";
import type { ContextBundle } from "@worken/context-core";

export function expectBundleHasInvariant(
	bundle: ContextBundle,
	invariantId: string,
): void {
	const found = bundle.invariants.some((i) => i.id === invariantId);
	assert.ok(found, `Expected bundle to include invariant ${invariantId}`);
}

export function expectBundleHasRelated(
	bundle: ContextBundle,
	nodeId: string,
): void {
	const found = bundle.relatedNodes.some((n) => n.id === nodeId);
	assert.ok(found, `Expected bundle relatedNodes to include ${nodeId}`);
}
