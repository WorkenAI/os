import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const SKIP_DIRS = new Set([
	"node_modules",
	".git",
	".turbo",
	"dist",
	".next",
	".worken",
	"coverage",
]);

export interface WorkspacePackage {
	/** Absolute path to the directory containing package.json */
	rootDir: string;
	/** Path relative to repository root */
	relativeDir: string;
	/** package.json "name" */
	name: string;
	description?: string;
	private?: boolean;
}

export async function findPackageJsonDirs(repoRoot: string): Promise<string[]> {
	const dirs: string[] = [];

	async function walk(dir: string): Promise<void> {
		let entries: Dirent[];
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const ent of entries) {
			if (ent.name.startsWith(".") && ent.name !== ".") {
				continue;
			}
			if (!ent.isDirectory()) {
				continue;
			}
			if (SKIP_DIRS.has(ent.name)) {
				continue;
			}
			const full = join(dir, ent.name);
			await walk(full);
		}
		const pkgPath = join(dir, "package.json");
		try {
			const { readFile } = await import("node:fs/promises");
			await readFile(pkgPath, "utf8");
			dirs.push(dir);
		} catch {
			/* no package.json */
		}
	}

	await walk(repoRoot);
	return dirs;
}

export async function loadWorkspacePackages(
	repoRoot: string,
): Promise<WorkspacePackage[]> {
	const dirs = await findPackageJsonDirs(repoRoot);
	const { readFile } = await import("node:fs/promises");
	const out: WorkspacePackage[] = [];

	for (const dir of dirs) {
		const raw = await readFile(join(dir, "package.json"), "utf8");
		let parsed: { name?: string; description?: string; private?: boolean };
		try {
			parsed = JSON.parse(raw) as typeof parsed;
		} catch {
			continue;
		}
		if (!parsed.name || typeof parsed.name !== "string") {
			continue;
		}
		const entry: WorkspacePackage = {
			rootDir: dir,
			relativeDir: relative(repoRoot, dir) || ".",
			name: parsed.name,
			private: parsed.private === true,
		};
		if (typeof parsed.description === "string") {
			entry.description = parsed.description;
		}
		out.push(entry);
	}

	out.sort((a, b) => a.name.localeCompare(b.name));
	return out;
}
