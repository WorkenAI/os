import { dirname, join, relative } from "node:path";
import * as ts from "typescript";
import {
	findTsconfigForPackage,
	listWorkspacePackageRoots,
} from "./discover.js";
import type { CodeGraph, CodeGraphEdge, CodeGraphNode } from "./model.js";

function pkgNodeId(name: string): string {
	return `pkg.${name.replace(/^@/, "").replace(/\//g, ".")}`;
}

function symNodeId(pkgName: string, exportName: string): string {
	const p = pkgName.replace(/^@/, "").replace(/\//g, ".");
	return `sym.${p}#${exportName}`;
}

function surfaceId(pkgName: string): string {
	const p = pkgName.replace(/^@/, "").replace(/\//g, ".");
	return `surface.${p}#public-api`;
}

function parseNpmPackageFromSpecifier(spec: string): string | undefined {
	if (
		spec.startsWith(".") ||
		spec.startsWith("/") ||
		spec.startsWith("node:")
	) {
		return undefined;
	}
	if (spec.startsWith("@")) {
		const parts = spec.split("/");
		if (parts.length >= 2) {
			return `${parts[0]}/${parts[1]}`;
		}
		return spec;
	}
	const first = spec.split("/")[0];
	return first || undefined;
}

function getExportKind(symbol: ts.Symbol): NonNullable<CodeGraphNode["symbolKind"]> {
	const flags = symbol.getFlags();
	if (flags & ts.SymbolFlags.Function) {
		return "function";
	}
	if (flags & ts.SymbolFlags.Class) {
		return "class";
	}
	if (flags & ts.SymbolFlags.Enum) {
		return "enum";
	}
	if (flags & ts.SymbolFlags.Interface) {
		return "interface";
	}
	if (flags & ts.SymbolFlags.TypeAlias) {
		return "type";
	}
	if (
		flags & ts.SymbolFlags.BlockScopedVariable ||
		flags & ts.SymbolFlags.Variable
	) {
		return "const";
	}
	if (flags & ts.SymbolFlags.NamespaceModule) {
		return "namespace";
	}
	return "other";
}

function trySignature(checker: ts.TypeChecker, symbol: ts.Symbol): string | undefined {
	const decl = symbol.declarations?.[0];
	if (!decl) {
		return undefined;
	}
	if (ts.isFunctionDeclaration(decl) || ts.isFunctionExpression(decl)) {
		const sig = checker.getSignatureFromDeclaration(decl);
		if (sig) {
			return checker.signatureToString(sig, decl, ts.TypeFormatFlags.NoTruncation);
		}
	}
	const t = checker.getTypeOfSymbolAtLocation(symbol, decl);
	return checker.typeToString(t, decl, ts.TypeFormatFlags.NoTruncation);
}

function importIsTypeOnly(node: ts.ImportDeclaration): boolean {
	if (node.importClause?.isTypeOnly) {
		return true;
	}
	const named = node.importClause?.namedBindings;
	if (named && ts.isNamedImports(named)) {
		return (
			named.elements.length > 0 && named.elements.every((e) => e.isTypeOnly)
		);
	}
	return false;
}

function collectImports(
	sourceFile: ts.SourceFile,
): { specifier: string; isTypeOnly: boolean }[] {
	const out: { specifier: string; isTypeOnly: boolean }[] = [];
	function visit(node: ts.Node): void {
		if (
			ts.isImportDeclaration(node) &&
			node.moduleSpecifier &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			const typeOnly = importIsTypeOnly(node);
			out.push({ specifier: node.moduleSpecifier.text, isTypeOnly: typeOnly });
		}
		if (
			ts.isExportDeclaration(node) &&
			node.moduleSpecifier &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			out.push({ specifier: node.moduleSpecifier.text, isTypeOnly: false });
		}
		ts.forEachChild(node, visit);
	}
	visit(sourceFile);
	return out;
}

function resolveEntryFile(memberRoot: string): string | undefined {
	const candidates = [
		join(memberRoot, "src", "index.ts"),
		join(memberRoot, "src", "index.tsx"),
		join(memberRoot, "index.ts"),
	];
	for (const c of candidates) {
		if (ts.sys.fileExists(c)) {
			return c;
		}
	}
	return undefined;
}

export interface BuildCodeGraphOptions {
	/** Only include these npm package names (e.g. @worken/context-core). Default: all workspace members with tsconfig. */
	includePackages?: string[];
}

export function buildCodeGraph(
	repoRoot: string,
	options: BuildCodeGraphOptions = {},
): CodeGraph {
	const members = listWorkspacePackageRoots(repoRoot);
	const filtered = options.includePackages?.length
		? members.filter((m) => options.includePackages?.includes(m.name))
		: members.filter((m) => m.name.startsWith("@worken/"));

	const nodes: CodeGraphNode[] = [];
	const edges: CodeGraphEdge[] = [];
	let edgeSeq = 0;
	const nextEdgeId = (kind: string) => `edge.${kind}.${++edgeSeq}`;

	const dependsPairs = new Set<string>();

	for (const member of filtered) {
		const tsconfigPath = findTsconfigForPackage(member);
		if (!tsconfigPath) {
			continue;
		}

		const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
		if (configFile.error) {
			continue;
		}
		const parsed = ts.parseJsonConfigFileContent(
			configFile.config,
			ts.sys,
			dirname(tsconfigPath),
			undefined,
			tsconfigPath,
		);
		const createOpts: ts.CreateProgramOptions = {
			rootNames: parsed.fileNames,
			options: parsed.options,
		};
		if (parsed.projectReferences !== undefined) {
			createOpts.projectReferences = [...parsed.projectReferences];
		}
		const program = ts.createProgram(createOpts);
		const checker = program.getTypeChecker();
		const pkgId = pkgNodeId(member.name);

		nodes.push({
			id: pkgId,
			kind: "package",
			title: member.name,
			packageName: member.name,
			packageRoot: member.relativeDir,
			tsconfigPath: relative(repoRoot, tsconfigPath),
		});

		const surface = surfaceId(member.name);
		nodes.push({
			id: surface,
			kind: "contract-surface",
			title: `${member.name} public API`,
		});

		const entry = resolveEntryFile(member.rootDir);
		const sourceFiles = program
			.getSourceFiles()
			.filter(
				(sf) =>
					!sf.isDeclarationFile &&
					!sf.fileName.includes("node_modules") &&
					sf.fileName.startsWith(member.rootDir),
			);

		for (const sf of sourceFiles) {
			const imports = collectImports(sf);
			for (const { specifier, isTypeOnly } of imports) {
				const depPkg = parseNpmPackageFromSpecifier(specifier);
				if (!depPkg || depPkg === member.name) {
					continue;
				}
				const targetId = pkgNodeId(depPkg);
				const pairKey = `${pkgId}->${targetId}`;
				if (!dependsPairs.has(pairKey)) {
					dependsPairs.add(pairKey);
					edges.push({
						id: nextEdgeId("depends-on"),
						kind: "depends-on",
						from: pkgId,
						to: targetId,
					});
				}
				// uses-type-from: approximate at package level when type-only import
				if (isTypeOnly) {
					edges.push({
						id: nextEdgeId("uses-type"),
						kind: "uses-type-from",
						from: pkgId,
						to: targetId,
						via: `(type-only import from ${relative(repoRoot, sf.fileName)})`,
					});
				}
			}
		}

		if (entry) {
			const sf = program.getSourceFile(entry);
			const modSym = sf ? checker.getSymbolAtLocation(sf) : undefined;
			if (modSym && sf) {
				const exports = checker.getExportsOfModule(modSym);
				for (const exp of exports) {
					const name = exp.name;
					if (name === "default" || name.startsWith("__")) {
						continue;
					}
					const sid = symNodeId(member.name, name);
					const kind = getExportKind(exp);
					const signature = trySignature(checker, exp);
					const relDecl = exp.declarations?.[0]
						? relative(repoRoot, exp.declarations[0].getSourceFile().fileName)
						: relative(repoRoot, entry);

					const symNode: CodeGraphNode = {
						id: sid,
						kind: "exported-symbol",
						title: name,
						symbolKind: kind,
						declaredIn: relDecl,
						exportedFrom: relative(repoRoot, entry),
					};
					if (signature !== undefined) {
						symNode.signature = signature;
					}
					nodes.push(symNode);

					edges.push({
						id: nextEdgeId("exports"),
						kind: "exports",
						from: pkgId,
						to: sid,
					});
					edges.push({
						id: nextEdgeId("surface"),
						kind: "part-of-surface",
						from: surface,
						to: sid,
					});
				}
			}
		}
	}

	// Deduplicate nodes by id
	const nodeById = new Map<string, CodeGraphNode>();
	for (const n of nodes) {
		nodeById.set(n.id, n);
	}

	// Stub package nodes for depends-on targets not yet visited
	for (const e of edges) {
		if (e.kind !== "depends-on" && e.kind !== "uses-type-from") {
			continue;
		}
		if (!nodeById.has(e.to)) {
			const rest = e.to.replace(/^pkg\./, "");
			const parts = rest.split(".");
			const title =
				parts.length >= 2 && parts[0] === "worken"
					? `@worken/${parts.slice(1).join(".")}`
					: parts.join("/");
			const stub: CodeGraphNode = {
				id: e.to,
				kind: "package",
				title,
			};
			if (title.startsWith("@")) {
				stub.packageName = title;
			}
			nodeById.set(e.to, stub);
		}
	}

	return {
		version: "0.1.0",
		repoRoot,
		nodes: [...nodeById.values()],
		edges,
	};
}
