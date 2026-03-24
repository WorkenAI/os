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
				"Stage-1 IR from Semantic Protocol graph: entities, roles, actions, policies, surfaces (web/chat/voice/model-context), bindings. Fed to Web Shell via shell-surface-bridge.",
			inputs: ["examples/landing/semantic.source.ts"],
			outputs: ["apps/landing/src/generated/semantic-ir-baseline.json"],
		},
		{
			id: "contract.shell-surface-bridge",
			kind: "contract",
			title: "Shell surface bridge",
			summary:
				"Maps Semantic IR web-shell surfaces (shellLayoutId) to the shell layout registry so projections can drive Surfaces of Shell.",
			inputs: ["apps/landing/src/shell/runtime/semantic/shell-surface-bridge.ts"],
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
			id: "rel.landing.app-implements-bridge",
			kind: "implements",
			from: "package.worken-landing-app",
			to: "contract.shell-surface-bridge",
		},
		{
			id: "rel.example.landing-dsl",
			kind: "example-of",
			from: "example.landing-dsl-slice",
			to: "contract.semantic-ir-baseline",
		},
	],
};
