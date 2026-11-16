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
  assert.deepEqual(await unavailable.json(), { contactEmail: '', registrationEnabled: false });
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  const configured = await worker.fetch(req('/api/config'), { ASSETS: assets, DB: {}, CONTACT_EMAIL: ' contact@maintiflow.ma ' });
  assert.deepEqual(await configured.json(), { contactEmail: 'contact@maintiflow.ma', registrationEnabled: true });
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
