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
function req(path, method = 'GET') {
  return new Request('https://maintiflow-landing.ahdahby.workers.dev' + path, { method });
}
test('API config denies signups until D1 and contact email configured', async () => {
  const unavailable = await worker.fetch(req('/api/config'), { ASSETS: assets });
  assert.deepEqual(await unavailable.json(), { contactEmail: '', registrationEnabled: false, turnstileSiteKey: '' });
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  const configured = await worker.fetch(req('/api/config'), { ASSETS: assets, DB: {}, CONTACT_EMAIL: ' contact@maintiflow.ma ', PRIVACY_REVIEW_COMPLETE: 'true' });
  assert.deepEqual(await configured.json(), { contactEmail: 'contact@maintiflow.ma', registrationEnabled: true, turnstileSiteKey: '' });
});
test('API handles unknown routes and wrong methods', async () => {
  assert.equal((await worker.fetch(req('/api/missing'), { ASSETS: assets })).status, 404);
  assert.equal((await worker.fetch(req('/api/early-access'), { ASSETS: assets })).status, 405);
  assert.equal((await worker.fetch(req('/api/early-access', 'POST'), { ASSETS: assets })).status, 201);
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
