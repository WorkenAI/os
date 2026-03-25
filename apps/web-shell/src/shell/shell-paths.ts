/** First URL segment for the web shell route, e.g. `/shell/hr`. */
export const SHELL_DOMAIN_PATH_PREFIX = 'shell'

export function shellDomainHref(domainId: string): string {
  return `/${SHELL_DOMAIN_PATH_PREFIX}/${encodeURIComponent(domainId)}`
}
