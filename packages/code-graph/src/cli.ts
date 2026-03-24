#!/usr/bin/env bun
/**
 * Dump code graph JSON to stdout. Usage from repo root:
 *   bun packages/code-graph/src/cli.ts
 *   WORKEN_CODE_GRAPH_PACKAGES=@worken/context-core,@worken/semantic-core bun ...
 */
import { buildCodeGraph } from "./build-graph.js";

function findRepoRoot(): string {
	const env = process.env.WORKEN_REPO_ROOT;
	if (env) {
		return env;
	}
	return process.cwd();
}

const repoRoot = findRepoRoot();
const pkgsEnv = process.env.WORKEN_CODE_GRAPH_PACKAGES;
const graph = buildCodeGraph(
	repoRoot,
	pkgsEnv
		? {
				includePackages: pkgsEnv
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
			}
		: {},
);
process.stdout.write(`${JSON.stringify(graph, null, 2)}\n`);
