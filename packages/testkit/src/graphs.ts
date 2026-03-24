import { compilePlatform, type PlatformGraph } from "@worken/platform-core";
import { compileSemantic, type SemanticGraph } from "@worken/semantic-core";

export function createTestSemanticGraph(): SemanticGraph {
	return compileSemantic({
		protocolVersion: "0.1.0",
		nodes: [
			{ id: "domain.test", kind: "domain", title: "Test domain" },
			{
				id: "object.entity",
				kind: "object",
				title: "Entity",
				domainId: "domain.test",
				schema: {},
			},
		],
	});
}

export function createTestPlatformGraph(): PlatformGraph {
	return compilePlatform({
		version: "0.1.0",
		nodes: [
			{ id: "subsystem.test", kind: "subsystem", title: "Test subsystem" },
			{
				id: "invariant.test.always",
				kind: "invariant",
				title: "Test invariant",
				statement: "Tests must be deterministic.",
				severity: "error",
			},
		],
	});
}
