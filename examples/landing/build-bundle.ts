import { buildContextBundle } from "@worken/context-core";
import { compilePlatform } from "@worken/platform-core";
import { compileSemantic } from "@worken/semantic-core";
import { landingPlatformSource } from "./platform.source.js";
import { landingSemanticSource } from "./semantic.source.js";

const semantic = compileSemantic(landingSemanticSource);
const platform = compilePlatform(landingPlatformSource);

const bundle = buildContextBundle({
	task: "add_adapter",
	area: "integrations",
	semantic,
	platform,
	depth: "compact",
});

console.log(JSON.stringify(bundle, null, 2));
