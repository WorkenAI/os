'use client'

export default function Hero() {
  return (
    <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
      <div className="m-20"></div>

      <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl">
        <span className="relative inline-block">
          <span
            className="bg-clip-text"
            style={{
              backgroundImage:
                'var(--hero-title-gradient, linear-gradient(135deg, #ffffff 0%, #a78bfa 40%, #22d3ee 70%, #ffffff 100%))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Worken OS
          </span>

          <span className="pointer-events-none absolute top-1/2 -left-5 -translate-y-1/2 sm:-left-7 md:-left-9">
            <span
              className="block h-3 w-3 rounded-full opacity-60"
              style={{
                background: 'var(--hero-orb-left, #22d3ee)',
                boxShadow: '0 0 24px var(--hero-orb-left, #22d3ee)',
                animation: 'orb-float 6s ease-in-out infinite',
              }}
            />
          </span>
          <span className="pointer-events-none absolute top-1/2 -right-5 -translate-y-1/2 sm:-right-7 md:-right-9">
            <span
              className="block h-2 w-2 rounded-full opacity-60"
              style={{
                background: 'var(--hero-orb-right, #a78bfa)',
                boxShadow: '0 0 20px var(--hero-orb-right, #a78bfa)',
                animation: 'orb-float 8s ease-in-out infinite 1s',
              }}
            />
          </span>
        </span>
      </h1>

      <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl">
        The next-generation operating system
        <br />
        One environment for AI and people to work together
      </p>
    </div>
  )
}
