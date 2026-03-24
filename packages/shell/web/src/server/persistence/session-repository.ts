import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { WorkenOsSession } from '@/lib/worken-os-contract'
import { getWorkenDataDir } from '@/lib/worken-data-path'

type SessionStore = {
  sessions: Record<string, WorkenOsSession>
}

function getStorePath() {
  return path.join(getWorkenDataDir(), 'session-store.json')
}

function getDefaultStore(): SessionStore {
  return {
    sessions: {},
  }
}

async function ensureStoreDirectory() {
  await mkdir(path.dirname(getStorePath()), { recursive: true })
}

export async function readSessionStore(): Promise<SessionStore> {
  try {
    const raw = await readFile(getStorePath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<SessionStore>
    return {
      ...getDefaultStore(),
      sessions: parsed.sessions ?? {},
    }
  } catch {
    return getDefaultStore()
  }
}

export async function writeSessionStore(store: SessionStore) {
  await ensureStoreDirectory()
  await writeFile(getStorePath(), JSON.stringify(store, null, 2), 'utf8')
}

export async function getStoredShellSession(sessionId: string) {
  const store = await readSessionStore()
  return store.sessions[sessionId] ?? null
}

export async function upsertStoredShellSession(session: WorkenOsSession) {
  const store = await readSessionStore()
  store.sessions[session.id] = session
  await writeSessionStore(store)
  return session
}
