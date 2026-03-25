import type { ShellIconKey } from '@worken/demo-data/shell-contract'
import { resolveShellIconKey } from '@/shell/permissions/resolve-shell-icon'
import { SHELL_ICON_BY_KEY } from './shell-icon-registry'

export function RoleIcon({
  roleId,
  shellIcon,
  className,
}: {
  roleId: string
  /** When known (e.g. from policy `RoleDefinition`), avoids lookup by id only. */
  shellIcon?: ShellIconKey
  className?: string
}) {
  const key = shellIcon ?? resolveShellIconKey(roleId)
  const Icon = SHELL_ICON_BY_KEY[key]
  return <Icon aria-hidden className={className} />
}
