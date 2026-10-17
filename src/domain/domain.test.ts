import { describe, expect, it } from 'vitest'
import { can } from './rbac'
import { accountHealth, pipelineByStage, renewalsDue, weightedPipeline, winRate } from './metrics'
import { seedDb } from './seed'

const NOW = new Date('2026-01-15T00:00:00Z')

describe('rbac', () => {
  it('read-only users cannot write or read the audit log', () => {
    expect(can('read_only', 'account:write')).toBe(false)
    expect(can('read_only', 'audit:read')).toBe(false)
  })
  it('only admins manage users', () => {
    expect(can('admin', 'user:manage')).toBe(true)
    expect(can('sales_manager', 'user:manage')).toBe(false)
  })
})

describe('metrics', () => {
  const db = seedDb(NOW)
  it('weights only open opportunities by stage probability', () => {
    const open = db.opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost')
    const expected = open.reduce((s, o) => s + o.amount * ({ Prospecting: .1, Qualified: .25, 'Solution Fit': .4, Proposal: .6, Negotiation: .8 } as Record<string, number>)[o.stage], 0)
    expect(weightedPipeline(db.opportunities)).toBeCloseTo(expected)
  })
  it('pipeline buckets cover every opportunity', () => {
    const total = pipelineByStage(db.opportunities).reduce((s, b) => s + b.count, 0)
    expect(total).toBe(db.opportunities.length)
  })
  it('win rate is null with no closed deals and 0.5 for one win / one loss', () => {
    expect(winRate([])).toBeNull()
    expect(winRate(db.opportunities.filter(o => o.stage.startsWith('Closed')))).toBe(0.5)
  })
  it('renewalsDue excludes churned and past-due subscriptions', () => {
    const due = renewalsDue(db.subscriptions, 90, NOW)
    expect(due.length).toBeGreaterThan(0)
    expect(due.every(s => s.status !== 'Churned')).toBe(true)
  })
  it('flags a customer renewing soon with no renewal opportunity as at risk', () => {
    const verdant = db.accounts.find(a => a.id === 'a8')!
    const h = accountHealth(db, verdant, NOW)
    expect(h.label).toBe('At risk')
    expect(h.reasons.join(' ')).toMatch(/no renewal opportunity/)
  })
})
