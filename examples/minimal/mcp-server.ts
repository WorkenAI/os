import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { compilePlatform } from "@worken/platform-core";
import { createPlatformMcpServer } from "@worken/platform-mcp";
import { compileSemantic } from "@worken/semantic-core";
import { minimalPlatformSource } from "./platform.source.js";
import { minimalSemanticSource } from "./semantic.source.js";

const semantic = compileSemantic(minimalSemanticSource);
const platform = compilePlatform(minimalPlatformSource);
const mcp = createPlatformMcpServer({ semantic, platform });
const transport = new StdioServerTransport();
await mcp.connect(transport);
