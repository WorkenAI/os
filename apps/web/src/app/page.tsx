import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Worken OS</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Shell and execution routes run from this app. Marketing demo lives under{' '}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-400">examples/landing-demo</code>
          .
        </p>
      </div>
      <div className="flex flex-col gap-3 text-sm">
        <Link
          href="/admin"
          className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900/50"
        >
          Open shell — Admin
        </Link>
        <p className="text-xs text-zinc-600">
          Use domain routes such as <span className="text-zinc-500">/hr</span>,{' '}
          <span className="text-zinc-500">/sales</span> per your IR manifests.
        </p>
      </div>
    </main>
  )
}
