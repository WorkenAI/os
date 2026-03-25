import type { DomainDefinition } from "../types";
import type { ActionCardAuthoring } from "./action-card";
import { semanticActionId } from "./action-card";

/**
 * Ensures every `entity.actions[]` verb has a matching card and ids follow `semanticActionId`.
 * Call after `defineDomain` when `actionCards` is set.
 */
export function validateDomainActionCards(domain: DomainDefinition): void {
	const cards = domain.actionCards;
	if (!cards?.length) return;

	const byTriple = new Map<string, ActionCardAuthoring>();
	for (const c of cards) {
		const triple = `${c.domain}:${c.object}:${c.action}`;
		if (byTriple.has(triple)) {
			throw new Error(`Duplicate action card for ${triple}`);
		}
		byTriple.set(triple, c);
		if (c.domain !== domain.id) {
			throw new Error(
				`Action card domain "${c.domain}" !== manifest id "${domain.id}" (${c.id})`,
			);
		}
		const expectedId = semanticActionId(c.domain, c.object, c.action);
		if (c.id !== expectedId) {
			throw new Error(`Action card id "${c.id}" should be "${expectedId}"`);
		}
	}

	for (const entity of Object.values(domain.entities)) {
		for (const verb of entity.actions) {
			const key = `${domain.id}:${entity.id}:${verb}`;
			if (!byTriple.has(key)) {
				throw new Error(`Missing action card for entity action: ${key}`);
			}
		}
	}
}
