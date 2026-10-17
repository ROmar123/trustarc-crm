export type Role = 'admin' | 'sales_manager' | 'account_executive' | 'csm' | 'read_only'

export type Permission =
  | 'account:read' | 'account:write' | 'account:delete'
  | 'opportunity:write' | 'task:write' | 'note:write'
  | 'audit:read' | 'user:manage' | 'data:export'

export const STAGES = [
  'Prospecting', 'Qualified', 'Solution Fit', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost',
] as const
export type Stage = (typeof STAGES)[number]

export const STAGE_PROBABILITY: Record<Stage, number> = {
  Prospecting: 0.1, Qualified: 0.25, 'Solution Fit': 0.4, Proposal: 0.6,
  Negotiation: 0.8, 'Closed Won': 1, 'Closed Lost': 0,
}

export interface User { id: string; name: string; email: string; role: Role; active: boolean }

export type Tier = 'Strategic' | 'Enterprise' | 'Mid-Market'
export interface Account {
  id: string; name: string; industry: string; region: string; tier: Tier
  ownerId: string; frameworks: string[]; status: 'Prospect' | 'Customer' | 'Churned'
  employees: number; createdAt: string
}

export type ContactRole = 'Champion' | 'Economic Buyer' | 'Legal / DPO' | 'Technical' | 'User'
export interface Contact { id: string; accountId: string; name: string; title: string; email: string; role: ContactRole }

export interface Product { id: string; name: string; description: string; listArr: number }

export type OppType = 'New' | 'Expansion' | 'Renewal'
export interface Opportunity {
  id: string; accountId: string; name: string; stage: Stage; amount: number
  closeDate: string; ownerId: string; type: OppType; productIds: string[]; lostReason?: string
}

export interface Subscription {
  id: string; accountId: string; productId: string; arr: number
  startDate: string; endDate: string; status: 'Active' | 'Pending Renewal' | 'Churned'
}

export interface Task {
  id: string; accountId: string; title: string; dueDate: string
  assigneeId: string; done: boolean; priority: 'High' | 'Medium' | 'Low'
}

export interface Note { id: string; accountId: string; authorId: string; kind: 'Note' | 'Call' | 'Meeting' | 'Email'; body: string; createdAt: string }

export interface AuditEntry {
  id: string; ts: string; actorId: string; action: 'create' | 'update' | 'delete' | 'stage_change' | 'login' | 'role_change' | 'export'
  entity: string; entityId: string; summary: string
}

export interface Db {
  users: User[]; accounts: Account[]; contacts: Contact[]; products: Product[]
  opportunities: Opportunity[]; subscriptions: Subscription[]; tasks: Task[]
  notes: Note[]; audit: AuditEntry[]
}
