import type { Db, Opportunity, Stage, Subscription } from './types'
import { STAGE_PROBABILITY } from './types'

const iso = (now: Date, offsetDays: number): string => new Date(now.getTime() + offsetDays * 86_400_000).toISOString().slice(0, 10)

export function seedDb(now: Date = new Date()): Db {
  const d = (n: number) => iso(now, n)
  const products = [
    { id: 'p-arc', name: 'Arc Platform', description: 'Unified privacy management platform with workflow automation.', listArr: 60000 },
    { id: 'p-consent', name: 'Consent & Preferences', description: 'Cookie and consent management with preference centres.', listArr: 24000 },
    { id: 'p-mapping', name: 'Data Mapping & Risk Manager', description: 'Data inventory, flow mapping and risk scoring.', listArr: 48000 },
    { id: 'p-assess', name: 'Assessment Manager', description: 'DPIA / PIA / vendor assessments with templates.', listArr: 30000 },
    { id: 'p-dsar', name: 'Individual Rights Manager', description: 'Data subject request intake, fulfilment and SLAs.', listArr: 36000 },
    { id: 'p-ai', name: 'AI Governance', description: 'AI inventory, risk assessment and policy controls.', listArr: 42000 },
    { id: 'p-cert', name: 'Certifications & Assurance', description: 'Privacy certifications, attestations and advisory.', listArr: 18000 },
  ]
  const users = [
    { id: 'u1', name: 'Amara Okafor', email: 'amara.okafor@example.com', role: 'admin' as const, active: true },
    { id: 'u2', name: 'Daniel Reyes', email: 'daniel.reyes@example.com', role: 'sales_manager' as const, active: true },
    { id: 'u3', name: 'Priya Nair', email: 'priya.nair@example.com', role: 'account_executive' as const, active: true },
    { id: 'u4', name: 'Lukas Weber', email: 'lukas.weber@example.com', role: 'account_executive' as const, active: true },
    { id: 'u5', name: 'Sipho Dlamini', email: 'sipho.dlamini@example.com', role: 'csm' as const, active: true },
    { id: 'u6', name: 'Grace Liu', email: 'grace.liu@example.com', role: 'read_only' as const, active: true },
  ]
  const A = (id: string, name: string, industry: string, region: string, tier: 'Strategic' | 'Enterprise' | 'Mid-Market', ownerId: string, frameworks: string[], status: 'Prospect' | 'Customer' | 'Churned', employees: number) =>
    ({ id, name, industry, region, tier, ownerId, frameworks, status, employees, createdAt: d(-400) })
  const accounts = [
    A('a1', 'Northwind Financial Group', 'Financial Services', 'EMEA', 'Strategic', 'u3', ['GDPR', 'POPIA', 'PCI DSS'], 'Customer', 18000),
    A('a2', 'Helix Health Systems', 'Healthcare', 'North America', 'Strategic', 'u4', ['HIPAA', 'CCPA'], 'Customer', 9200),
    A('a3', 'Cobalt Retail Holdings', 'Retail', 'North America', 'Enterprise', 'u3', ['CCPA', 'GDPR'], 'Customer', 5400),
    A('a4', 'Meridian Telecom', 'Telecommunications', 'APAC', 'Enterprise', 'u4', ['PDPA', 'GDPR'], 'Customer', 7800),
    A('a5', 'Atlas Logistics', 'Logistics', 'EMEA', 'Mid-Market', 'u3', ['GDPR'], 'Prospect', 1900),
    A('a6', 'Quanta Software', 'Technology', 'North America', 'Mid-Market', 'u4', ['CCPA', 'SOC 2'], 'Prospect', 1200),
    A('a7', 'Sable Insurance', 'Insurance', 'EMEA', 'Enterprise', 'u3', ['GDPR', 'POPIA'], 'Prospect', 4300),
    A('a8', 'Verdant Energy', 'Energy', 'LATAM', 'Mid-Market', 'u4', ['LGPD'], 'Customer', 2600),
    A('a9', 'Orion Education Trust', 'Education', 'EMEA', 'Mid-Market', 'u3', ['GDPR', 'FERPA'], 'Churned', 800),
    A('a10', 'Lumen Media', 'Media', 'North America', 'Enterprise', 'u4', ['CCPA', 'GDPR'], 'Prospect', 3100),
  ]
  const C = (id: string, accountId: string, name: string, title: string, role: Db['contacts'][number]['role']) =>
    ({ id, accountId, name, title, role, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com` })
  const contacts = [
    C('c1', 'a1', 'Elena Vasquez', 'Chief Privacy Officer', 'Economic Buyer'),
    C('c2', 'a1', 'Tomas Berg', 'Head of Data Governance', 'Champion'),
    C('c3', 'a2', 'Dr. Naomi Hart', 'VP Compliance', 'Economic Buyer'),
    C('c4', 'a2', 'Jin Park', 'Privacy Engineer', 'Technical'),
    C('c5', 'a3', 'Marcus Doyle', 'Director of Legal', 'Legal / DPO'),
    C('c6', 'a4', 'Aiko Tanaka', 'Data Protection Officer', 'Champion'),
    C('c7', 'a5', 'Ines Moreau', 'Compliance Manager', 'Champion'),
    C('c8', 'a6', 'Ravi Menon', 'CISO', 'Economic Buyer'),
    C('c9', 'a7', 'Hannah Schultz', 'General Counsel', 'Economic Buyer'),
    C('c10', 'a8', 'Lucia Ferreira', 'Privacy Lead', 'Champion'),
    C('c11', 'a10', 'Owen Pritchard', 'VP Legal Ops', 'Champion'),
  ]
  const S = (id: string, accountId: string, productId: string, arr: number, start: number, end: number, status: Subscription['status'] = 'Active'): Subscription =>
    ({ id, accountId, productId, arr, startDate: d(start), endDate: d(end), status })
  const subscriptions = [
    S('s1', 'a1', 'p-arc', 96000, -300, 65, 'Pending Renewal'),
    S('s2', 'a1', 'p-mapping', 52000, -300, 65, 'Pending Renewal'),
    S('s3', 'a2', 'p-arc', 120000, -200, 165),
    S('s4', 'a2', 'p-ai', 44000, -90, 275),
    S('s5', 'a3', 'p-consent', 28000, -330, 35, 'Pending Renewal'),
    S('s6', 'a4', 'p-dsar', 40000, -150, 215),
    S('s7', 'a4', 'p-assess', 32000, -150, 215),
    S('s8', 'a8', 'p-consent', 22000, -340, 25, 'Pending Renewal'),
    S('s9', 'a9', 'p-assess', 24000, -500, -135, 'Churned'),
  ]
  const O = (id: string, accountId: string, name: string, stage: Stage, amount: number, close: number, ownerId: string, type: Opportunity['type'], productIds: string[]): Opportunity =>
    ({ id, accountId, name, stage, amount, closeDate: d(close), ownerId, type, productIds })
  const opportunities = [
    O('o1', 'a1', 'Northwind – FY renewal (Arc + Mapping)', 'Proposal', 148000, 55, 'u3', 'Renewal', ['p-arc', 'p-mapping']),
    O('o2', 'a2', 'Helix – Individual Rights expansion', 'Solution Fit', 36000, 80, 'u4', 'Expansion', ['p-dsar']),
    O('o3', 'a3', 'Cobalt – Consent renewal', 'Qualified', 28000, 30, 'u3', 'Renewal', ['p-consent']),
    O('o4', 'a5', 'Atlas – Arc Platform new logo', 'Negotiation', 72000, 21, 'u3', 'New', ['p-arc', 'p-consent']),
    O('o5', 'a6', 'Quanta – Consent & Assessments', 'Prospecting', 54000, 120, 'u4', 'New', ['p-consent', 'p-assess']),
    O('o6', 'a7', 'Sable – AI Governance + Mapping', 'Proposal', 90000, 60, 'u3', 'New', ['p-ai', 'p-mapping']),
    O('o7', 'a10', 'Lumen – Privacy programme', 'Qualified', 66000, 95, 'u4', 'New', ['p-arc']),
    O('o8', 'a4', 'Meridian – AI Governance upsell', 'Negotiation', 42000, 28, 'u4', 'Expansion', ['p-ai']),
    O('o9', 'a8', 'Verdant – Mapping add-on', 'Closed Won', 48000, -20, 'u4', 'Expansion', ['p-mapping']),
    O('o10', 'a9', 'Orion – Win-back', 'Closed Lost', 24000, -45, 'u3', 'Renewal', ['p-assess']),
  ]
  opportunities[9].lostReason = 'Budget freeze'
  const T = (id: string, accountId: string, title: string, due: number, assigneeId: string, priority: 'High' | 'Medium' | 'Low', done = false) =>
    ({ id, accountId, title, dueDate: d(due), assigneeId, priority, done })
  const tasks = [
    T('t1', 'a8', 'Open renewal opportunity for Verdant consent', -3, 'u5', 'High'),
    T('t2', 'a1', 'Executive business review prep', 7, 'u3', 'Medium'),
    T('t3', 'a3', 'Send redlined MSA to Cobalt legal', -1, 'u3', 'High'),
    T('t4', 'a5', 'Security questionnaire for Atlas', 4, 'u3', 'High'),
    T('t5', 'a2', 'Schedule AI governance workshop', 12, 'u5', 'Low'),
    T('t6', 'a7', 'Intro call with Sable DPO', -6, 'u3', 'Medium', true),
  ]
  const notes = [
    { id: 'n1', accountId: 'a1', authorId: 'u3', kind: 'Meeting' as const, body: 'QBR held. CPO wants cross-border transfer mapping before renewal.', createdAt: d(-12) },
    { id: 'n2', accountId: 'a2', authorId: 'u5', kind: 'Call' as const, body: 'Onboarding of AI governance module complete; two admins trained.', createdAt: d(-20) },
    { id: 'n3', accountId: 'a3', authorId: 'u3', kind: 'Email' as const, body: 'Legal asked for a DPA with updated SCCs.', createdAt: d(-4) },
    { id: 'n4', accountId: 'a4', authorId: 'u4', kind: 'Call' as const, body: 'DPO interested in AI risk assessments for APAC rollouts.', createdAt: d(-9) },
    { id: 'n5', accountId: 'a5', authorId: 'u3', kind: 'Meeting' as const, body: 'Demo delivered to compliance + IT; pricing under review.', createdAt: d(-6) },
    { id: 'n6', accountId: 'a8', authorId: 'u5', kind: 'Email' as const, body: 'Renewal reminder sent.', createdAt: d(-95) },
  ]
  return { users, accounts, contacts, products, opportunities, subscriptions, tasks, notes, audit: [] }
}

export const probabilityOf = (stage: Stage): number => STAGE_PROBABILITY[stage]
