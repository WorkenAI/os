import {
	defineActionCards,
	standardCrudActionCards,
} from "../semantic/action-card";

/** Semantic Protocol action cards for Sales — mirrors `entities` / `entity.actions` verb ids. */
export const SALES_ACTION_CARDS = defineActionCards([
	...standardCrudActionCards({
		domain: "sales",
		object: "lead",
		roles: ["operator", "maintainer"],
	}),
	...standardCrudActionCards({
		domain: "sales",
		object: "deal",
		roles: ["operator", "maintainer"],
	}),
	...standardCrudActionCards({
		domain: "sales",
		object: "contact",
		roles: ["operator", "maintainer"],
	}),
]);
