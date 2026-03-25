export type {
  DomainId,
  DomainViewId,
  ProcessDomainBridge,
  WorkspaceDomainBridge,
} from './types.js'
export { defineProcessDomainBridge, defineWorkspaceDomainBridge } from './builder.js'
export { resolveDomainViewId } from './resolve.js'
