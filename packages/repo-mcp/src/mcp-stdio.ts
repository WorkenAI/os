/**
 * MCP server: model context = this monorepo (packages from package.json scan).
 * Run from repository root: `bun run mcp` (see root package.json).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { compilePlatform } from "@worken/platform-core";
import { createPlatformMcpServer } from "@worken/platform-mcp";
import { compileSemantic } from "@worken/semantic-core";
import {
	buildPlatformSourceFromWorkspace,
	buildSemanticSourceForRepo,
} from "./build-graph-from-repo.js";
import { loadWorkspacePackages } from "./scan-workspace.js";

const ROOT_MARKER = "worken-os";

function findMonorepoRoot(startDir: string): string | undefined {
	let dir = startDir;
	for (let i = 0; i < 32; i++) {
		const pkgPath = join(dir, "package.json");
		if (existsSync(pkgPath)) {
			try {
				const j = JSON.parse(readFileSync(pkgPath, "utf8")) as {
					name?: string;
				};
				if (j.name === ROOT_MARKER) {
					return dir;
				}
			} catch {
				/* */
			}
		}
		const parent = dirname(dir);
		if (parent === dir) {
			break;
		}
		dir = parent;
	}
	return undefined;
}

function resolveRepoRoot(): string {
	const env = process.env.WORKEN_REPO_ROOT;
	if (env && env.length > 0) {
		return env;
	}
	const fromCwd = findMonorepoRoot(process.cwd());
	if (fromCwd) {
		return fromCwd;
	}
	const here = dirname(fileURLToPath(import.meta.url));
	const fromScript = findMonorepoRoot(here);
	if (fromScript) {
		return fromScript;
	}
	return process.cwd();
}

const repoRoot = resolveRepoRoot();
const pkgs = await loadWorkspacePackages(repoRoot);
const platform = compilePlatform(buildPlatformSourceFromWorkspace(pkgs));
const semantic = compileSemantic(buildSemanticSourceForRepo());

const mcp = createPlatformMcpServer({ semantic, platform });
const transport = new StdioServerTransport();
await mcp.connect(transport);
