import { tryGetDomain, type ShellIconKey } from '@worken/demo-data/shell-contract'
import { DEFAULT_ROLES } from './types'

export function resolveShellIconKey(id: string): ShellIconKey {
  const role = DEFAULT_ROLES.find((r) => r.id === id)
  if (role) return role.shellIcon
  const domain = tryGetDomain(id)
  if (domain) return domain.shellIconKey
  return 'puzzle'
}
