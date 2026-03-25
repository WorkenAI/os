/**
 * Thin contract: the only module `apps/web-shell` should import from `@worken/demo-data`
 * for shell catalog ids, domain registry, manifest helpers, and `DomainDefinition` types.
 *
 * Prefer `@worken/demo-data/domains/catalog` (or `shell-catalog`) for **read-only** lists on the
 * client to avoid pulling this full barrel. Use this entry for registry helpers and types.
 * Tests may use `@worken/demo-data/domains/hr` (etc.) for concrete domain fixtures.
 */

export * from "./domains/manifest";
export * from "./domains/registry";
export * from "./domains/semantic";
export { normalizeDomainSpec } from "./domains/spec-normalizer";
export * from "./domains/types";
export * from "./shell-catalog";
