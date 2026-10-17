import type { Permission, Role } from './types'

const ALL: Permission[] = [
  'account:read', 'account:write', 'account:delete', 'opportunity:write', 'task:write',
  'note:write', 'audit:read', 'user:manage', 'data:export',
]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL,
  sales_manager: ['account:read', 'account:write', 'opportunity:write', 'task:write', 'note:write', 'audit:read', 'data:export'],
  account_executive: ['account:read', 'account:write', 'opportunity:write', 'task:write', 'note:write'],
  csm: ['account:read', 'task:write', 'note:write', 'opportunity:write'],
  read_only: ['account:read'],
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator', sales_manager: 'Sales Manager', account_executive: 'Account Executive',
  csm: 'Customer Success', read_only: 'Read-only',
}

export const can = (role: Role, p: Permission): boolean => ROLE_PERMISSIONS[role].includes(p)
