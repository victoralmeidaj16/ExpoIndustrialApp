const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

for (const ticketCode of ['QR-INDIVIDUAL', '', 'QR-DE-ADMIN']) {
  test('QR compartilhável não emite sessão: ' + ticketCode, async () => {
    const exports = {};
    const source = ts.transpileModule(readFileSync('match-web/src/app/api/auth/sympla-ticket/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    vm.runInNewContext(source, { exports, Response, require() { throw Error('Não deve carregar Auth ou Firestore'); } });
    const response = await exports.POST(new Request('https://match365.vercel.app/api/auth/sympla-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'teste@example.com', ticketCode }) }));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).token, undefined);
  });
}
