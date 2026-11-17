const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('worker/index.ts', 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const moduleExports = {};
new Function('exports', 'require', 'Response', 'URL', outputText)(
  moduleExports, () => ({ handleEarlyAccess: () => Response.json({ ok: true }, { status: 201 }) }), Response, URL,
);
const worker = moduleExports.default;
const assets = { fetch: async () => new Response('site html', { status: 200 }) };
const rateLimiter = { limit: async ({ key }) => { assert.ok(key); return { success: true }; } };
const publicPrivacy = { PUBLIC_CONTROLLER_IDENTITY: 'Responsable légal de test, Rabat', PUBLIC_CNDP_DISCLOSURE: 'Référence CNDP de test (non réelle)', PUBLIC_TRANSFER_DISCLOSURE: 'Information de test sur les transferts internationaux' };
const emptyPrivacy = { privacyControllerIdentity: '', privacyCndpDisclosure: '', privacyTransferDisclosure: '' };
const expectedPrivacy = {
  privacyControllerIdentity: publicPrivacy.PUBLIC_CONTROLLER_IDENTITY,
  privacyCndpDisclosure: publicPrivacy.PUBLIC_CNDP_DISCLOSURE,
  privacyTransferDisclosure: publicPrivacy.PUBLIC_TRANSFER_DISCLOSURE,
};
function req(path, method = 'GET') {
  return new Request('https://maintiflow-landing.ahdahby.workers.dev' + path, { method, headers: { 'CF-Connecting-IP': '198.51.100.25' } });
}
test('API config denies signups until D1 and contact email configured', async () => {
  const unavailable = await worker.fetch(req('/api/config'), { ASSETS: assets });
  assert.deepEqual(await unavailable.json(), { contactEmail: '', registrationEnabled: false, turnstileSiteKey: '', ...emptyPrivacy });
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  const configured = await worker.fetch(req('/api/config'), { ASSETS: assets, DB: {}, SIGNUP_RATE_LIMIT: rateLimiter, CONTACT_EMAIL: ' contact@maintiflow.ma ', PRIVACY_REVIEW_COMPLETE: 'true', ...publicPrivacy });
  assert.deepEqual(await configured.json(), { contactEmail: 'contact@maintiflow.ma', registrationEnabled: true, turnstileSiteKey: '', ...expectedPrivacy });
});
test('API handles unknown routes and wrong methods', async () => {
  assert.equal((await worker.fetch(req('/api/missing'), { ASSETS: assets })).status, 404);
  assert.equal((await worker.fetch(req('/api/early-access'), { ASSETS: assets })).status, 405);
  assert.equal((await worker.fetch(req('/api/early-access', 'POST'), { ASSETS: assets, SIGNUP_RATE_LIMIT: rateLimiter })).status, 201);
});
test('non-API requests delegate to static assets', async () => {
  const res = await worker.fetch(req('/pricing'), { ASSETS: assets });
  assert.equal(await res.text(), 'site html');
});

test('half configured Turnstile blocks registration', async () => {
  const response = await worker.fetch(req('/api/config'), {
    ASSETS: assets, DB: {}, CONTACT_EMAIL: 'maintiflow.contact@gmail.com', TURNSTILE_SITE_KEY: 'site-key',
  });
  assert.deepEqual(await response.json(), {
    contactEmail: 'maintiflow.contact@gmail.com', registrationEnabled: false, turnstileSiteKey: '', ...emptyPrivacy,
  });
});
test('scheduled cleanup deletes only expired leads and logs aggregate count', async () => {
  const sql = [];
  const original = console.log, logs = [];
  console.log = (...parts) => logs.push(parts);
  try {
    await worker.scheduled({}, {
      DB: { prepare(query) { sql.push(query); return { run: async () => ({ meta: { changes: 3 } }) }; } },
    });
  } finally { console.log = original; }
  assert.equal(sql.length, 1);
  assert.match(sql[0], /DELETE FROM early_access/);
  assert.match(sql[0], /-180 days/);
  assert.equal(logs.length, 1);
  assert.equal(logs[0][0], 'Lead retention cleanup completed');
  assert.deepEqual(logs[0][1], { deletedRows: 3 });
});

test('privacy review flag must be expressly enabled before collecting new leads', async () => {
  const response = await worker.fetch(req('/api/config'), {
    ASSETS: assets, DB: {}, CONTACT_EMAIL: 'maintiflow.contact@gmail.com',
  });
  assert.equal((await response.json()).registrationEnabled, false);
});

test('signup returns 503 if rate limiter binding is absent and never calls handler', async () => {
  const res = await worker.fetch(req('/api/early-access', 'POST'), { ASSETS: assets, DB: {} });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).ok, false);
});

test('signup throttles excess requests with retry-after and without calling handler', async () => {
  const res = await worker.fetch(req('/api/early-access', 'POST'), {
    ASSETS: assets, SIGNUP_RATE_LIMIT: { limit: async ({ key }) => {
      assert.equal(key, '198.51.100.25'); return { success: false };
    } },
  });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '60');
  assert.equal((await res.json()).ok, false);
});

test('signup rejects missing trusted client IP rather than sharing a global counter', async () => {
  const res = await worker.fetch(
    new Request('https://maintiflow-landing.ahdahby.workers.dev/api/early-access', { method: 'POST' }),
    { ASSETS: assets, SIGNUP_RATE_LIMIT: rateLimiter },
  );
  assert.equal(res.status, 503);
});

test('signup returns 503 if rate limiter service fails', async () => {
  const res = await worker.fetch(req('/api/early-access', 'POST'), {
    ASSETS: assets, SIGNUP_RATE_LIMIT: { limit: async () => { throw Error('limiter unavailable') } },
  });
  assert.equal(res.status, 503);
});

test('API config remains disabled without rate-limit binding, even with DB and privacy approval', async () => {
  const response = await worker.fetch(req('/api/config'), {
    ASSETS: assets, DB: {}, CONTACT_EMAIL: 'maintiflow.contact@gmail.com',
    PRIVACY_REVIEW_COMPLETE: 'true',
  });
  assert.equal((await response.json()).registrationEnabled, false);
});

test('API config denies signup if legally required public disclosures are missing', async () => {
  const env = { ASSETS: assets, DB: {}, SIGNUP_RATE_LIMIT: rateLimiter, CONTACT_EMAIL: 'maintiflow.contact@gmail.com', PRIVACY_REVIEW_COMPLETE: 'true' };
  const res = await worker.fetch(req('/api/config'), env);
  assert.equal((await res.json()).registrationEnabled, false);
});

test('public disclosure variables are plain text and exposed only as validated text in config', async () => {
  const res = await worker.fetch(req('/api/config'), {
    ASSETS: assets, DB: {}, SIGNUP_RATE_LIMIT: rateLimiter,
    CONTACT_EMAIL: 'maintiflow.contact@gmail.com', PRIVACY_REVIEW_COMPLETE: 'true', ...publicPrivacy,
  });
  const config = await res.json();
  assert.equal(config.registrationEnabled, true);
  assert.equal(config.privacyControllerIdentity, publicPrivacy.PUBLIC_CONTROLLER_IDENTITY);
  assert.equal(config.privacyCndpDisclosure, publicPrivacy.PUBLIC_CNDP_DISCLOSURE);
  assert.equal(config.privacyTransferDisclosure, publicPrivacy.PUBLIC_TRANSFER_DISCLOSURE);
});
