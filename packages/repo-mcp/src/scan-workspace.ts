import type { Dirent } from "node:fs";
import { existsSync, readFileSync } from "node:fs";
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

function readWorkspacePatterns(repoRoot: string): string[] {
	const pkgPath = join(repoRoot, "package.json");
	if (!existsSync(pkgPath)) {
		return ["apps/*", "packages/*"];
	}
	const raw = readFileSync(pkgPath, "utf8");
	let parsed: {
		workspaces?: string[] | { packages?: string[] };
	};
	try {
		parsed = JSON.parse(raw) as typeof parsed;
	} catch {
		return ["apps/*", "packages/*"];
	}
	if (Array.isArray(parsed.workspaces)) {
		return parsed.workspaces;
	}
	if (parsed.workspaces?.packages) {
		return parsed.workspaces.packages;
	}
	return ["apps/*", "packages/*"];
}

function shouldExcludeRelative(rel: string, excludeGlobs: string[]): boolean {
	const norm = rel.replace(/\\/g, "/");
	for (const g of excludeGlobs) {
		const prefix = g.replace(/\*$/, "").replace(/\/\*$/, "");
		if (g.endsWith("*") && norm.startsWith(prefix)) {
			return true;
		}
		if (norm === prefix || norm.startsWith(`${prefix}/`)) {
			return true;
		}
	}
	return false;
}

/**
 * Workspace-aware: only package.json that are direct children of workspace glob roots
 * (e.g. apps/foo, packages/bar), matching npm/bun workspaces — not every nested package.json.
 */
export async function loadWorkspacePackages(
	repoRoot: string,
): Promise<WorkspacePackage[]> {
	const patterns = readWorkspacePatterns(repoRoot);
	const excludeEnv = process.env.WORKEN_REPO_MCP_EXCLUDE ?? "examples/*";
	const excludeGlobs = excludeEnv
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const includeExamples = process.env.WORKEN_REPO_MCP_INCLUDE_EXAMPLES === "1";
	const effectiveExclude = includeExamples
		? excludeGlobs.filter((g) => !g.startsWith("examples"))
		: excludeGlobs;

	const dirs = new Set<string>();

	for (const pat of patterns) {
		if (!pat.includes("*")) {
			const full = join(repoRoot, pat);
			if (existsSync(join(full, "package.json"))) {
				dirs.add(full);
			}
			continue;
		}
		const star = pat.indexOf("*");
		const basePart = pat.slice(0, star).replace(/\/$/, "");
		const baseDir = join(repoRoot, basePart);
		if (!existsSync(baseDir)) {
			continue;
		}
		let entries: Dirent[];
		try {
			entries = await readdir(baseDir, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const ent of entries) {
			if (!ent.isDirectory() || SKIP_DIRS.has(ent.name)) {
				continue;
			}
			if (ent.name.startsWith(".") && ent.name !== ".") {
				continue;
			}
			const full = join(baseDir, ent.name);
			const rel = relative(repoRoot, full);
			if (shouldExcludeRelative(rel, effectiveExclude)) {
				continue;
			}
			if (existsSync(join(full, "package.json"))) {
				dirs.add(full);
			}
		}
	}

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
		const rel = relative(repoRoot, dir) || ".";
		if (rel === ".") {
			continue;
		}
		const entry: WorkspacePackage = {
			rootDir: dir,
			relativeDir: rel,
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
