import type { LucideIcon } from 'lucide-react'
import { Briefcase, Code2, Eye, Megaphone, Puzzle, Shield, Users, Wallet } from 'lucide-react'
import type { ShellIconKey } from '@worken/demo-data/shell-contract'

export const SHELL_ICON_BY_KEY: Record<ShellIconKey, LucideIcon> = {
  shield: Shield,
  code: Code2,
  users: Users,
  briefcase: Briefcase,
  megaphone: Megaphone,
  wallet: Wallet,
  eye: Eye,
  puzzle: Puzzle,
}
