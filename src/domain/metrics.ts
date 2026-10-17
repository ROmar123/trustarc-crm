import { STAGES, STAGE_PROBABILITY, type Account, type Db, type Opportunity, type Stage, type Subscription } from './types'

export const DAY = 86_400_000
export const daysBetween = (fromIso: string, to: Date): number =>
  Math.round((new Date(fromIso).getTime() - to.getTime()) / DAY)

export const isOpen = (o: Opportunity): boolean => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost'

export function pipelineByStage(opps: Opportunity[]): { stage: Stage; count: number; amount: number }[] {
  return STAGES.map(stage => {
    const inStage = opps.filter(o => o.stage === stage)
    return { stage, count: inStage.length, amount: inStage.reduce((s, o) => s + o.amount, 0) }
  })
}

export const weightedPipeline = (opps: Opportunity[]): number =>
  opps.filter(isOpen).reduce((s, o) => s + o.amount * STAGE_PROBABILITY[o.stage], 0)

/** Win rate by count of closed opportunities; null when nothing has closed. */
export function winRate(opps: Opportunity[]): number | null {
  const won = opps.filter(o => o.stage === 'Closed Won').length
  const lost = opps.filter(o => o.stage === 'Closed Lost').length
  return won + lost === 0 ? null : won / (won + lost)
}

export const activeArr = (subs: Subscription[]): number =>
  subs.filter(s => s.status !== 'Churned').reduce((s, x) => s + x.arr, 0)

export function renewalsDue(subs: Subscription[], withinDays: number, now: Date): Subscription[] {
  return subs
    .filter(s => s.status !== 'Churned')
    .filter(s => { const d = daysBetween(s.endDate, now); return d >= 0 && d <= withinDays })
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
}

export interface Health { score: number; label: 'Healthy' | 'Watch' | 'At risk'; reasons: string[] }

/** 0-100 score from renewal proximity, overdue tasks, engagement recency and exec sponsor coverage. */
export function accountHealth(db: Db, account: Account, now: Date): Health {
  let score = 100
  const reasons: string[] = []
  const subs = db.subscriptions.filter(s => s.accountId === account.id && s.status !== 'Churned')
  const nearest = subs.map(s => daysBetween(s.endDate, now)).filter(d => d >= 0).sort((a, b) => a - b)[0]
  const hasRenewalOpp = db.opportunities.some(o => o.accountId === account.id && o.type === 'Renewal' && isOpen(o))
  if (nearest !== undefined && nearest <= 90 && !hasRenewalOpp) { score -= 25; reasons.push(`Renews in ${nearest}d with no renewal opportunity`) }
  const overdue = db.tasks.filter(t => t.accountId === account.id && !t.done && daysBetween(t.dueDate, now) < 0).length
  if (overdue > 0) { score -= Math.min(30, overdue * 10); reasons.push(`${overdue} overdue task${overdue > 1 ? 's' : ''}`) }
  const lastTouch = db.notes.filter(n => n.accountId === account.id).map(n => n.createdAt).sort().at(-1)
  if (account.status === 'Customer') {
    if (!lastTouch || -daysBetween(lastTouch, now) > 60) { score -= 25; reasons.push('No engagement in 60+ days') }
    if (!db.contacts.some(c => c.accountId === account.id && c.role === 'Economic Buyer')) { score -= 15; reasons.push('No economic buyer mapped') }
  }
  score = Math.max(0, score)
  return { score, label: score >= 75 ? 'Healthy' : score >= 50 ? 'Watch' : 'At risk', reasons }
}

export const formatMoney = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
