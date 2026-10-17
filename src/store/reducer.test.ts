import { describe, expect, it } from 'vitest'
import { seedDb } from '../domain/seed'
import { applyAction, PermissionError } from './reducer'

const NOW = new Date('2026-01-15T00:00:00Z')
const db = seedDb(NOW)
const as = (id: string) => ({ actor: db.users.find(u => u.id === id)!, now: NOW })

describe('applyAction', () => {
  it('blocks writes for read-only users', () => {
    expect(() => applyAction(db, { type: 'task.toggle', id: 't1' }, as('u6'))).toThrow(PermissionError)
  })
  it('records an audit entry for stage changes', () => {
    const next = applyAction(db, { type: 'opportunity.stage', id: 'o5', stage: 'Qualified' }, as('u4'))
    expect(next.opportunities.find(o => o.id === 'o5')!.stage).toBe('Qualified')
    expect(next.audit[0]).toMatchObject({ action: 'stage_change', actorId: 'u4', entityId: 'o5' })
  })
  it('requires a lost reason when closing as lost', () => {
    expect(() => applyAction(db, { type: 'opportunity.stage', id: 'o5', stage: 'Closed Lost' }, as('u4'))).toThrow(/lost reason/)
  })
  it('cascades account deletion to related records', () => {
    const next = applyAction(db, { type: 'account.delete', id: 'a1' }, as('u1'))
    expect(next.contacts.some(c => c.accountId === 'a1')).toBe(false)
    expect(next.subscriptions.some(s => s.accountId === 'a1')).toBe(false)
  })
  it('only admins may delete accounts and nobody may change their own role', () => {
    expect(() => applyAction(db, { type: 'account.delete', id: 'a1' }, as('u2'))).toThrow(PermissionError)
    expect(() => applyAction(db, { type: 'user.role', id: 'u1', role: 'read_only' }, as('u1'))).toThrow(/own role/)
  })
})
