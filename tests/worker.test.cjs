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
function req(path, method = 'GET') {
  return new Request('https://maintiflow-landing.ahdahby.workers.dev' + path, { method, headers: { 'CF-Connecting-IP': '198.51.100.25' } });
}
test('API config denies signups until D1 and contact email configured', async () => {
  const unavailable = await worker.fetch(req('/api/config'), { ASSETS: assets });
  assert.deepEqual(await unavailable.json(), { contactEmail: '', registrationEnabled: false, turnstileSiteKey: '' });
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  const configured = await worker.fetch(req('/api/config'), { ASSETS: assets, DB: {}, SIGNUP_RATE_LIMIT: rateLimiter, CONTACT_EMAIL: ' contact@maintiflow.ma ', PRIVACY_REVIEW_COMPLETE: 'true' });
  assert.deepEqual(await configured.json(), { contactEmail: 'contact@maintiflow.ma', registrationEnabled: true, turnstileSiteKey: '' });
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
    contactEmail: 'maintiflow.contact@gmail.com', registrationEnabled: false, turnstileSiteKey: '',
  });
});
test('scheduled cleanup deletes only leads over 180 days old', async () => {
  const sql = [];
  await worker.scheduled({}, {
    DB: { prepare(query) { sql.push(query); return { run: async () => ({}) }; } },
  });
  assert.equal(sql.length, 1);
  assert.match(sql[0], /DELETE FROM early_access/);
  assert.match(sql[0], /-180 days/);
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
