# MaintiFlow — Landing page (validation-stage)

French-first responsive landing page for a **proposed** Moroccan maintenance-contract management SaaS. This project is a market-validation website, **not an already available SaaS**. UI/dashboard examples use fictitious data.

## Tech stack

- React 19 + TypeScript + Vite
- Lucide icons, custom responsive CSS
- Cloudflare Pages Functions + Cloudflare D1 for the early-access signup endpoint
- GitHub Actions CI (`npm run check`)

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The page will work immediately. **Signups intentionally remain disabled** until a legitimate privacy contact address is set and the backend is deployed.

## Configure the signup form (Cloudflare Pages)

1. **Create a GitHub repository** called `maintiflow-landing` under your account and push the files, or give ChatGPT the empty repository URL to upload these files using the GitHub connection.
2. Create a **Cloudflare Pages** project connected to the repository. Build command: `npm run build`; output directory: `dist`.
3. Create a Cloudflare D1 database named `maintiflow-leads` in the Cloudflare dashboard.
4. Run `migrations/0001_create_leads.sql` against the database. Example using Wrangler (after logging in):

   ```bash
   npx wrangler d1 execute maintiflow-leads --remote --file=migrations/0001_create_leads.sql
   ```

5. In **Cloudflare Pages > Settings > Bindings**, add D1 binding named exactly `DB` pointing at `maintiflow-leads`. Redeploy after configuring.
6. In **Cloudflare Pages > Settings > Environment Variables**, set `VITE_CONTACT_EMAIL` to a real professional contact address you control, then **rebuild and redeploy**. This is required before the form enables, because it is published in the privacy notice. Do not publish a personal email unless you are comfortable receiving privacy requests there.
7. Test registration with your own email, then check the D1 table `early_access`. Verify privacy text, data policy and organization identity against actual obligations before inviting real customers.

The frontend POSTs to `/api/early-access` on the **same origin**. Do not deploy solely as a static GitHub Pages site if you want functional signups: GitHub Pages cannot run the Pages Function or connect to D1.

## Security and operational notes

- Validates all fields server side; requires consent; same-origin check; honeypot input; request size limits; normalized email; unique address constraint.
- This is an **MVP**, not a complete anti-spam solution. Configure Cloudflare WAF/rate limiting and optionally Turnstile before substantial traffic.
- Do not claim submissions succeeded if D1 binding is missing; API returns 503.
- No automated notification emails are sent. Review registrations in D1 until notifications are separately implemented.
- Privacy obligations (including CNDP filings, applicable notices, retention and deletion process) must be assessed before production. Data is stored until you delete it; there is currently **no automated retention job**.
- The displayed prices are test hypotheses. Do not imply a finished product or validated demand.

## Useful commands

```bash
npm run dev         # Local design preview (backend not running)
npm run check       # Build + typecheck API
npm run preview     # Preview built static assets
```

## Before go-live checklist

- [ ] Connect a real professional privacy/support email in `VITE_CONTACT_EMAIL`.
- [ ] Create/bind D1 and apply migration.
- [ ] Validate business identity and legal/privacy notice with a qualified adviser.
- [ ] Test signup and duplicate requests; verify D1 writes.
- [ ] Configure abuse prevention and a deletion/retention process.
- [ ] Add a real domain and measure qualified registrations.
