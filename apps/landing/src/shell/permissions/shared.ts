import type { RoleDefinition } from './types'

export const ACTIVE_ROLE_COOKIE = 'worken-os-active-role-id'
export const SHELL_SESSION_COOKIE = 'worken-os-session-id'

export type PermissionSnapshot = {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  domains: RoleDefinition['domains']
}

export function toPermissionSnapshot(role: RoleDefinition): PermissionSnapshot {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    emoji: role.emoji,
    color: role.color,
    domains: role.domains,
  }
}
