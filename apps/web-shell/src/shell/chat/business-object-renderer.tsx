'use client'

import { ActionProvider, Renderer, StateProvider, VisibilityProvider } from '@json-render/react'
import { useEffect, useMemo, useRef } from 'react'
import { handlers, registry } from '@/shell/registry'

type JsonRenderSpec = {
  root?: string
  elements?: Record<string, { children?: string[] }>
} & Record<string, unknown>

function getRootChildrenCount(spec: Record<string, unknown>) {
  const jsonSpec = spec as JsonRenderSpec
  if (!jsonSpec.root || !jsonSpec.elements) return 0

  const rootElement = jsonSpec.elements[jsonSpec.root]
  if (!rootElement || !Array.isArray(rootElement.children)) return 0

  return rootElement.children.length
}

export function BusinessObjectRenderer({ spec }: { spec: Record<string, unknown> }) {
  const actionHandlers = useMemo(
    () =>
      handlers(
        () => undefined,
        () => ({}),
      ),
    [],
  )
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previousChildCountRef = useRef(0)
  const rootChildrenCount = useMemo(() => getRootChildrenCount(spec), [spec])

  useEffect(() => {
    if (rootChildrenCount <= 0 || rootChildrenCount <= previousChildCountRef.current) {
      previousChildCountRef.current = rootChildrenCount
      return
    }

    previousChildCountRef.current = rootChildrenCount

    const frameId = requestAnimationFrame(() => {
      const rootContainer = containerRef.current?.firstElementChild as HTMLElement | null
      const nextSection = rootContainer?.children.item(rootChildrenCount - 1) as HTMLElement | null

      if (nextSection) {
        nextSection.animate(
          [
            { opacity: 0.18, clipPath: 'inset(0 100% 0 0)' },
            { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
          ],
          {
            duration: 360,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
          },
        )
      }

      nextSection?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    })

    return () => cancelAnimationFrame(frameId)
  }, [rootChildrenCount])

  const specState =
    spec &&
    typeof spec === 'object' &&
    'state' in spec &&
    spec.state !== null &&
    typeof spec.state === 'object'
      ? (spec.state as Record<string, unknown>)
      : {}

  return (
    <div ref={containerRef} className="shell-business-object-stream">
      <StateProvider initialState={specState}>
        <VisibilityProvider>
          <ActionProvider handlers={actionHandlers}>
            <Renderer spec={spec as never} registry={registry} />
          </ActionProvider>
        </VisibilityProvider>
      </StateProvider>
    </div>
  )
}
