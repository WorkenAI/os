/**
 * Authoring types for Worken OS Semantic Protocol action cards
 * (`docs/spec/semantic-protocol.md` — normative minimal schema).
 *
 * Predicate strings use the same surface syntax as the spec YAML (`object.status == "ready"`, …).
 */

export type PredicateExpressionString = string;

export type BlockerAuthoring = {
	code: string;
	message: string;
	/** Predicate for when this blocker applies (informative explanation path). */
	when?: PredicateExpressionString;
};

export type EffectAuthoring = {
	kind: string;
} & Record<string, unknown>;

export type UiHintsAuthoring = {
	label: string;
	priority?: "primary" | "secondary";
	showWhenBlocked?: boolean;
} & Record<string, unknown>;

/**
 * Human-authored action card aligned with the normative metadata object
 * (string predicates in `when` / blocker `when` — compiled to IR elsewhere).
 */
export type ActionCardAuthoring = {
	protocolVersion?: string;
	id: string;
	domain: string;
	object: string;
	action: string;
	title?: string;
	description?: string;
	roles: readonly string[];
	when: readonly PredicateExpressionString[];
	blocked: readonly BlockerAuthoring[];
	effects: readonly EffectAuthoring[];
	ui: UiHintsAuthoring;
	appliesTo?: readonly string[];
	tags?: readonly string[];
};

/** Stable semantic id: `domain.object.action` (spec: globally stable identifier). */
export function semanticActionId(
	domain: string,
	object: string,
	action: string,
): string {
	return `${domain}.${object}.${action}`;
}

export function defineActionCard<const T extends ActionCardAuthoring>(
	card: T,
): T {
	return card;
}

export function defineActionCards<
	const T extends readonly ActionCardAuthoring[],
>(cards: T): T {
	const seen = new Set<string>();
	for (const c of cards) {
		if (seen.has(c.id)) {
			throw new Error(`Duplicate action card id: ${c.id}`);
		}
		seen.add(c.id);
	}
	return cards;
}

const CRUD_LABELS = {
	create: "Create",
	edit: "Edit",
	delete: "Delete",
	approve: "Approve",
} as const;

type CrudVerb = keyof typeof CRUD_LABELS;

/**
 * Default CRUD-style cards for demo domains: empty `when` / `blocked` (always eligible for listed roles).
 * Entity manifests still list verb ids (`create`, …) — they must match `action` on each card.
 */
export function standardCrudActionCards(args: {
	domain: string;
	object: string;
	roles: readonly string[];
}): ActionCardAuthoring[] {
	return (Object.keys(CRUD_LABELS) as CrudVerb[]).map((verb) =>
		defineActionCard({
			protocolVersion: "0.1",
			id: semanticActionId(args.domain, args.object, verb),
			domain: args.domain,
			object: args.object,
			action: verb,
			roles: args.roles,
			when: [],
			blocked: [],
			effects: [{ kind: "object.touch", field: "updatedAt", value: "now" }],
			ui: {
				label: CRUD_LABELS[verb],
				priority: verb === "create" ? "primary" : "secondary",
			},
		}),
	);
}
