interface Env {
  DB?: D1Database;
  CONTACT_EMAIL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

type LeadPayload = {
  fullName?: unknown;
  email?: unknown;
  company?: unknown;
  city?: unknown;
  teamSize?: unknown;
  challenge?: unknown;
  consent?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

const validSizes = new Set(['1-5', '6-20', '21-50', '51+']);
const validChallenges = new Set(['planning', 'contracts', 'reports', 'billing', 'other']);
const isText = (value: unknown, min: number, max: number): value is string =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;


type BackgroundContext = { waitUntil(promise: Promise<unknown>): void };

// Intentionally send no personally identifiable lead details to the email provider.
async function sendLeadNotification(env: Env, leadId: string): Promise<void> {
  if (!env.RESEND_API_KEY?.trim() || !env.RESEND_FROM?.trim() || !env.CONTACT_EMAIL?.trim()) return;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'maintiflow-lead-' + leadId,
      },
      body: JSON.stringify({
        from: env.RESEND_FROM.trim(),
        to: [env.CONTACT_EMAIL.trim()],
        subject: 'MaintiFlow : nouvelle demande d’accès pilote',
        text: 'Nouvelle inscription dans Cloudflare D1. Référence : ' + leadId +
          '. Consultez la table early_access pour les coordonnées.',
      }),
    });
    if (!response.ok) console.error('Lead notification provider error', response.status);
  } catch {
    console.error('Lead notification request failed');
  }
}

async function verifyTurnstile(request: Request, secret: string, token: unknown): Promise<boolean> {
  if (typeof token !== 'string' || token.trim().length === 0 || token.length > 2048) return false;
  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token.trim() }),
    });
    if (!result.ok) return false;
    const checked = await result.json() as { success?: boolean; hostname?: string };
    return checked.success === true && checked.hostname === new URL(request.url).hostname;
  } catch {
    return false;
  }
}

export async function handleEarlyAccess(request: Request, env: Env, context?: BackgroundContext): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ ok: false, message: 'Origine non autorisée.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ ok: false, message: 'Format non pris en charge.' }, { status: 415 });
  }
  if (Number(request.headers.get('content-length') || 0) > 4096) {
    return Response.json({ ok: false, message: 'Requête trop longue.' }, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > 4096) {
    return Response.json({ ok: false, message: 'Requête trop longue.' }, { status: 413 });
  }

  let payload: LeadPayload;
  try {
    payload = JSON.parse(raw) as LeadPayload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw Error('Invalid payload');
  } catch {
    return Response.json({ ok: false, message: 'Données invalides.' }, { status: 400 });
  }

  // Honeypot: do not disclose rejection to automated form fillers.
  if (payload.website) return Response.json({ ok: true });

  const { fullName, email, company, city, teamSize, challenge, consent, turnstileToken } = payload;
  if (
    !isText(fullName, 2, 90) ||
    !isText(company, 2, 120) ||
    !isText(email, 5, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    !isText(city, 2, 80) ||
    typeof teamSize !== 'string' || !validSizes.has(teamSize) ||
    typeof challenge !== 'string' || !validChallenges.has(challenge) ||
    consent !== true
  ) {
    return Response.json({ ok: false, message: 'Veuillez vérifier les champs et le consentement.' }, { status: 400 });
  }

  const hasSiteKey = Boolean(env.TURNSTILE_SITE_KEY?.trim());
  const hasSecretKey = Boolean(env.TURNSTILE_SECRET_KEY?.trim());
  if (!env.DB || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((env.CONTACT_EMAIL ?? '').trim()) || hasSiteKey !== hasSecretKey) {
    // Critical: never claim a lead was stored when the D1 binding is absent.
    return Response.json({ ok: false, message: 'Les inscriptions ne sont pas encore disponibles. Réessayez plus tard.' }, { status: 503 });
  }

  if (hasSecretKey && !(await verifyTurnstile(request, env.TURNSTILE_SECRET_KEY!.trim(), turnstileToken))) {
    return Response.json({ ok: false, message: 'La vérification de sécurité a échoué.' }, { status: 400 });
  }
  const leadId = crypto.randomUUID();
  try {
    await env.DB.prepare(`
      INSERT INTO early_access (id, full_name, email, company, city, team_size, challenge, consent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      leadId,
      fullName.trim(),
      email.trim().toLowerCase(),
      company.trim(),
      city.trim(),
      teamSize,
      challenge,
      new Date().toISOString(),
    ).run();
    if (context?.waitUntil && env.RESEND_API_KEY && env.RESEND_FROM) {
      context.waitUntil(sendLeadNotification(env, leadId));
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    // A duplicate email is treated as a successful registration (no address enumeration).
    if (error instanceof Error && /UNIQUE constraint failed/i.test(error.message)) {
      return Response.json({ ok: true });
    }
    console.error('Lead registration failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ ok: false, message: 'Une erreur technique est survenue. Veuillez réessayer.' }, { status: 500 });
  }
}

export const onRequestPost: PagesFunction<Env> = ({ request, env, waitUntil }) => handleEarlyAccess(request, env, { waitUntil });
