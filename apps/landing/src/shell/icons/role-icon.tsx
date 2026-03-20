import { Briefcase, Code2, Eye, Megaphone, Puzzle, Shield, Users, Wallet } from 'lucide-react'

function resolveRoleIcon(roleId: string) {
  if (roleId === 'admin') return Shield
  if (roleId === 'developer') return Code2
  if (roleId === 'hr-manager' || roleId === 'hr') return Users
  if (roleId === 'sales-rep' || roleId === 'sales') return Briefcase
  if (roleId === 'marketing-specialist' || roleId === 'marketing') return Megaphone
  if (roleId === 'accountant' || roleId === 'finance') return Wallet
  if (roleId === 'viewer') return Eye
  return Puzzle
}

export function RoleIcon({ roleId, className }: { roleId: string; className?: string }) {
  const Icon = resolveRoleIcon(roleId)
  return <Icon aria-hidden className={className} />
}
