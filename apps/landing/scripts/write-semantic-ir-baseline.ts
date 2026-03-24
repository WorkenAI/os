import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { landingSemanticSource } from "@worken/examples-landing";
import { compileSemantic, mergeSemanticSources } from "@worken/semantic-core";
import type { SemanticSource } from "@worken/semantic-core";
import { compileSemanticIR } from "@worken/semantic-ir";

/** Same anchor as `buildSemanticSourceForRepo()` in `@worken/repo-mcp` (keep in sync). */
function repoSemanticAnchor(): SemanticSource {
	return {
		protocolVersion: "0.1.0",
		nodes: [
			{
				id: "domain.worken-os",
				kind: "domain",
				title: "Worken OS",
				summary:
					"Repository-scoped semantic anchor; extend with authored semantic sources.",
			},
		],
	};
}

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "../src/generated/semantic-ir-baseline.json");

const semantic = compileSemantic(
	mergeSemanticSources(repoSemanticAnchor(), landingSemanticSource),
);
const ir = compileSemanticIR(semantic, {
	workspaceId: "worken-os",
	semanticProtocolVersion: semantic.protocolVersion,
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(ir, null, 2)}\n`, "utf8");
console.log(`Wrote ${outPath}`);