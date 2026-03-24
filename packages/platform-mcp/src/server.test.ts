import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compilePlatform } from "@worken/platform-core";
import { compileSemantic } from "@worken/semantic-core";
import { createPlatformMcpServer } from "./server.js";

describe("createPlatformMcpServer", () => {
	it("returns an MCP server instance", () => {
		const semantic = compileSemantic({ protocolVersion: "0.1.0", nodes: [] });
		const platform = compilePlatform({ version: "0.1.0", nodes: [] });
		const mcp = createPlatformMcpServer({ semantic, platform });
		assert.ok(mcp.server);
	});
});
