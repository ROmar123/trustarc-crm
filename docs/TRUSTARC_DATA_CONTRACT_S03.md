# TrustArc 2.0 — intentional data collection contract (S0.3)

**Scope: MANAGEMENT PORTAL + APP ONLY. The public marketing website MUST NOT be changed.**

## Core policy
- Collect fields for a defined operational purpose; add optional information only when a workflow needs it.
- Distinguish **quote request**, **enquiry**, **verified account**, **approved vehicle**, **eligible driver**, **scheduled trip**, **booking**, **payment**. These are separate states and records.
- Encrypt in transit, limit role / organisation visibility, audit access and changes; no personal information in URLs or analytics.
- User role switcher in the app is a preview, never an authority source.
- Before live storage: authenticate, verify organisation membership, enable RLS and test cross-account isolation, define retention/deletion and notices. POPIA review required.

## Stage A: search and exact quote
- Required: *verified* pickup pin and destination pin, trip mode (once-off / recurring / flexible), first date, preferred pickup time, passenger count.
- Conditional: recurring days when recurring, return pickup time when return required; accessibility/service needs only as voluntarily supplied (don't collect medical history).
- Contact: **one** valid contact channel (email OR SA phone). No identity document, DoB, family details, banking or card data.
- State: `quote_draft` (unsent) -> `quote_requested` (future secure submission) -> `quote_in_review` -> `quoted` -> `accepted` or `closed`.
- Search may suggest other routes, but each must be distinguished from the **exact request**.
- Fare is never calculated without an approved commercial pricing rule and real capacity check.

## Stage B: customer onboarding
- Required when proceeding: display name, authenticated contact, requested service plan and assigned booking/pickup stop.
- Conditional: billing details when issuing invoices; passenger details only when bookings require them; emergency contact only with documented safety rationale.
- Avoid: ID documents for ordinary quote requests; unnecessarily precise home-location retention; payment details stored outside a provider's tokenisation system.
- Customer view: only own trips, invoices, wallet and assigned vehicle, not the whole fleet.

## Stage C: driver qualification and activation
- Intake: name, verified contact, base availability, licence category and PrDP/PDP status.
- Before approval: verify identity, applicable licence, professional driving permit, required training/contract, signed policies and document expiration.
- Before payout: verified bank account/payee details, separated from journey dispatch.
- During trip: assignment, readiness check-in, trip completion, punctuality and relevant live vehicle/driver location.
- Do not track driver personal movements outside authorised work/assignment scope.

## Stage D: fleet owner and vehicle
- Fleet owner: legal business/person identity, authorised contacts, commercial arrangement, operating zone; banking details only when needed for eligible payouts.
- Vehicle draft: make, model, model year, *claimed* passenger seats excluding driver, and selected GPS provider.
- Verification before publication: registration (secured), legal seating capacity, passenger liability / insurance and expiry, licence/permit and roadworthiness as applicable, maintenance and vehicle inspection.
- Tracking binding: provider, provider vehicle ID, stable TrustArc vehicle ID, latest timestamp, source health, not credentials in browser.
- Vehicle catalogue is **reference only**. NHTSA vPIC is free but US-referenced. Provide South Africa local make/model overrides and manual entry; never derive seating capacity or compliance from a catalogue model.

## Role-specific access
- Customer: own contact, quote, booking, trips, wallet (no other customers).
- Driver: assigned manifest/pickup details while working; no customer banking/finance.
- Fleet owner: only owned authorised fleet, approved services, eligible settlement.
- TrustArc operators: need-to-know by delegated role, backed by audit trail.

## S0.3 implemented
- Exact quote request form preserving originally selected geocoded pins.
- Dedicated quote request preparation, with transparent **email-client handoff** or copy of request. NO database submission and NO invented price.
- Free vehicle make/model suggestions from NHTSA vPIC via public read-only API, plus common local South African models and manual overrides.
- Fleet local draft now uses make, model, year, actual claimed seats and tracking provider.
- Unit tests cover quote validation and local model fallbacks.

## Acceptance gates and next slice
**S0.3** must compile, pass unit tests, keep the public website untouched, and separate exact quote CTA from alternate route cards.

**S1 (next, existing plan):** Establish actual Supabase database and verified role-based authentication, write minimal quote records via authenticated/authorised server API, implement staff review and quote approval, and secure per-role access with RLS; make quote submission actually arrive in the management queue only *after* security tests. No unverified quote is allowed to reserve seats or issue invoices.
