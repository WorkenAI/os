import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Local JSON stores (session, policy, execution) live under the repo root `.worken/`.
 * Walks up from cwd until `turbo.json` is found; otherwise uses `.worken` under cwd.
 */
export function getWorkenDataDir(): string {
  let dir = path.resolve(process.cwd())
  while (true) {
    if (existsSync(path.join(dir, 'turbo.json'))) {
      return path.join(dir, '.worken')
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.join(process.cwd(), '.worken')
}
