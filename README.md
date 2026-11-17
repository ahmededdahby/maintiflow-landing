# MaintiFlow — Cloudflare Worker landing page

French-first React landing page and D1 early-access signup system for the **proposed** Moroccan SaaS MaintiFlow. The dashboard data and pricing are illustrative.

## Live Worker / build
Existing Worker: https://maintiflow-landing.ahdahby.workers.dev/
GitHub CI: npm run check
Cloudflare build: npm run build
Cloudflare deploy: npx wrangler deploy

The Worker serves both static assets and /api/config plus /api/early-access. Do NOT create a second Worker.

## D1 binding (important)
Existing D1 database: maintiflow-leads, binding name **DB**.
The existing database UUID is **not committed** in wrangler.jsonc. You should add the **actual** database_id to the d1_databases config before the next Wrangler deployment. A Wrangler deploy may otherwise remove the dashboard-managed binding; if signup switches off, reconnect DB to your existing database. Never invent an ID or create a second database.

Example top-level config property:
  "d1_databases": [{"binding":"DB","database_name":"maintiflow-leads","database_id":"YOUR_REAL_UUID"}]

The table early_access already exists; no new SQL migration is needed.

## New: Email notifications (optional, requires Resend)
The Cloudflare Worker now supports an alert whenever a **new** email is registered.

1. Create a Resend account at https://resend.com/.
2. Configure **RESEND_API_KEY** as a Worker secret. Don't paste it into GitHub or ChatGPT.
3. Configure **RESEND_FROM** as a Worker text variable with a sender verified in Resend. To test with the Resend sandbox, the sample sender is "MaintiFlow <onboarding@resend.dev>", which is limited to Resend account-owner destinations. For reliable production sending, verify a domain you control.
4. CONTACT_EMAIL is the notification recipient: maintiflow.contact@gmail.com.
5. Deploy, register a **new unique test email** and check the D1 table and Resend logs/Gmail inbox.

Email alerts include only the registration's random ID. No prospect name or address is passed to the email vendor. Email sending uses waitUntil and Resend's idempotency key. It is **best effort**, not a guaranteed queue or retry system. D1 signup succeeds even if Resend fails.

## New: Privacy and anti-spam
- Cloudflare Turnstile is **optional** but recommended before broad outreach. Create a Turnstile widget for the Worker hostname in Cloudflare and set TURNSTILE_SITE_KEY (text) and TURNSTILE_SECRET_KEY (secret). Both must be provided or registrations are disabled. The client displays the widget and the Worker validates tokens with Siteverify and hostname checks.
- Retention: a Cloudflare scheduled event runs daily at 03:17 UTC and deletes leads older than **180 days** from early_access, provided DB remains bound. This does not clear existing Cloudflare backups.
- Users can request access, rectification and deletion at CONTACT_EMAIL, after identity verification.
- The privacy notice explains data purpose, fields and retention. The project still needs its **real legal controller identity**, appropriate Moroccan CNDP formalities and review of third-party processing before public marketing. See https://www.cndp.ma/formalites/.
- Honeypot, validation, size limits, same-origin checks and unique emails remain. Configure a Cloudflare WAF rate-limit rule before major campaigns.

Manual deletion after verifying the person owns the email:
  DELETE FROM early_access WHERE email='verified@example.com';

No API key, Turnstile secret or database ID should be guessed or committed.

## Tests
npm install
npm run check

To verify the live deployment:
1. GET /api/config should show contactEmail and registrationEnabled:true.
2. Submit a new test lead.
3. Check D1: SELECT id,email,company,created_at FROM early_access ORDER BY created_at DESC LIMIT 10;
4. If notifications are configured, check Gmail and Resend Logs.

## Compliance hold: intentional signup pause (17 Nov 2026)
The operator is an individual, not a registered company. A privacy/CNDP review is outstanding. To avoid collecting additional data before required formalities and correct controller identification are in place, the signup code now requires an explicit Worker text variable **`PRIVACY_REVIEW_COMPLETE=true`**. If unset (the safe default), both /api/config and the signup endpoint deny new leads while the static website continues serving. Restore only after the real controller details, applicable CNDP treatment/transfer formalities, published notice, and security checks have been completed. See `docs/CNDP_FILING_PACK.md` and `docs/PRIVACY_NOTICE_DRAFT_FR.md`. This gate does not delete existing D1 records.

## Release hardening proposal — rate limiter (feature branch)
The proposed `SIGNUP_RATE_LIMIT` Cloudflare Worker-native binding throttles `POST /api/early-access` to **10 attempts per client IP per 60 seconds per Cloudflare location**. It runs before Turnstile and D1. Workers Rate Limiting is approximate/eventually consistent, not an abuse-proof global cap. A missing binding or trusted CF-Connecting-IP fails signup closed (503); throttling returns 429 with Retry-After: 60. The binding namespace ID in wrangler.jsonc is a user-chosen integer label, **not a secret or an existing allocated Cloudflare object**.

**Do not merge or deploy this branch until you have added the actual `maintiflow-leads` D1 UUID to `wrangler.jsonc` and confirmed binding preservation.** The main branch and live Worker remain unchanged. See `docs/PRODUCTION_RELEASE_CHECKLIST.md`.

## Public privacy notice fields — required before merging this PR
The 17 Nov live privacy text still says the legal controller identity/CNDP formalities "must be finalized" while signups are open. To replace that placeholder **without committing the natural person's identifying details to GitHub**, configure three **public** Worker text variables in Cloudflare Dashboard → Worker → Settings → Variables and Secrets:

- `PUBLIC_CONTROLLER_IDENTITY`: true and legally sufficient identification of the real natural-person data controller (include the required legal contact/address details as advised). This **will appear on the public website**.
- `PUBLIC_CNDP_DISCLOSURE`: accurate CNDP receipt/declaration/authorization reference, or any legally applicable status after advice; never invent a number.
- `PUBLIC_TRANSFER_DISCLOSURE`: truthful information about Cloudflare D1 storage, other relevant subprocessors, backup location and any applicable international transfers/authorization.

These values are returned in public `/api/config` and rendered into the footer. **They are not secrets**; do not put identity documents, ID numbers or unapproved personal particulars in them. The signup GET and POST endpoints fail closed until all three are nonempty and within validated lengths, in addition to `PRIVACY_REVIEW_COMPLETE=true`. Text presence does not prove a legal filing is valid. Set them and verify the visible notice **before** merging/deploying; otherwise signups will be paused after release.
