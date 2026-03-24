import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compilePlatform } from "@worken/platform-core";
import { compileSemantic } from "@worken/semantic-core";
import { buildContextBundle } from "./build.js";

describe("buildContextBundle add_adapter", () => {
	it("includes integration invariant and related nodes", () => {
		const semantic = compileSemantic({
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
			],
		});
		const platform = compilePlatform({
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
					summary: "MCP delivery for platform truth.",
				},
				{
					id: "contract.context-bundle",
					kind: "contract",
					title: "Context bundle",
					summary: "Compact agent context.",
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
		});
		const bundle = buildContextBundle({
			task: "add_adapter",
			area: "integrations",
			semantic,
			platform,
			depth: "compact",
		});
		assert.equal(bundle.task, "add_adapter");
		assert.ok(
			bundle.invariants.some(
				(i) => i.id === "invariant.adapter.no-business-ownership",
			),
		);
		assert.ok(
			bundle.relatedNodes.some((n) => n.id === "subsystem.integrations"),
		);
		assert.ok(bundle.risks.length > 0);
	});
});
