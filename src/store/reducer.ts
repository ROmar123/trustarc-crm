import { can } from '../domain/rbac'
import type { Account, AuditEntry, Contact, Db, Note, Opportunity, Permission, Stage, Task, User } from '../domain/types'

export type Action =
  | { type: 'account.upsert'; account: Account }
  | { type: 'account.delete'; id: string }
  | { type: 'contact.upsert'; contact: Contact }
  | { type: 'opportunity.upsert'; opportunity: Opportunity }
  | { type: 'opportunity.stage'; id: string; stage: Stage; lostReason?: string }
  | { type: 'task.upsert'; task: Task }
  | { type: 'task.toggle'; id: string }
  | { type: 'note.add'; note: Note }
  | { type: 'user.role'; id: string; role: User['role'] }
  | { type: 'user.active'; id: string; active: boolean }
  | { type: 'audit.log'; entry: Omit<AuditEntry, 'id' | 'ts' | 'actorId'> }

const REQUIRED: Record<Action['type'], Permission | null> = {
  'account.upsert': 'account:write', 'account.delete': 'account:delete', 'contact.upsert': 'account:write',
  'opportunity.upsert': 'opportunity:write', 'opportunity.stage': 'opportunity:write',
  'task.upsert': 'task:write', 'task.toggle': 'task:write', 'note.add': 'note:write',
  'user.role': 'user:manage', 'user.active': 'user:manage', 'audit.log': null,
}

export class PermissionError extends Error {}

const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some(x => x.id === item.id) ? list.map(x => (x.id === item.id ? item : x)) : [item, ...list]

let seq = 0
export const newId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`

interface Ctx { actor: User; now: Date }

/** Pure transition: enforces RBAC and appends an audit entry for every mutation. */
export function applyAction(db: Db, action: Action, { actor, now }: Ctx): Db {
  const need = REQUIRED[action.type]
  if (need && !can(actor.role, need)) throw new PermissionError(`${actor.role} lacks ${need}`)
  const log = (e: Omit<AuditEntry, 'id' | 'ts' | 'actorId'>, next: Db): Db =>
    ({ ...next, audit: [{ ...e, id: newId('au'), ts: now.toISOString(), actorId: actor.id }, ...next.audit].slice(0, 2000) })

  switch (action.type) {
    case 'account.upsert': {
      const exists = db.accounts.some(a => a.id === action.account.id)
      return log({ action: exists ? 'update' : 'create', entity: 'account', entityId: action.account.id, summary: `${exists ? 'Updated' : 'Created'} account ${action.account.name}` },
        { ...db, accounts: upsert(db.accounts, action.account) })
    }
    case 'account.delete': {
      const a = db.accounts.find(x => x.id === action.id)
      if (!a) return db
      return log({ action: 'delete', entity: 'account', entityId: a.id, summary: `Deleted account ${a.name} and its related records` }, {
        ...db,
        accounts: db.accounts.filter(x => x.id !== a.id),
        contacts: db.contacts.filter(x => x.accountId !== a.id),
        opportunities: db.opportunities.filter(x => x.accountId !== a.id),
        subscriptions: db.subscriptions.filter(x => x.accountId !== a.id),
        tasks: db.tasks.filter(x => x.accountId !== a.id),
        notes: db.notes.filter(x => x.accountId !== a.id),
      })
    }
    case 'contact.upsert':
      return log({ action: 'update', entity: 'contact', entityId: action.contact.id, summary: `Saved contact ${action.contact.name}` },
        { ...db, contacts: upsert(db.contacts, action.contact) })
    case 'opportunity.upsert': {
      const exists = db.opportunities.some(o => o.id === action.opportunity.id)
      return log({ action: exists ? 'update' : 'create', entity: 'opportunity', entityId: action.opportunity.id, summary: `${exists ? 'Updated' : 'Created'} opportunity ${action.opportunity.name}` },
        { ...db, opportunities: upsert(db.opportunities, action.opportunity) })
    }
    case 'opportunity.stage': {
      const o = db.opportunities.find(x => x.id === action.id)
      if (!o || o.stage === action.stage) return db
      if (action.stage === 'Closed Lost' && !action.lostReason) throw new Error('A lost reason is required')
      return log({ action: 'stage_change', entity: 'opportunity', entityId: o.id, summary: `${o.name}: ${o.stage} → ${action.stage}` },
        { ...db, opportunities: db.opportunities.map(x => (x.id === o.id ? { ...x, stage: action.stage, lostReason: action.lostReason } : x)) })
    }
    case 'task.upsert':
      return log({ action: 'update', entity: 'task', entityId: action.task.id, summary: `Saved task "${action.task.title}"` }, { ...db, tasks: upsert(db.tasks, action.task) })
    case 'task.toggle': {
      const t = db.tasks.find(x => x.id === action.id)
      if (!t) return db
      return log({ action: 'update', entity: 'task', entityId: t.id, summary: `${t.done ? 'Reopened' : 'Completed'} task "${t.title}"` },
        { ...db, tasks: db.tasks.map(x => (x.id === t.id ? { ...x, done: !x.done } : x)) })
    }
    case 'note.add':
      return log({ action: 'create', entity: 'note', entityId: action.note.id, summary: `Logged ${action.note.kind.toLowerCase()}` }, { ...db, notes: [action.note, ...db.notes] })
    case 'user.role': {
      const u = db.users.find(x => x.id === action.id)
      if (!u) return db
      if (u.id === actor.id) throw new Error('You cannot change your own role')
      return log({ action: 'role_change', entity: 'user', entityId: u.id, summary: `${u.name}: ${u.role} → ${action.role}` },
        { ...db, users: db.users.map(x => (x.id === u.id ? { ...x, role: action.role } : x)) })
    }
    case 'user.active': {
      const u = db.users.find(x => x.id === action.id)
      if (!u) return db
      if (u.id === actor.id) throw new Error('You cannot deactivate yourself')
      return log({ action: 'update', entity: 'user', entityId: u.id, summary: `${action.active ? 'Activated' : 'Deactivated'} ${u.name}` },
        { ...db, users: db.users.map(x => (x.id === u.id ? { ...x, active: action.active } : x)) })
    }
    case 'audit.log':
      return log(action.entry, db)
  }
}
