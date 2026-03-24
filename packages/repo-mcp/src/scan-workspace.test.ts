import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import { loadWorkspacePackages } from "./scan-workspace.js";

describe("loadWorkspacePackages", () => {
	it("only includes direct workspace package roots, not repo root or deep nesting", async () => {
		const tmp = join(process.cwd(), ".tmp-scan-test");
		await rm(tmp, { recursive: true, force: true });
		await mkdir(join(tmp, "apps", "alpha"), { recursive: true });
		await mkdir(join(tmp, "apps", "beta", "nested"), { recursive: true });
		await writeFile(
			join(tmp, "package.json"),
			JSON.stringify({
				name: "fixture-root",
				workspaces: ["apps/*"],
			}),
			"utf8",
		);
		await writeFile(
			join(tmp, "apps", "alpha", "package.json"),
			JSON.stringify({ name: "@fixture/alpha" }),
			"utf8",
		);
		await writeFile(
			join(tmp, "apps", "beta", "package.json"),
			JSON.stringify({ name: "@fixture/beta" }),
			"utf8",
		);
		await writeFile(
			join(tmp, "apps", "beta", "nested", "package.json"),
			JSON.stringify({ name: "@fixture/nested" }),
			"utf8",
		);
		const pkgs = await loadWorkspacePackages(tmp);
		const names = new Set(pkgs.map((p) => p.name));
		assert.ok(names.has("@fixture/alpha"));
		assert.ok(names.has("@fixture/beta"));
		assert.equal(names.has("@fixture/nested"), false);
		assert.equal(names.has("fixture-root"), false);
		await rm(tmp, { recursive: true, force: true });
	});
});
