import type { NextConfig } from 'next'

/**
 * Next.js config wrapper for Worken OS apps (shell, IR, execution API routes).
 * Compose with `withWorkflow` from `@workflow/next` when using workflows:
 *
 * ```ts
 * export default withWorkenOS(withWorkflow(config))
 * ```
 */
export function withWorkenOS(nextConfig: NextConfig): NextConfig {
  return {
    ...nextConfig,
    transpilePackages: [
      ...(nextConfig.transpilePackages ?? []),
      '@worken/ir',
      '@worken/shell-web',
    ],
  }
}
