import {
	McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildContextBundle, buildImpactBundle } from "@worken/context-core";
import type { PlatformGraph } from "@worken/platform-core";
import { relatedPlatformNodes } from "@worken/platform-core";
import type { SemanticGraph } from "@worken/semantic-core";
import { z } from "zod";

function templateId(
	variables: Record<string, string | string[] | undefined>,
): string | undefined {
	const v = variables.id;
	if (v === undefined) {
		return undefined;
	}
	return Array.isArray(v) ? v[0] : v;
}

const THESIS_MARKDOWN = `# Worken headless kernel

Semantic graph plus platform graph plus context bundler. MCP is delivery; shells are renderers.

Flow: manifests + semantic source → graphs → context bundles → MCP.
`;

export interface PlatformMcpServerOptions {
	semantic: SemanticGraph;
	platform: PlatformGraph;
}

function jsonResource(
	uri: string,
	text: string,
): {
	contents: { uri: string; mimeType: string; text: string }[];
} {
	return {
		contents: [
			{
				uri,
				mimeType: "application/json",
				text,
			},
		],
	};
}

function textResource(
	uri: string,
	text: string,
	mimeType: string,
): { contents: { uri: string; mimeType: string; text: string }[] } {
	return {
		contents: [
			{
				uri,
				mimeType,
				text,
			},
		],
	};
}

export function createPlatformMcpServer(
	options: PlatformMcpServerOptions,
): McpServer {
	const { semantic, platform } = options;

	const mcp = new McpServer(
		{ name: "worken-platform", version: "0.0.1" },
		{
			instructions:
				"Read-only Worken platform MCP: graphs, invariants, examples, and task bundles. No writes.",
		},
	);

	mcp.registerResource(
		"thesis",
		"worken://thesis",
		{
			description: "High-level thesis for the headless kernel",
			mimeType: "text/markdown",
		},
		async (uri) =>
			textResource(uri.toString(), THESIS_MARKDOWN, "text/markdown"),
	);

	mcp.registerResource(
		"glossary",
		"worken://glossary",
		{
			description: "Combined glossary from platform and semantic graphs",
			mimeType: "application/json",
		},
		async () => {
			const terms: {
				id: string;
				title: string;
				summary?: string;
				source: string;
			}[] = [];
			for (const n of platform.nodes) {
				if (n.kind === "glossary-term") {
					const summary = n.summary ?? n.definition;
					terms.push(
						summary !== undefined
							? { id: n.id, title: n.title, summary, source: "platform" }
							: { id: n.id, title: n.title, source: "platform" },
					);
				}
			}
			for (const n of semantic.nodes) {
				if (n.kind === "glossary-term") {
					const summary = n.summary ?? n.definition;
					terms.push(
						summary !== undefined
							? { id: n.id, title: n.title, summary, source: "semantic" }
							: { id: n.id, title: n.title, source: "semantic" },
					);
				}
			}
			return jsonResource(
				"worken://glossary",
				JSON.stringify({ terms }, null, 2),
			);
		},
	);

	const subsystemTemplate = new ResourceTemplate("worken://subsystems/{id}", {
		list: async () => ({
			resources: platform.nodes
				.filter((n) => n.kind === "subsystem")
				.map((n) => ({
					uri: `worken://subsystems/${encodeURIComponent(n.id)}`,
					name: n.title,
				})),
		}),
	});
	mcp.registerResource(
		"subsystem",
		subsystemTemplate,
		{ description: "Platform subsystem node" },
		async (uri, variables) => {
			const id = templateId(variables);
			if (id === undefined) {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "missing_id" }),
				);
			}
			const node = platform.byId.get(id);
			if (!node || node.kind !== "subsystem") {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "not_found", id }),
				);
			}
			return jsonResource(uri.toString(), JSON.stringify(node, null, 2));
		},
	);

	const packageTemplate = new ResourceTemplate("worken://packages/{id}", {
		list: async () => ({
			resources: platform.nodes
				.filter((n) => n.kind === "package")
				.map((n) => ({
					uri: `worken://packages/${encodeURIComponent(n.id)}`,
					name: n.title,
				})),
		}),
	});
	mcp.registerResource(
		"package",
		packageTemplate,
		{ description: "Platform package node" },
		async (uri, variables) => {
			const id = templateId(variables);
			if (id === undefined) {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "missing_id" }),
				);
			}
			const node = platform.byId.get(id);
			if (!node || node.kind !== "package") {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "not_found", id }),
				);
			}
			return jsonResource(uri.toString(), JSON.stringify(node, null, 2));
		},
	);

	const contractTemplate = new ResourceTemplate("worken://contracts/{id}", {
		list: async () => ({
			resources: platform.nodes
				.filter((n) => n.kind === "contract")
				.map((n) => ({
					uri: `worken://contracts/${encodeURIComponent(n.id)}`,
					name: n.title,
				})),
		}),
	});
	mcp.registerResource(
		"contract",
		contractTemplate,
		{ description: "Platform contract node" },
		async (uri, variables) => {
			const id = templateId(variables);
			if (id === undefined) {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "missing_id" }),
				);
			}
			const node = platform.byId.get(id);
			if (!node || node.kind !== "contract") {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "not_found", id }),
				);
			}
			return jsonResource(uri.toString(), JSON.stringify(node, null, 2));
		},
	);

	const flowTemplate = new ResourceTemplate("worken://flows/{id}", {
		list: async () => ({
			resources: platform.nodes
				.filter((n) => n.kind === "flow")
				.map((n) => ({
					uri: `worken://flows/${encodeURIComponent(n.id)}`,
					name: n.title,
				})),
		}),
	});
	mcp.registerResource(
		"flow",
		flowTemplate,
		{ description: "Platform flow node" },
		async (uri, variables) => {
			const id = templateId(variables);
			if (id === undefined) {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "missing_id" }),
				);
			}
			const node = platform.byId.get(id);
			if (!node || node.kind !== "flow") {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "not_found", id }),
				);
			}
			return jsonResource(uri.toString(), JSON.stringify(node, null, 2));
		},
	);

	const exampleTemplate = new ResourceTemplate("worken://examples/{id}", {
		list: async () => ({
			resources: platform.nodes
				.filter((n) => n.kind === "example")
				.map((n) => ({
					uri: `worken://examples/${encodeURIComponent(n.id)}`,
					name: n.title,
				})),
		}),
	});
	mcp.registerResource(
		"example",
		exampleTemplate,
		{ description: "Platform example node" },
		async (uri, variables) => {
			const id = templateId(variables);
			if (id === undefined) {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "missing_id" }),
				);
			}
			const node = platform.byId.get(id);
			if (!node || node.kind !== "example") {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "not_found", id }),
				);
			}
			return jsonResource(uri.toString(), JSON.stringify(node, null, 2));
		},
	);

	const adrTemplate = new ResourceTemplate("worken://adrs/{id}", {
		list: async () => ({
			resources: platform.nodes
				.filter((n) => n.kind === "adr")
				.map((n) => ({
					uri: `worken://adrs/${encodeURIComponent(n.id)}`,
					name: n.title,
				})),
		}),
	});
	mcp.registerResource(
		"adr",
		adrTemplate,
		{ description: "Architecture decision record node" },
		async (uri, variables) => {
			const id = templateId(variables);
			if (id === undefined) {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "missing_id" }),
				);
			}
			const node = platform.byId.get(id);
			if (!node || node.kind !== "adr") {
				return jsonResource(
					uri.toString(),
					JSON.stringify({ error: "not_found", id }),
				);
			}
			return jsonResource(uri.toString(), JSON.stringify(node, null, 2));
		},
	);

	mcp.registerTool(
		"get_node",
		{
			description:
				"Fetch a single node by id from the semantic or platform graph.",
			inputSchema: {
				nodeId: z.string(),
				graph: z.enum(["semantic", "platform"]).default("platform"),
			},
		},
		async (args) => {
			if (args.graph === "semantic") {
				const n = semantic.byId.get(args.nodeId);
				return {
					content: [
						{ type: "text" as const, text: JSON.stringify(n ?? null, null, 2) },
					],
				};
			}
			const n = platform.byId.get(args.nodeId);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(n ?? null, null, 2) },
				],
			};
		},
	);

	mcp.registerTool(
		"related_nodes",
		{
			description:
				"List nodes related to the given id (platform neighborhood or semantic relations).",
			inputSchema: {
				nodeId: z.string(),
				graph: z.enum(["semantic", "platform"]).default("platform"),
			},
		},
		async (args) => {
			if (args.graph === "semantic") {
				const rels = [
					...(semantic.outgoing.get(args.nodeId) ?? []),
					...(semantic.incoming.get(args.nodeId) ?? []),
				];
				const ids = new Set<string>();
				for (const r of rels) {
					ids.add(r.from === args.nodeId ? r.to : r.from);
				}
				const nodes = [...ids]
					.map((id) => semantic.byId.get(id))
					.filter(Boolean);
				return {
					content: [
						{ type: "text" as const, text: JSON.stringify(nodes, null, 2) },
					],
				};
			}
			const nodes = relatedPlatformNodes(platform, args.nodeId);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(nodes, null, 2) },
				],
			};
		},
	);

	mcp.registerTool(
		"show_invariants",
		{
			description:
				"List platform invariants, optionally filtered by substring in id or title.",
			inputSchema: {
				area: z.string().optional(),
			},
		},
		async (args) => {
			const a = args.area?.toLowerCase();
			let invs = platform.nodes.filter((n) => n.kind === "invariant");
			if (a) {
				invs = invs.filter(
					(n) =>
						n.id.toLowerCase().includes(a) || n.title.toLowerCase().includes(a),
				);
			}
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(invs, null, 2) },
				],
			};
		},
	);

	mcp.registerTool(
		"find_examples",
		{
			description:
				"Find example nodes, optionally filtered by area substring or example kind.",
			inputSchema: {
				area: z.string().optional(),
				kind: z
					.enum(["package", "adapter", "workflow", "contract", "mcp"])
					.optional(),
			},
		},
		async (args) => {
			const a = args.area?.toLowerCase();
			let ex = platform.nodes.filter((n) => n.kind === "example");
			if (args.kind) {
				ex = ex.filter((n) => n.exampleKind === args.kind);
			}
			if (a) {
				ex = ex.filter(
					(n) =>
						n.id.toLowerCase().includes(a) || n.title.toLowerCase().includes(a),
				);
			}
			return {
				content: [{ type: "text" as const, text: JSON.stringify(ex, null, 2) }],
			};
		},
	);

	mcp.registerTool(
		"bundle_for_task",
		{
			description:
				"Build a compact context bundle for a preset or custom task string.",
			inputSchema: {
				task: z.string(),
				area: z.string().optional(),
				depth: z.enum(["compact", "normal"]).optional(),
			},
		},
		async (args) => {
			const bundle = buildContextBundle({
				task: args.task,
				...(args.area !== undefined ? { area: args.area } : {}),
				semantic,
				platform,
				depth: args.depth ?? "compact",
			});
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(bundle, null, 2) },
				],
			};
		},
	);

	mcp.registerTool(
		"impact_of_change",
		{
			description:
				"Neighborhood and constraints for a node id (both graphs when applicable).",
			inputSchema: {
				nodeId: z.string(),
			},
		},
		async (args) => {
			const bundle = buildImpactBundle({
				nodeId: args.nodeId,
				semantic,
				platform,
			});
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(bundle, null, 2) },
				],
			};
		},
	);

	mcp.registerPrompt(
		"onboard_to_repo",
		{
			description:
				"Orientation prompt for new contributors using platform graph context.",
		},
		async () => ({
			messages: [
				{
					role: "user" as const,
					content: {
						type: "text" as const,
						text: `You are onboarding to this repository. Summarize subsystems and packages, list canonical invariants, and propose a safe first change. Use tools: bundle_for_task with task "onboard_repo", show_invariants, find_examples.`,
					},
				},
			],
		}),
	);

	mcp.registerPrompt(
		"understand_before_edit",
		{
			description: "Prompt to read contracts and invariants before editing.",
		},
		async () => ({
			messages: [
				{
					role: "user" as const,
					content: {
						type: "text" as const,
						text: `Before editing, call bundle_for_task with task "understand_subsystem" and an appropriate area, then show_invariants for that area. Summarize risks.`,
					},
				},
			],
		}),
	);

	mcp.registerPrompt(
		"add_adapter_safely",
		{
			description: "Adapter task: emphasize boundary invariants and examples.",
		},
		async () => ({
			messages: [
				{
					role: "user" as const,
					content: {
						type: "text" as const,
						text: `We are adding an adapter. Call bundle_for_task with task "add_adapter" and area "integrations". List invariants that forbid owning business semantics and cite example nodes.`,
					},
				},
			],
		}),
	);

	mcp.registerPrompt(
		"compare_nodes",
		{
			description: "Compare two platform or semantic nodes by id.",
			argsSchema: {
				leftId: z.string(),
				rightId: z.string(),
				graph: z.enum(["semantic", "platform"]).default("platform"),
			},
		},
		async (args) => {
			const bag = args.graph === "semantic" ? semantic.byId : platform.byId;
			const left = bag.get(args.leftId);
			const right = bag.get(args.rightId);
			return {
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: `Compare these ${args.graph} nodes:\n\nA:\n${JSON.stringify(left, null, 2)}\n\nB:\n${JSON.stringify(right, null, 2)}`,
						},
					},
				],
			};
		},
	);

	return mcp;
}
