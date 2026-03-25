import type { ProcessUiDefinition } from './types.js'

export function defineProcessUi<const T extends ProcessUiDefinition>(ui: T): T {
  return ui
}
