# MaintiFlow — launch readiness / release gates

Updated: 17 November 2026. MaintiFlow is in **market validation**, not a commercially available SaaS. This repo is public. Never commit prospective customer records, credentials, CNDP filing details or test-lead data.

## Current evidence
- PASS — GitHub CI build and automated tests (Actions run 43891198454).
- REPORTED/OBSERVED — signup reached Cloudflare D1 in a user-run test; email alert was received by the connected project Gmail account on 17 November 2026.
- UNVERIFIED — live Turnstile settings, Cloudflare rate limits, ongoing retention job, data-controller identity, CNDP declarations and applicable foreign-transfer steps.
- UNVERIFIED — production deployment cannot be independently checked with the connected GitHub tool alone.

## Blocking gates before public promotion
- [ ] Determine the real controller (natural person or registered organization); publish truthful identity and contact details.
- [ ] Obtain appropriate Moroccan privacy advice and complete any CNDP declaration/notification and transfer formalities **before collection/promotion as applicable**. Do not invent an approval or a registration number.
- [ ] Review processor terms and data location for Cloudflare D1, Resend and any analytics products. Do not add nonessential tracking without consent assessment.
- [ ] Check Turnstile production sitekey/secret, hostname allowlist and server-side token validation. Record the result without exposing keys.
- [ ] Add suitable Worker/API request rate-limiting and verify its effect; the hidden honeypot alone is not robust enough.
- [ ] Confirm that the Cloudflare D1 binding is preserved by the next Wrangler deployment. The actual D1 database UUID is intentionally absent from wrangler.jsonc; configure it only after retrieving the real ID.
- [ ] Verify deletion and 180-day scheduled cleanup by checking scheduled Worker runs and D1, including backups/retention policies.
- [ ] Verify one successful new lead, one duplicate, one blocked bot attempt, and notification delivery after any production deployment.
- [ ] Remove test leads in D1 after checking they belong to the tester.

## Acquisition rules
- Never send promotional cold email / unsolicited direct messages to people sourced from directories without an appropriate legal basis and opt-in.
- A publicly visible company address is not automatically permission for prospecting. Review Morocco Law 09-08 and CNDP direct-marketing guidance before outreach.
- Use organic, clearly identified public LinkedIn content, SEO, referral requests to existing relationships, and responses to inquiries submitted voluntarily through the form.
- The existing pilot-form consent is for processing/responding to that **specific pilot request**, not blanket newsletter consent or third-party marketing.
- Do not buy address lists; keep company research and prospect data in a private workspace, not this public repo.
- Never make up traction, clients, case studies, partners, savings or product availability.

## Launch KPIs and stage gates
**Validation target (not a forecast):** five qualified opt-in registrations, two in-depth discovery conversations, and one explicit paid-pilot offer discussion. Do not start full SaaS development until there is evidence of willingness to pay.

- Week 1 (17–23 Nov): close the privacy/security gates, finalize one truthful LinkedIn post, record a baseline of real and test leads separately.
- Week 2 (24–30 Nov): post twice with practical examples, seek opt-in feedback from relevant maintenance communities and existing professional contacts.
- Week 3 (1–7 Dec): offer five 20-minute discovery interviews only to people who opted in or requested contact.
- Week 4 (8–14 Dec): prepare a clickable concept for the most repeated painful workflow; propose a scoped paid pilot only after understanding the buyer's problem.

Review weekly: qualified opt-ins, meaningful replies, interview bookings, willingness-to-pay evidence, bounces/complaints (target zero), and privacy requests. Do not use email address count as customer traction.

## Sources
- CNDP website compliance guidance: https://www.cndp.ma/conformite-des-sites-web/
- CNDP direct-marketing leaflet: https://www.cndp.ma/wp-content/uploads/2025/07/fiche_CNDP_Prospection_RT_fr.pdf
- Moroccan Law 09-08: https://www.dgssi.gov.ma/sites/default/files/legislative/brochure/2023-07/loi%2009-08.pdf
- Cloudflare Turnstile implementation: https://developers.cloudflare.com/turnstile/get-started/

*This document is an operational checklist, not a legal opinion.*
