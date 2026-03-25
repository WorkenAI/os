import { notFound } from 'next/navigation'
import { DOMAIN_IDS, isKnownDomainId } from '@worken/demo-data/shell-contract'
import ShellWorkspaceClient from './shell-workspace-client'

type PageProps = {
  params: Promise<{ domain: string }>
}

export default async function ShellDomainPage({ params }: PageProps) {
  const { domain } = await params
  if (!isKnownDomainId(domain)) {
    notFound()
  }
  return <ShellWorkspaceClient domainId={domain} />
}

export function generateStaticParams() {
  return DOMAIN_IDS.map((domain) => ({ domain }))
}
