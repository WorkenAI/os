import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const SKIP = new Set(["node_modules", ".git", "dist", ".next", ".turbo"]);

export interface WorkspaceMember {
	/** npm name */
	name: string;
	/** absolute path to package root */
	rootDir: string;
	/** relative to repo root */
	relativeDir: string;
}

function readWorkspaces(repoRoot: string): string[] {
	const p = join(repoRoot, "package.json");
	if (!existsSync(p)) {
		return [];
	}
	const j = JSON.parse(readFileSync(p, "utf8")) as {
		workspaces?: string[] | { packages?: string[] };
	};
	if (Array.isArray(j.workspaces)) {
		return j.workspaces;
	}
	return j.workspaces?.packages ?? [];
}

/**
 * Resolve workspace members the same way as Bun/npm: direct children of each glob root.
 */
export function listWorkspacePackageRoots(repoRoot: string): WorkspaceMember[] {
	const patterns = readWorkspaces(repoRoot);
	const out: WorkspaceMember[] = [];
	const seen = new Set<string>();

	for (const pat of patterns) {
		if (!pat.includes("*")) {
			const full = join(repoRoot, pat);
			const pkg = join(full, "package.json");
			if (existsSync(pkg)) {
				const name = JSON.parse(readFileSync(pkg, "utf8")).name as string;
				if (name && !seen.has(full)) {
					seen.add(full);
					out.push({
						name,
						rootDir: full,
						relativeDir: relative(repoRoot, full) || ".",
					});
				}
			}
			continue;
		}
		const star = pat.indexOf("*");
		const basePart = pat.slice(0, star).replace(/\/$/, "");
		const baseDir = join(repoRoot, basePart);
		if (!existsSync(baseDir)) {
			continue;
		}
		for (const ent of readdirSync(baseDir, { withFileTypes: true })) {
			if (!ent.isDirectory() || SKIP.has(ent.name)) {
				continue;
			}
			const full = join(baseDir, ent.name);
			const pkg = join(full, "package.json");
			if (!existsSync(pkg)) {
				continue;
			}
			try {
				const name = JSON.parse(readFileSync(pkg, "utf8")).name as string;
				if (name && !seen.has(full)) {
					seen.add(full);
					out.push({
						name,
						rootDir: full,
						relativeDir: relative(repoRoot, full) || ".",
					});
				}
			} catch {
				/* */
			}
		}
	}

	out.sort((a, b) => a.name.localeCompare(b.name));
	return out;
}

export function findTsconfigForPackage(
	member: WorkspaceMember,
): string | undefined {
	const direct = join(member.rootDir, "tsconfig.json");
	if (existsSync(direct)) {
		return direct;
	}
	return undefined;
}
