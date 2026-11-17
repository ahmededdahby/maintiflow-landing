# MaintiFlow — production go-live checklist

**Status: CONDITIONAL — functional signup passed, remaining operational/legal gates below.**
Updated 17 Nov 2026. The product is **in validation**, not a finished SaaS. This is a public repository: don't commit personal identifiers, CNDP receipts, leads or secrets.

## 1. Verified functional flow
- [x] Operator confirmed Turnstile success, new lead saved to existing Cloudflare D1, and Resend alert arrived at `maintiflow.contact@gmail.com`.
- [x] Latest main CI green: https://github.com/ahmededdahby/maintiflow-landing/actions/runs/44062604967 .
- [ ] Verify actual live deployed commit in the Cloudflare Worker dashboard. GitHub tests alone do not confirm production version.

## 2. Privacy and legal review (owner and Moroccan advisor)
- [x] Owner states they operate as a **natural person**, without a registered company.
- [x] Owner states they received the relevant CNDP paperwork; reference/scope/transfer approval not independently verified.
- [ ] Keep CNDP registration/receipt, applicable foreign-transfer record, processing-country information and cloud processor terms in a **private** document folder, not the repo.
- [ ] **Operator reports final notice is published, but live page couldn't be fetched and GitHub footer still contains outdated identity wording:** reconcile the deployed page/source; replace the published footer sentence about identity "must be finalized" with the **real and accurately stated controller identity**, legal contact and applicable filing reference. Review final text against CNDP paperwork; never invent identifiers or copy private ID docs into this public repo.
- [ ] Confirm the actual Cloudflare D1 hosting locations, Resend processing and backup/retention implications fit the filed transfer/notification scope.
- [ ] Confirm `PRIVACY_REVIEW_COMPLETE=true` matches the real completed review; presence of the variable is **not** independent proof of compliance.
- [ ] Review privacy requests workflow (access, correction, deletion, opt-out) for `maintiflow.contact@gmail.com` and response ownership.

Official: https://www.cndp.ma/conformite-des-sites-web/ and https://www.cndp.ma/transfert-de-donnees-a-letranger/ .

## 3. Binding safety — MUST fix before next Wrangler deploy
- [x] Operator confirmed the existing **maintiflow-leads** D1 UUID is `f91ca6da-6154-459a-803f-e575f4b6ed91` (operator confirmation, not independently inspected).
- [x] Added top-level `d1_databases` entry for binding `DB` / existing `maintiflow-leads` on this feature branch; Wrangler deploy dry-run passed.
- [ ] In Cloudflare Worker → Bindings confirm `DB` points to the original database; do **not** create a replacement.
- [ ] Save a backup/export of D1 before migrations; protect the export as personal data.
- [ ] After the next safe deploy, check `/api/config` returns `registrationEnabled:true`, and submit a distinct **test** lead.

Official: https://developers.cloudflare.com/workers/wrangler/configuration/ .

## 3a. Secrets hygiene — SECURITY BLOCKER (observed in Cloudflare dashboard)
- [ ] Convert **RESEND_API_KEY** and **TURNSTILE_SECRET_KEY** from plaintext Worker **Variable** type to encrypted **Secret** bindings. The 17 Nov settings screenshot shows both currently typed `Variable`, with partially visible values. Never copy any full value into a public issue or Git repository.
- [ ] Rotate the old Resend API credential and Turnstile secret using the provider dashboards; apply valid replacement Secrets and deploy safely, then revoke superseded credentials. Prefer making the replacement/rotation in a maintenance window to avoid unnecessary signup interruption.
- [ ] Retest a new Turnstile-protected signup → same D1 database → Gmail alert after rotation. `TURNSTILE_SITE_KEY`, `CONTACT_EMAIL`, `RESEND_FROM` and `PRIVACY_REVIEW_COMPLETE` may remain ordinary text Variables.

Official: https://developers.cloudflare.com/workers/configuration/secrets/ .

## 4. Abuse prevention
- [x] Operator confirmed a real Turnstile-success signup. Source enforces token verification and hostname checks when secret is set.
- [ ] Configure/merge this branch's Cloudflare Workers Rate Limiting binding after D1 config safety check; it enforces 10 POST attempts per 60s per client IP **per Cloudflare location**. Local counters are approximate and can race; keep Turnstile.
- [ ] Confirm the **production** Cloudflare Turnstile widget is linked to `maintiflow-landing.ahdahby.workers.dev`, and test expired/invalid token behavior.
- [ ] Confirm 429/Retry-After throttle on controlled invalid test requests **without creating 10 fake leads**; then monitor Worker logs.
- [ ] Monitor suspicious spikes, 429, 400 and 500 responses using Cloudflare Workers Logs; avoid logging PII and credentials.

Official: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ .

## 5. Retention and lead hygiene
- [x] Source has a daily 03:17 UTC scheduled handler deleting `early_access` leads older than 180 days.
- [x] Operator confirmed the production Worker shows one trigger with cron `17 3 * * *` (daily 03:17 UTC).
- [x] Operator confirms Cloudflare Worker Observability / Workers Logs was enabled on 17 Nov 2026.
- [ ] Inspect Cron Events or Workers Logs for a **successful** scheduled invocation; enabling logs alone does not prove cleanup execution. Cloudflare dashboard: Worker → Settings → Trigger Events → View events (past cron), or Worker → Observability → Logs (new event records).
- [ ] Run read-only D1 SQL: `SELECT COUNT(*) AS expired_count FROM early_access WHERE datetime(created_at) < datetime('now','-180 days');`. With new data, 0 is expected but is **not** proof the scheduler ran.
- [ ] Identify and remove only confirmed test registrations by verified exact email / ID; avoid blanket DELETEs.
- [ ] Confirm scope of D1 Time Travel and provider backups; a SQL DELETE does not instantly purge backup history.
- [ ] Verify transactional email bounce handling; alerts are best effort and D1 remains the source of truth.

Official: https://developers.cloudflare.com/d1/reference/time-travel/ .

## 6. Controlled go/no-go
**Go for modest validation traffic** only when the above critical privacy/binding/throttle checks are done. Use the LinkedIn Company Page and direct responses to people who already opted in. Five outreach emails were previously sent after the operator stated all five recipients had agreed to receive them; avoid expanding the campaign without permission records.

Targets (not promises): 5 new genuine opt-ins excluding tests; 2 discovery conversations; 1 paid pilot discussion. Don't claim finished product, customers or guaranteed ROI.

## Rollback
- If D1 binding disappears, do **not** create a new DB; restore the existing binding to `maintiflow-leads`.
- If new rate limit accidentally blocks valid signups, check trusted CF-Connecting-IP header and binding configuration; revert the deployment to the last known good version, preserving D1.
- If data protection or abuse issues arise, set `PRIVACY_REVIEW_COMPLETE` to another value or remove it and save/deploy to pause signup while keeping static pages alive.
