import type { CodeRef } from "@worken/platform-core";

export interface ContextBundle {
	id: string;
	title: string;
	summary: string;

	task?: string;
	area?: string;

	glossary: {
		id: string;
		title: string;
		summary?: string;
	}[];

	invariants: {
		id: string;
		statement: string;
		severity?: "warn" | "error";
	}[];

	examples: {
		id: string;
		title: string;
		refs?: CodeRef[];
	}[];

	relatedNodes: {
		id: string;
		kind: string;
		title: string;
		whyRelevant?: string;
	}[];

	risks: string[];
	nextQuestions: string[];
}
