
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('functions/api/early-access.ts', 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = {};
new Function('exports', 'crypto', 'Request', 'Response', 'console', output)(
  mod, globalThis.crypto, Request, Response, console,
);
const publicPrivacy = { PUBLIC_CONTROLLER_IDENTITY: 'Responsable légal de test, Rabat', PUBLIC_CNDP_DISCLOSURE: 'Référence CNDP de test (non réelle)', PUBLIC_TRANSFER_DISCLOSURE: 'Information de test sur les transferts internationaux' };
const lead = {fullName:'Tester',email:'test@example.ma',company:'Test Co',city:'Casablanca',teamSize:'1-5',challenge:'planning',consent:true,website:''};
function req(payload) { return new Request('https://maintiflow-landing.ahdahby.workers.dev/api/early-access',{method:'POST',headers:{'content-type':'application/json',origin:'https://maintiflow-landing.ahdahby.workers.dev'},body:JSON.stringify(payload)}); }
function db() {const inserts=[];return {inserts,prepare(){return {bind(...args){inserts.push(args);return {run:async()=>({})}}}}};}
test('new lead sends a PII-minimized asynchronous notification when configured', async () => {
  const pending=[], outbound=[], original=globalThis.fetch;
  globalThis.fetch=async (url,options)=>{outbound.push({url,options});return Response.json({id:'email-id'})};
  try {
    const DB=db();const response=await mod.handleEarlyAccess(req(lead),{
      DB,...publicPrivacy,CONTACT_EMAIL:'maintiflow.contact@gmail.com',PRIVACY_REVIEW_COMPLETE:'true',RESEND_API_KEY:'fake-key',RESEND_FROM:'MaintiFlow <onboarding@resend.dev>'
    },{waitUntil(p){pending.push(p)}});
    assert.equal(response.status,201);assert.equal(DB.inserts.length,1);assert.equal(pending.length,1);
    await Promise.all(pending);assert.equal(outbound.length,1);
    const sent=JSON.parse(outbound[0].options.body);
    assert.deepEqual(sent.to,['maintiflow.contact@gmail.com']);
    assert.doesNotMatch(JSON.stringify(sent),/test@example.ma|Test Co/);
    assert.match(outbound[0].options.headers['Idempotency-Key'],/^maintiflow-lead-/);
  } finally {globalThis.fetch=original}
});
test('Turnstile rejects missing tokens', async () => {
  const DB=db();
  const response=await mod.handleEarlyAccess(req(lead),{
    DB,...publicPrivacy,CONTACT_EMAIL:'maintiflow.contact@gmail.com',PRIVACY_REVIEW_COMPLETE:'true',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret'
  });
  assert.equal(response.status,400);assert.equal(DB.inserts.length,0);
});
test('Turnstile validates hostname on success', async () => {
  const DB=db(),original=globalThis.fetch;
  globalThis.fetch=async ()=>Response.json({success:true,hostname:'maintiflow-landing.ahdahby.workers.dev'});
  try {
    const response=await mod.handleEarlyAccess(req({...lead,turnstileToken:'valid-token'}),{
      DB,...publicPrivacy,CONTACT_EMAIL:'maintiflow.contact@gmail.com',PRIVACY_REVIEW_COMPLETE:'true',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret'
    });
    assert.equal(response.status,201);assert.equal(DB.inserts.length,1);
  } finally {globalThis.fetch=original}
});

test('lead API refuses personal-data collection when public legal disclosures are missing', async () => {
  const DB=db();
  const response=await mod.handleEarlyAccess(req(lead),{
    DB, CONTACT_EMAIL:'maintiflow.contact@gmail.com', PRIVACY_REVIEW_COMPLETE:'true',
  });
  assert.equal(response.status,503);
  assert.equal(DB.inserts.length,0);
});
