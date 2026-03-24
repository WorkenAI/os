import type { SemanticSource } from "@worken/semantic-core";

export const minimalSemanticSource: SemanticSource = {
	protocolVersion: "0.1.0",
	nodes: [
		{
			id: "domain.integrations",
			kind: "domain",
			title: "Integrations",
		},
		{
			id: "object.adapter",
			kind: "object",
			title: "Adapter",
			domainId: "domain.integrations",
			schema: {},
		},
		{
			id: "glossary.semantic.adapter",
			kind: "glossary-term",
			title: "Adapter (semantic)",
			summary: "Boundary object for external system integration.",
		},
	],
};
