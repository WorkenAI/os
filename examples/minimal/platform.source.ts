import type { PlatformSource } from "@worken/platform-core";

export const minimalPlatformSource: PlatformSource = {
	version: "0.1.0",
	nodes: [
		{
			id: "subsystem.integrations",
			kind: "subsystem",
			title: "Integrations",
			summary: "Connects external systems to Worken semantics.",
		},
		{
			id: "package.platform-mcp",
			kind: "package",
			title: "platform-mcp",
			summary: "Read-only MCP delivery for platform truth.",
		},
		{
			id: "contract.context-bundle",
			kind: "contract",
			title: "Context bundle",
			summary: "Compact agent-oriented context assembly.",
		},
		{
			id: "invariant.adapter.no-business-ownership",
			kind: "invariant",
			title: "Adapter does not own business semantics",
			statement:
				"Adapters translate transport and payloads, but do not define business truth.",
			status: "stable",
			canonical: true,
		},
		{
			id: "example.minimal-adapter",
			kind: "example",
			title: "Minimal adapter",
			exampleKind: "adapter",
		},
		{
			id: "glossary.platform.mcp",
			kind: "glossary-term",
			title: "MCP",
			definition: "Model Context Protocol; transport for tools and resources.",
		},
	],
	relations: [
		{
			id: "r1",
			kind: "contains",
			from: "subsystem.integrations",
			to: "package.platform-mcp",
		},
		{
			id: "r2",
			kind: "implements",
			from: "package.platform-mcp",
			to: "contract.context-bundle",
		},
	],
};
