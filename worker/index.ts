import { handleEarlyAccess } from '../functions/api/early-access';
type Env = { ASSETS: Fetcher; DB?: D1Database; CONTACT_EMAIL?: string };
const emailIsValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/api/config') {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
      const configuredEmail = (env.CONTACT_EMAIL ?? '').trim();
      const contactEmail = emailIsValid(configuredEmail) ? configuredEmail : '';
      return Response.json(
        { contactEmail, registrationEnabled: Boolean(contactEmail && env.DB) },
        { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
      );
    }
    if (pathname === '/api/early-access') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      return handleEarlyAccess(request, env);
    }
    if (pathname.startsWith('/api/')) return Response.json({ ok: false, message: 'Endpoint inconnu.' }, { status: 404 });
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
