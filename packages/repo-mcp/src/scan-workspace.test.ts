import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import { loadWorkspacePackages } from "./scan-workspace.js";

describe("loadWorkspacePackages", () => {
	it("finds nested package.json files", async () => {
		const tmp = join(process.cwd(), ".tmp-scan-test");
		await rm(tmp, { recursive: true, force: true });
		await mkdir(join(tmp, "a", "b"), { recursive: true });
		await writeFile(
			join(tmp, "a", "b", "package.json"),
			JSON.stringify({ name: "@scope/pkg-b", description: "B" }),
			"utf8",
		);
		await writeFile(
			join(tmp, "package.json"),
			JSON.stringify({ name: "root-pkg" }),
			"utf8",
		);
		const pkgs = await loadWorkspacePackages(tmp);
		const names = new Set(pkgs.map((p) => p.name));
		assert.ok(names.has("root-pkg"));
		assert.ok(names.has("@scope/pkg-b"));
		await rm(tmp, { recursive: true, force: true });
	});
});
