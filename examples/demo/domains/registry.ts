import { DOMAIN_IDS, DOMAIN_MANIFESTS } from "./catalog";
import type { DomainDefinition } from "./types";

export { DOMAIN_IDS, DOMAIN_MANIFESTS } from "./catalog";

export function isKnownDomainId(id: string): boolean {
	return DOMAIN_MANIFESTS.some((candidate) => candidate.id === id);
}

export function getDomain(domainId: string): DomainDefinition {
	const domain = DOMAIN_MANIFESTS.find(
		(candidate) => candidate.id === domainId,
	);
	if (!domain) throw new Error(`Unknown domain: ${domainId}`);
	return domain;
}

/** Non-throwing lookup — use when reconciling persisted policy with the current manifest set. */
export function tryGetDomain(domainId: string): DomainDefinition | null {
	return (
		DOMAIN_MANIFESTS.find((candidate) => candidate.id === domainId) ?? null
	);
}

export async function loadDomain(domainId: string): Promise<DomainDefinition> {
	return getDomain(domainId);
}
