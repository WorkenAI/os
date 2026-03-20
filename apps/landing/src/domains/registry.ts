import type { DomainDefinition } from '@/domains/types'
import admin from './admin'
import developer from './developer'
import finance from './finance'
import hr from './hr'
import marketing from './marketing'
import sales from './sales'

export const DOMAIN_MANIFESTS = [admin, developer, hr, sales, marketing, finance] as const

export const DOMAIN_IDS = DOMAIN_MANIFESTS.map((domain) => domain.id)

export function getDomain(domainId: string): DomainDefinition {
  const domain = DOMAIN_MANIFESTS.find((candidate) => candidate.id === domainId)
  if (!domain) throw new Error(`Unknown domain: ${domainId}`)
  return domain
}

export async function loadDomain(domainId: string): Promise<DomainDefinition> {
  return getDomain(domainId)
}
