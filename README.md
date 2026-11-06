# Current · Spa operations

A first implementation of a hot tub retailer's office and service workspace, based on the selected dark ocean-blue dispatch design. It has a React interface and a Node 24 / SQLite API. It is **not deployed, browser-verified, or ready to replace Service Autopilot**.

## Run locally

Requires Node 24+. From this directory:

```sh
npm ci --ignore-scripts --cache /tmp/current-npm-cache
npm run build
npm start
```

Open `http://127.0.0.1:4173`. With no `CURRENT_ADMIN_PASSWORD`, this runs a local sample workspace and binds only to loopback. First startup seeds fictional records using the current America/Chicago date. Records persist in `data/current.sqlite`; restarts do not reseed an existing database. Do not treat the managed execution workspace as permanent hosting or a backup.

`npm run dev` runs the frontend and API together through Vite on loopback. Its API uses the same local database. No external scripts, fonts, or analytics are loaded at runtime.

For password-protected operation, copy `.env.example` to `.env`, choose a unique password of at least 16 characters, build, then run:

```sh
node --env-file=.env server/index.mjs
```

The application has one shared office password, HttpOnly sessions, login throttling, same-origin write checks, input validation, prepared SQL statements, and version conflict detection. This is a **single-store, single-process foundation**, not individual employee authentication or a complete permissions system. Use HTTPS and `CURRENT_COOKIE_SECURE=true` for any remote hosting. Public deployment and real customer imports should wait for the remaining production work below.

## Implemented paths

- **Dispatch:** day and week schedules, service filters, date navigation, unassigned queue, drag-and-drop crew assignment and rescheduling, plus an edit form as a keyboard/touch alternative. Conflicting crew bookings are rejected. The current-time line uses America/Chicago.
- **Customers:** add/edit contacts, care-plan labels, access notes, SMS-consent records, multiple tubs with model/serial/capacity/warranty, and visit history.
- **Work orders:** service checklist, visit notes, parts and chemicals used, water tests, start/completion states, and invoice creation. Completion deducts stock transactionally once. Completed visits are locked against edits.
- **Recurrence:** completing a weekly, biweekly, or monthly visit creates the next visit in the unassigned queue. Monthly dates clamp to the next month's last day. This is completion-driven recurrence, not a scheduler that prebuilds every future appointment.
- **Routes:** crew stop lists in appointment order and a link that opens those addresses in Google Maps. No geocoding, travel-time estimation, optimization, or live tracking.
- **Inventory:** products, chemicals, filters, parts, tubs, SKUs, stock, location, reorder levels, cost and retail prices. Adjustments and service usage persist.
- **Water care:** customer/visit-linked readings and treatment notes. Flags are reference ranges, not chemical dosing recommendations.
- **Sales:** persistent opportunity pipeline, stage changes, values, and follow-up notes. This is not yet a line-item quote/approval or retail POS system.
- **Billing:** invoices, tax, draft/approved states, print layout, and recording full payments received externally with a reference. Paid invoices are locked. There is no card collection or payment processing.
- **Inbox:** stored SMS/email drafts and customer portal requests. No external messages are sent.
- **Workflows:** configurable event triggers and message-draft/task actions, enable/pause, template preview, and follow-up task completion. These run on job creation, job completion, or invoice creation; there is no time-based reminder worker yet.
- **Client portal:** expiring, revocable customer-scoped links; appointments and confirmation, water readings, approved invoices, and service requests. Link tokens are stored as hashes and excluded from exports. Access is by possession of the link, not an individual customer login. Links expire after seven days. Creating a new link revokes the old link.
- **Customer CSV import:** file size/row limits, field mapping, preview, email and name/address duplicate review, and all-or-nothing writes. Contacts only; no silent merge or destructive overwrite. Imported customers default to no SMS consent.
- **Reports and data:** operational totals, crew completion, stock alerts, workspace JSON export, and recent audit events.
- **Interface:** generated water header, blue actions, rounded surfaces, dark/light preference, responsive navigation, search, dialogs, focus states, reduced-motion support, notifications, and loading/error states.

## Provider connections and production work

The Settings screen deliberately reports all external providers as **not connected**. It does not save pretend credentials or claim to send or charge anything.

Before live use:

1. Finish browser interaction, accessibility, responsive, and visual QA against the selected concept. See `design-qa.md`.
2. Restore Sites' supported build helpers and browser access, then port the Node/SQLite storage/API to its supported server runtime and database bindings. This checkout is a standalone Node implementation; a static upload would not include its backend. No Site has been registered or published.
3. Add individual employee identity, membership/roles, technician-specific access, attributable audit events, customer account login if desired, and deployment-specific security review.
4. Integrate Authorize.net hosted checkout in sandbox, webhook signature validation, idempotency, reconciliation, refunds, deposits, and failed-payment handling. Never put merchant credentials or card data in frontend code.
5. Connect SMS/email providers; implement verified senders, consent/opt-out handling, delivery callbacks, retries, templates, and durable time-based reminder jobs. Customer opt-out must gate actual sending, not just the UI.
6. Add routing/geocoding and travel-time constraints, file/photo uploads with storage policies, warranty claims, purchase orders, inventory movements/van transfers, sales quote approvals, and accounting exports as appropriate.
7. Define migration mappings for properties, tubs, recurring agreements, work history, balances, invoices, and media. Validate sample exports, reconcile totals, and perform a parallel-run period before switching systems.
8. Set backup/restore, retention and deletion policies, monitoring, recovery procedures, and load tests. Export is useful but is not a tested database backup procedure.

## Project structure

- `src/App.tsx`: workspace shell, navigation, theme, search, authentication UI
- `src/Dispatch.tsx`: crew timeline, week view, route lists
- `src/Details.tsx`: customer and service detail panels
- `src/Pages.tsx`: office modules
- `src/pages/`: separate customer, stock, sales, billing, inbox, workflow, portal-management and reporting modules
- `src/ImportCenter.tsx`: reviewed CSV import
- `src/Portal.tsx`: customer portal
- `src/forms.ts`: reusable resource forms and input transformation
- `server/app.mjs`: validated API, sessions, portal scope, workflow events
- `server/schema.mjs`: entity validation and scheduling rules
- `server/store.mjs`: SQLite persistence and transactions
- `test/api.test.mjs`: domain, transaction, authentication, and portal tests

## Checks

```sh
npm run build
npm test
npm audit
```

The build and API tests are not evidence of browser behavior or design fidelity. That verification is explicitly blocked in this session.
