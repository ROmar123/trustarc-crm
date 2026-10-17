# Privacy CRM

Enterprise CRM for a privacy-compliance SaaS vendor: accounts & contacts, opportunity pipeline,
subscription/renewal tracking, account health scoring, tasks & activity, role-based access, and an audit trail.

> **Branding status:** colours, typeface and logo are **placeholders** (see `src/brand/tokens.css`, `src/brand/Logo.tsx`).
> They could not be verified against the live trustarc.com / trustarc.co.za sites from the build environment.
> Replace those two files with the official assets; no other code depends on specific values.
> Product names in the seed data follow public listings of TrustArc's offerings and should be checked against the site.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # domain + RBAC + audit tests
npm run build
```

## What's included
| Area | Details |
|---|---|
| Dashboard | ARR, open/weighted pipeline, win rate, pipeline-by-stage and ARR-by-product charts, at-risk accounts |
| Accounts | Search/filter/sort/paginate, create, CSV export (injection-safe), detail with subscriptions, opportunities, contacts, activity timeline |
| Pipeline | Drag-and-drop kanban, required lost-reason, create opportunity |
| Renewals | 30–365 day window, flags renewals with no open renewal opportunity |
| Tasks | Assign, complete, overdue highlighting |
| Audit log | Every mutation, stage change, role change, export and sign-in; filterable, exportable |
| Team & access | Role assignment, activate/deactivate, permission matrix |

## Architecture
- `src/domain` — pure types, RBAC matrix, metrics (health score, weighted pipeline, renewals), seed data. Fully unit-tested.
- `src/store` — `applyAction` is a pure reducer that **enforces permissions and writes an audit entry for every change**. The UI hides controls by permission, but enforcement lives here, not in components.
- `supabase/migrations/0001_init.sql` — production schema: typed enums, constraints, indexes, **row-level security per role**, and **server-side audit triggers** (the client cannot skip auditing; `audit_log` has no write policies).

## Demo vs production
The app runs on a browser `localStorage` store with a **demo role switcher** so it works with zero setup.
That is not authentication. To go to production: apply the migration, enable Supabase Auth (SSO/SAML + MFA),
replace the store's persistence with Supabase queries, and remove the role switcher. RLS then enforces the same
permission matrix server-side. See `SECURITY.md`.

## Roles
Administrator, Sales Manager, Account Executive, Customer Success, Read-only — see the matrix in **Team & access**.
