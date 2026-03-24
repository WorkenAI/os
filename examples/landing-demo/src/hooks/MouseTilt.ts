import { useMachine } from '@xstate/react'
import { useCallback, useEffect, useRef } from 'react'

import { mouseTiltMachine } from './mouse-tilt-machine'

export function useMouseTilt() {
  const [snapshot, send] = useMachine(mouseTiltMachine)
  const tilt = snapshot.context
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = (e.clientX - centerX) / (rect.width / 2)
      const y = (e.clientY - centerY) / (rect.height / 2)
      send({
        type: 'tilt.set',
        x: Math.max(-1, Math.min(1, x)) * 12,
        y: Math.max(-1, Math.min(1, y)) * -12,
      })
    },
    [send],
  )

  const handleLeave = useCallback(() => {
    send({ type: 'tilt.reset' })
  }, [send])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [handleMove, handleLeave])

  return { ref, tilt }
}
