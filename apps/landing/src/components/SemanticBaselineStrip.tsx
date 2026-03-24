import { getSemanticIrBaseline } from '@/lib/semantic-ir-baseline'
import { getWebShellSurfaces } from '@/shell/runtime/semantic/shell-surface-bridge'

export function SemanticBaselineStrip() {
  const ir = getSemanticIrBaseline()
  const actionCount = Object.keys(ir.actions).length
  const surfaceCount = Object.keys(ir.surfaces).length
  const webShellCount = getWebShellSurfaces(ir).length
  const snapshot = ir.schema.snapshotId.slice(0, 18)

  return (
    <div className="border-b border-zinc-800/60 bg-zinc-950/90">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-2 text-center text-[11px] text-zinc-500 sm:text-xs">
        <span className="font-medium tracking-wide text-zinc-400 uppercase">Semantic IR baseline</span>
        <span>
          <span className="text-zinc-600">snapshot </span>
          <code className="rounded bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:text-[11px]">
            {snapshot}…
          </code>
        </span>
        <span>
          {actionCount} action{actionCount === 1 ? '' : 's'} · {surfaceCount} surface
          {surfaceCount === 1 ? '' : 's'} ({webShellCount} web-shell)
        </span>
      </div>
    </div>
  )
}
