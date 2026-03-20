import type { ShellEvent } from './machines/shell'

type ShellDispatcher = (event: ShellEvent) => void

let _dispatcher: ShellDispatcher | null = null

export function setShellDispatcher(fn: ShellDispatcher) {
  _dispatcher = fn
}

export function clearShellDispatcher() {
  _dispatcher = null
}

export function shellDispatch(event: ShellEvent) {
  if (_dispatcher) _dispatcher(event)
}
