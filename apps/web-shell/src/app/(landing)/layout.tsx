import type { ReactNode } from 'react'

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[80px] animate-[blob-pulse_8s_ease-in-out_infinite]"
          style={{
            background:
              'radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, transparent 60%)',
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
