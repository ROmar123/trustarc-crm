import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { can } from '../domain/rbac'
import { seedDb } from '../domain/seed'
import type { Db, Permission, User } from '../domain/types'
import { applyAction, type Action } from './reducer'

const DB_KEY = 'privacy-crm:db:v1'
const USER_KEY = 'privacy-crm:user:v1'

const load = (): Db => {
  try { const raw = localStorage.getItem(DB_KEY); if (raw) return JSON.parse(raw) as Db } catch { /* fall through to seed */ }
  return seedDb()
}
const persist = (db: Db): void => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* storage unavailable */ } }

interface Store {
  db: Db; me: User; now: Date
  can: (p: Permission) => boolean
  dispatch: (a: Action) => string | null   // returns an error message or null
  switchUser: (id: string) => void
  resetDemoData: () => void
}

const Ctx = createContext<Store | null>(null)
export const useStore = (): Store => { const s = useContext(Ctx); if (!s) throw new Error('StoreProvider missing'); return s }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db>(load)
  const [meId, setMeId] = useState<string>(() => { try { return localStorage.getItem(USER_KEY) ?? 'u1' } catch { return 'u1' } })
  const me = db.users.find(u => u.id === meId && u.active) ?? db.users.find(u => u.active) ?? db.users[0]
  const now = useMemo(() => new Date(), [])

  const dispatch = useCallback((a: Action): string | null => {
    try {
      const next = applyAction(db, a, { actor: me, now: new Date() })
      persist(next); setDb(next); return null
    } catch (e) { return e instanceof Error ? e.message : 'Action failed' }
  }, [db, me])

  const switchUser = useCallback((id: string) => {
    try { localStorage.setItem(USER_KEY, id) } catch { /* ignore */ }
    setMeId(id)
    const next = applyAction(db, { type: 'audit.log', entry: { action: 'login', entity: 'user', entityId: id, summary: 'Signed in (demo role switch)' } }, { actor: db.users.find(u => u.id === id) ?? me, now: new Date() })
    persist(next); setDb(next)
  }, [db, me])

  const resetDemoData = useCallback(() => { const fresh = seedDb(); persist(fresh); setDb(fresh); setMeId('u1') }, [])

  const value = useMemo<Store>(() => ({ db, me, now, can: p => can(me.role, p), dispatch, switchUser, resetDemoData }), [db, me, now, dispatch, switchUser, resetDemoData])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
