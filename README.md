# MaintiFlow — Existing Cloudflare Worker (React + API)

French-first validation landing page for a *proposed* maintenance-contract SaaS. Illustrative dashboard data; not a commercial product yet.

**Existing Worker:** `maintiflow-landing` · **URL:** https://maintiflow-landing.ahdahby.workers.dev/

## Architecture
- React 19 + TypeScript + Vite, served as Cloudflare Workers static assets.
- `worker/index.ts` serves `/api/config`, `/api/early-access`, and static assets via `ASSETS`.
- Cloudflare D1 stores consented early-access leads once configured. GitHub Actions validates the build and API.
- Signup is disabled until **both** a valid `CONTACT_EMAIL` and D1 binding `DB` are present. No false success responses.

## Deploy to your existing Worker
1. Cloudflare → **Workers & Pages** → **maintiflow-landing** → **Settings → Build**; verify connected GitHub repository/branch `main`.
2. Set Build command: `npm run build` and Deploy command: `npx wrangler deploy`.
3. Deploy the updated repository. `wrangler.jsonc` names the existing Worker, keeping the `workers.dev` address.
4. Visit `https://maintiflow-landing.ahdahby.workers.dev/api/config`. Until configured, it should return `{"contactEmail":"","registrationEnabled":false}`; if you see HTML, the Worker script hasn't deployed yet.

## Connect your existing D1 database (do not create another)
1. Cloudflare D1 → `maintiflow-leads` → copy its **database UUID**.
2. Add this **top-level** entry to `wrangler.jsonc` (use the real UUID):
   ```json
   "d1_databases": [
     {"binding": "DB", "database_name": "maintiflow-leads", "database_id": "<YOUR-REAL-D1-UUID>"}
   ]
   ```
   Then commit and deploy. You may initially add the binding via **Worker → Bindings**, but record it in Wrangler config for future deployments; Wrangler config is the source of truth.
3. Apply the SQL once if not already applied: `npx wrangler d1 execute maintiflow-leads --remote --file=migrations/0001_create_leads.sql`.
4. **Worker → Settings → Variables and Secrets** → add plaintext runtime variable `CONTACT_EMAIL` with an address you actually control (shown publicly in the privacy notice). `keep_vars: true` prevents deleting dashboard-managed vars on future Wrangler deploys. You do **not** need `VITE_CONTACT_EMAIL` anymore.
5. Revisit `/api/config`; it should show `registrationEnabled:true`, then submit a test lead and query D1:
   ```sql
   SELECT full_name, email, company, city, created_at FROM early_access ORDER BY created_at DESC LIMIT 10;
   ```

Local commands: `npm install`, `npm run dev` (static preview), `npm run check`, `npm run dev:worker`.

Before real customers: verify privacy identity, retention/deletion process, CNDP applicability, and abuse prevention. No automated lead notification exists yet.
