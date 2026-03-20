type ShellSessionDispatcher = {
  navigateToPath: (path: string) => void
  openInspector: (target: { entityType: string; id: string }) => void
  selectEntities: (target: { entityType: string; ids: string[] }) => void
  executeVerb: (input: { verb: string; entityType: string; ids: string[] }) => void
}

let dispatcher: ShellSessionDispatcher | null = null

export function setShellSessionDispatcher(nextDispatcher: ShellSessionDispatcher) {
  dispatcher = nextDispatcher
}

export function clearShellSessionDispatcher() {
  dispatcher = null
}

export function navigateShellPath(path: string) {
  dispatcher?.navigateToPath(path)
}

export function openShellInspector(target: { entityType: string; id: string }) {
  dispatcher?.openInspector(target)
}

export function selectShellEntities(target: { entityType: string; ids: string[] }) {
  dispatcher?.selectEntities(target)
}

export function executeShellVerb(input: { verb: string; entityType: string; ids: string[] }) {
  dispatcher?.executeVerb(input)
}
