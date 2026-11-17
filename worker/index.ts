import { handleEarlyAccess } from '../functions/api/early-access';

type Env = {
  ASSETS: Fetcher;
  DB?: D1Database;
  CONTACT_EMAIL?: string;
  PRIVACY_REVIEW_COMPLETE?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
};

const emailIsValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/api/config') {
      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
      }
      const configuredEmail = (env.CONTACT_EMAIL ?? '').trim();
      const contactEmail = emailIsValid(configuredEmail) ? configuredEmail : '';
      const hasSiteKey = Boolean(env.TURNSTILE_SITE_KEY?.trim());
      const hasSecretKey = Boolean(env.TURNSTILE_SECRET_KEY?.trim());
      return Response.json({
        contactEmail,
        registrationEnabled: Boolean(contactEmail && env.DB && hasSiteKey === hasSecretKey && env.PRIVACY_REVIEW_COMPLETE === 'true'),
        turnstileSiteKey: hasSiteKey && hasSecretKey ? env.TURNSTILE_SITE_KEY!.trim() : '',
      }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (pathname === '/api/early-access') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      }
      return handleEarlyAccess(request, env, context);
    }
    if (pathname.startsWith('/api/')) {
      return Response.json({ ok: false, message: 'Endpoint inconnu.' }, { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    if (!env.DB) {
      console.error('Lead retention cleanup skipped: DB binding missing');
      return;
    }
    await env.DB.prepare("DELETE FROM early_access WHERE datetime(created_at) < datetime('now', '-180 days')").run();
  },
} satisfies ExportedHandler<Env>;
