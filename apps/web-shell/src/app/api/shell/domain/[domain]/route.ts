import { NextResponse } from 'next/server'
import { getDefaultViewId, getDomain, isKnownDomainId } from '@worken/demo-data/shell-contract'

type RouteParams = { params: Promise<{ domain: string }> }

/** Manifest metadata for a domain opened in the web shell (MCP / external clients). */
export async function GET(_request: Request, { params }: RouteParams) {
  const { domain } = await params
  if (!isKnownDomainId(domain)) {
    return NextResponse.json({ error: 'Unknown domain' }, { status: 404 })
  }

  const def = getDomain(domain)
  return NextResponse.json({
    id: def.id,
    title: def.title,
    defaultViewId: getDefaultViewId(def),
    landingLayer: def.landingLayer,
    accent: def.accent.color,
  })
}
