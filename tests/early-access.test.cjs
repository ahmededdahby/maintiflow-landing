const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync('functions/api/early-access.ts', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const moduleExports = {};
new Function('exports', 'crypto', 'Request', 'Response', 'console', outputText)(
  moduleExports, globalThis.crypto, Request, Response, console,
);
const { onRequestPost } = moduleExports;

const valid = {
  fullName: 'Youssef El Amrani', email: 'YOUSSEF@EXAMPLE.MA',
  company: 'Société Exemple', city: 'Casablanca', teamSize: '6-20',
  challenge: 'planning', consent: true, website: '',
};
function request(payload, headers = {}) {
  return new Request('https://maintiflow.example/api/early-access', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://maintiflow.example', ...headers },
    body: JSON.stringify(payload),
  });
}
function database(fn = async () => ({})) {
  const inserts = [];
  return {
    inserts,
    prepare(sql) {
      assert.match(sql, /INSERT INTO early_access/);
      return { bind(...args) { inserts.push(args); return { run: () => fn(args) }; } };
    },
  };
}

test('valid lead is inserted with normalized email and consent date', async () => {
  const DB = database();
  const response = await onRequestPost({ request: request(valid), env: { DB, CONTACT_EMAIL: 'contact@maintiflow.example' } });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(DB.inserts.length, 1);
  assert.equal(DB.inserts[0][2], 'youssef@example.ma');
  assert.match(DB.inserts[0][7], /^\d{4}-\d{2}-\d{2}T/);
});

test('invalid consent is rejected without database write', async () => {
  const DB = database();
  const response = await onRequestPost({ request: request({ ...valid, consent: false }), env: { DB, CONTACT_EMAIL: 'contact@maintiflow.example' } });
  assert.equal(response.status, 400);
  assert.equal(DB.inserts.length, 0);
});

test('foreign origin is rejected', async () => {
  const DB = database();
  const response = await onRequestPost({ request: request(valid, { origin: 'https://attacker.example' }), env: { DB, CONTACT_EMAIL: 'contact@maintiflow.example' } });
  assert.equal(response.status, 403);
  assert.equal(DB.inserts.length, 0);
});

test('honeypot submissions are ignored', async () => {
  const DB = database();
  const response = await onRequestPost({ request: request({ ...valid, website: 'spam.test' }), env: { DB, CONTACT_EMAIL: 'contact@maintiflow.example' } });
  assert.equal(response.status, 200);
  assert.equal(DB.inserts.length, 0);
});

test('missing D1 binding does not lie about registration success', async () => {
  const response = await onRequestPost({ request: request(valid), env: {} });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
});

test('duplicate email is idempotent', async () => {
  const DB = database(async () => { throw new Error('UNIQUE constraint failed: early_access.email'); });
  const response = await onRequestPost({ request: request(valid), env: { DB, CONTACT_EMAIL: 'contact@maintiflow.example' } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test('missing public privacy contact disables signup even with D1', async () => {
  const DB = database();
  const response = await onRequestPost({ request: request(valid), env: { DB } });
  assert.equal(response.status, 503);
  assert.equal(DB.inserts.length, 0);
});
