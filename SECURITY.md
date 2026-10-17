# Security notes

- **Secrets:** never commit `.env`; only `.env.example` is tracked. (The previous `trustarc-crm` repo committed a Supabase URL/anon key in `.env` — rotate it if it is live.)
- **AuthN/Z:** the demo role switcher is for evaluation only. Production must use Supabase Auth with SSO + MFA; RLS in `supabase/migrations` enforces roles server-side.
- **Audit:** server-side triggers log all writes; `audit_log` is append-only (no write policies).
- **Exports:** CSV cells beginning with `= + - @` are prefixed to prevent spreadsheet formula injection; exports are audited and permission-gated.
- **Least privilege:** read-only cannot write or read the audit log; only admins delete accounts or change roles; users cannot change their own role.
- **Not yet implemented:** field-level encryption, SCIM provisioning, data-retention jobs, rate limiting, tenant isolation (single-tenant today).
