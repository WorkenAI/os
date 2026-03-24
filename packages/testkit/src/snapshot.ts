import type { ContextBundle } from "@worken/context-core";

/**
 * Stable JSON for snapshot tests (sorted keys).
 */
export function bundleSnapshotJson(bundle: ContextBundle): string {
	const sorted = stableSort(bundle);
	return `${JSON.stringify(sorted, null, 2)}\n`;
}

function stableSort(value: unknown): unknown {
	if (value === null || typeof value !== "object") {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map(stableSort);
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	const out: Record<string, unknown> = {};
	for (const k of keys) {
		out[k] = stableSort(obj[k]);
	}
	return out;
}
