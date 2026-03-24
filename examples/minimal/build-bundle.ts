import { buildContextBundle } from "@worken/context-core";
import { compilePlatform } from "@worken/platform-core";
import { compileSemantic } from "@worken/semantic-core";
import { minimalPlatformSource } from "./platform.source.js";
import { minimalSemanticSource } from "./semantic.source.js";

const semantic = compileSemantic(minimalSemanticSource);
const platform = compilePlatform(minimalPlatformSource);

const bundle = buildContextBundle({
	task: "add_adapter",
	area: "integrations",
	semantic,
	platform,
	depth: "compact",
});

console.log(JSON.stringify(bundle, null, 2));
