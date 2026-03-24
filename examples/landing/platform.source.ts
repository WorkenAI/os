import type { PlatformSource } from "@worken/platform-core";

/** Platform graph slice documenting the landing prototype wiring (mirrors `examples/minimal` style). */
export const landingPlatformSource: PlatformSource = {
	version: "0.1.0",
	nodes: [
		{
			id: "subsystem.landing-prototype",
			kind: "subsystem",
			title: "Landing prototype",
			summary:
				"Next.js shell preview and visualization; consumes DSL baseline Semantic IR at build time.",
			canonical: true,
			status: "stable",
		},
		{
			id: "package.worken-landing-app",
			kind: "package",
			title: "@worken/landing",
			summary: "Marketing entry and Web Shell preview (apps/landing).",
			refs: [
				{ kind: "file", target: "apps/landing/package.json", note: "App manifest" },
				{ kind: "package", target: "@worken/landing" },
			],
		},
		{
			id: "contract.semantic-ir-baseline",
			kind: "contract",
			title: "Semantic IR baseline artifact",
			summary:
				"Deterministic Stage-1 IR snapshot generated from examples/landing DSL at build time.",
			inputs: ["examples/landing/semantic.source.ts"],
			outputs: ["apps/landing/src/generated/semantic-ir-baseline.json"],
		},
		{
			id: "example.landing-dsl-slice",
			kind: "example",
			title: "Landing DSL recruitment slice",
			exampleKind: "contract",
		},
	],
	relations: [
		{
			id: "rel.landing.contains-app",
			kind: "contains",
			from: "subsystem.landing-prototype",
			to: "package.worken-landing-app",
		},
		{
			id: "rel.landing.app-implements-ir",
			kind: "implements",
			from: "package.worken-landing-app",
			to: "contract.semantic-ir-baseline",
		},
		{
			id: "rel.example.landing-dsl",
			kind: "example-of",
			from: "example.landing-dsl-slice",
			to: "contract.semantic-ir-baseline",
		},
	],
};
