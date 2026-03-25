import { DOMAIN_MANIFESTS } from "@worken/demo-data/domains/catalog";

export const DOMAIN_PRIMARY_COLORS = Object.fromEntries(
	DOMAIN_MANIFESTS.map((domain) => [domain.id, domain.accent.color]),
) as Record<string, string>;

export function resolveDomainPrimaryColor(domainId: string): string {
	return DOMAIN_PRIMARY_COLORS[domainId] ?? DOMAIN_PRIMARY_COLORS.hr;
}

export function hexToRgbCsv(hex: string): string {
	const normalized = hex.replace("#", "");
	const isShort = normalized.length === 3;
	const expanded = isShort
		? normalized
				.split("")
				.map((part) => `${part}${part}`)
				.join("")
		: normalized;

	const r = Number.parseInt(expanded.slice(0, 2), 16);
	const g = Number.parseInt(expanded.slice(2, 4), 16);
	const b = Number.parseInt(expanded.slice(4, 6), 16);

	return `${r}, ${g}, ${b}`;
}

export function withHexAlpha(hex: string, alphaHex: string): string {
	return `${hex}${alphaHex}`;
}
