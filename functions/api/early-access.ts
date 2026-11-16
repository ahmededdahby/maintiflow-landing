interface Env {
  DB?: D1Database;
  CONTACT_EMAIL?: string;
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
};

const validSizes = new Set(['1-5', '6-20', '21-50', '51+']);
const validChallenges = new Set(['planning', 'contracts', 'reports', 'billing', 'other']);
const isText = (value: unknown, min: number, max: number): value is string =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

export async function handleEarlyAccess(request: Request, env: Env): Promise<Response> {
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

  const { fullName, email, company, city, teamSize, challenge, consent } = payload;
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

  if (!env.DB || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((env.CONTACT_EMAIL ?? '').trim())) {
    // Critical: never claim a lead was stored when the D1 binding is absent.
    return Response.json({ ok: false, message: 'Les inscriptions ne sont pas encore disponibles. Réessayez plus tard.' }, { status: 503 });
  }

  try {
    await env.DB.prepare(`
      INSERT INTO early_access (id, full_name, email, company, city, team_size, challenge, consent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      fullName.trim(),
      email.trim().toLowerCase(),
      company.trim(),
      city.trim(),
      teamSize,
      challenge,
      new Date().toISOString(),
    ).run();
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

export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleEarlyAccess(request, env);
