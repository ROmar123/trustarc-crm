# TrustArc 2.0 — Replacement Build Plan

## What this branch is
This branch replaces the CRM *interface entry point* with a new TrustArc 2.0 application shell that mirrors the existing public website. Existing CRM page source remains intact for staged migration. No live backend, customer data, payment processing, Cartrack or Netstar accounts have been connected in this branch.

**Website brand source:** `ROmar123/Trustarc-the-real-`, `src/index.css` and `src/components/TrustArcLogo.tsx`.
Brand tokens: violet `#7C3AED`, near-black `#0C0C0F`, near-white `#FDFCFE`, Outfit display, Inter text, TrustArc shield.

## Hard constraints
1. Never overwrite or delete current CRM/website production data during migration.
2. New role switcher is **visual preview only**. It cannot grant backend permissions.
3. Production views require authenticated users, verified organisation membership, and backend-enforced RLS/authorisation. No public service-role keys.
4. Never expose live customer pickup pins to unrelated customers, drivers or fleet owners.
5. Driver/vehicle live location is customer-visible only for their authorised assigned trip and permitted tracking window.
6. Do not confuse an advertised vehicle, confirmed trip assignment, passenger entitlement or bookable seat.
7. No real-wallet stored money until payment arrangement and South African legal requirements are reviewed.
8. No live tracking without provider credentials, account authorisation, rate-limit review and stale-data handling.
9. Existing frontend data may depend on a Supabase project other than the visible 'TrustArc Control' project. Verify actual environments before linking databases.
10. This branch is a preview and must not be treated as a production-ready launch or proof of POPIA compliance.

## Architecture
- One user identity with multiple verified roles and organisation scopes.
- One vehicle registry independent of tracking provider.
- Fleet owner → fleet asset → availability commitment → route offering → scheduled trip → driver → customer booking.
- Provider adapters: Cartrack, Netstar, future partners. Backend ingestion normalises coordinates and timestamps to `src/v2/tracking.js` contract.
- Finance: fares, billing agreement, invoice/payment, travel-credit ledger, provider settlement.
- Events: booking confirmed, vehicle unavailable, tracker stale, trip delayed, invoice paid, supply approved.
- PWA in future iteration (install manifest, offline shell, supported push, iOS install guidance). Background GPS is not entrusted to PWA alone.

## Incremental delivery — credit-conscious vertical slices
Each implementation turn receives one slice ID, exact file paths, acceptance tests and scope exclusions.
- **S0 (current):** New website-aligned app shell, scoped UI foundation, provider-neutral tracking contract and tests. No production access.
- **S1:** Confirm real databases and staff identity model. Add production-safe access gate and privacy policies; test role isolation.
- **S2:** Implement fleet registry schema and read/write APIs, vehicle assignment integrity, fleet-owner segregation.
- **S3:** Cartrack adapter with fixture tests, then authorised sandbox feed.
- **S4:** Netstar adapter with fixture tests, then authorised sandbox feed.
- **S5:** Secure live GPS Control Centre with stale markers, trip-scoped customer visibility.
- **S6:** Route definitions, geocoded stops, route instance + trip assignment, ETA using validated vehicle position.
- **S7:** Installable customer PWA with route discovery, availability and trip screen.
- **S8:** Transactional seat inventory, daily bookings and subscriptions with payment-verified confirmation.
- **S9:** Fleet-owner supply creation, TrustArc commercial approvals and matching.
- **S10:** Customer credits/wallet ledger, recurring billing, reconciliation and partner settlements.
- **S11:** Driver readiness, replacement rules, missed check-ins, 10-minute predicted delay alerts and operational exceptions.
- **S12:** Staged cutover, reconciliation, backups, user acceptance, security review and rollout.

## Slice completion definition
A slice is done only when:
1. Code is committed on a nonproduction branch with a clear diff.
2. Tests pass (unit and integration as appropriate).
3. No new unapproved production data access.
4. Dependencies and acceptance criteria for next slice are recorded.
5. A rollback path is documented.

## Current verified audit
- Public website repository uses Vite/React, Firebase dependencies, white/black/violet brand.
- CRM repository uses Vite/React, Supabase JS and Leaflet; its old interface includes vehicles, routes, trips, bookings, invoicing etc.
- Active Supabase project called TrustArc Control was found but its public schema table listing was empty at audit time. Do not assume it is the old CRM database.
- No real Cartrack/Netstar credentials or tracking records were viewed.

## S0.2 — Mobile-first experience (2026-11-01)
- **Actual website style**: Warm cream `#f8f6f1`, page ink `#292133`, lighter violet `#73449f`, Outfit headings weight 500, serif-emphasis details, small JetBrains Mono eyebrows and pill controls. The original website `src/pages/landing.css` is the source of truth for these nuances; do not reinstate the dark CRM sidebar.
- **New entry**: `src/App.jsx` now renders `src/v2/TrustArcApp.jsx` and `src/v2/TrustArcApp.css`.
- **Persistent mobile bottom navigation**: Customer Home/Explore/Journeys/Wallet/Profile; Driver Home/Trips/Navigate/Earnings/Profile; Fleet Owner Home/Routes/Fleet/Earnings/Profile; Operations Home/Routes/Fleet/Live/More. Bottom dock honours iOS safe areas, with desktop dock too.
- **Experience**: Customer route search (demo only), marketplace example cards, a route detail bottom sheet with stop-proposal and fare options; role-specific landing views; fleet/route local draft workflows; wallet, tracking and privacy placeholders.
- **Installability foundation**: `public/app.webmanifest`, `public/trustarc-icon.png` copied from the authentic website, and `public/trustarc-sw.js` caches only static versioned assets. iOS Safari 'Add to Home Screen' guidance and Android browser install prompt support.
- **Security**: No live credentials, payment operations, customers or GPS. Switching role is an interface preview; it must not become an authorisation mechanism. Vercel development branch remains protected and separate from production.
- **Verification**: GitHub Actions node tests and Vite build succeeded for commit `363da33157818dd8cded2a389378d2d93a054d49`; Vercel preview reported READY. Visual user acceptance on mobile is still required.

### Next slice S1 — foundation integration gate
1. Identify actual production CRM database vs the active TrustArc Control Supabase project, and map existing business tables without changing either.
2. Design and test real authentication, organisation membership, and role-aware session routing.
3. Implement default-deny authorisation and RLS in a safe staging database first; cross-role access tests are mandatory.
4. Then connect verified read-only vehicles and trips, replacing example cards and empty state indicators, preserving POPIA isolation.
5. Gate production cutover behind reconciliation, backup, rollback and explicit acceptance.


## S0.4 — Mobile quote layout, visual analytics and functional transparency
- **Scope:** Only `ROmar123/trustarc-crm` on development branch. NEVER edit or release `ROmar123/Trustarc-the-real-` without explicit separate authorisation.
- **Bug fix:** Date/time native inputs on the exact-quote form constrain inline width, shrink safely within CSS grids, preserve native iOS picker, and stack fields under 780px. Mapbox address dropdown stays unclipped.
- **Visuals:** Original lightweight SVG route network infographic, journey stages, dashboard readiness doughnut and architecture data flow, GPS-provider connection illustration. No screenshots, external images or invented business KPIs.
- **Truthful metrics:** Dashboard readiness counts only known preview module states. No fabricated vehicle counts, journey dates, bookings, occupancy, revenue or ETA.
- **Transparency:** App has 'What works?' page explaining preview capabilities vs blocked backend features; shortcut in banner and profile. Include PWA installation constraints and POPIA caution.
- **Working preview:** role tab navigation, address suggestions when Mapbox config works, selected geocoded pins, route example cards, exact quote drafting/validation and email-client handoff, free make/model suggestions with manual SA fallback, local drafts for people/fleet/route, manifest/install instructions.
- **NOT live:** verified login/RLS, database-backed onboarding/quote storage, actual fleet registry, GPS feed/ETA, route-to-pin matching, confirmed seats, booking payments, subscriptions, wallet and dispatch.
- **S1 next unchanged:** Verify the actual Supabase deployment/database; implement staff/customer authentication and scoped RLS in safe staging; backend quote submission with audit and access tests; then read-only fleet and actual ops metrics.
- **Exit criteria:** CI Node tracking/quote/model tests and Vite build pass; preview deployment READY; visual acceptance on real iPhone/Android still needed; production website untouched.
