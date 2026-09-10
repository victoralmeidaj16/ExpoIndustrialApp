const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

test('sync stores badge details per QR without requiring app accounts and skips empty QR indexes', async () => {
  const writes = [];
  const requestedUrls = [];
  const participant = {
    event_id: 3486582, order_id: 'order', order_status: 'A', ticket_number: 'ticket',
    ticket_name: 'Visitação', first_name: 'Ana', last_name: 'Silva', email: 'ana@example.com',
    custom_form: [{ name: 'EMPRESA', value: 'Indústria' }, { name: 'CARGO', value: 'Compradora' }],
  };
  const ref = path => ({ path, collection: name => ref(`${path}/${name}`), doc: id => ref(`${path}/${id}`) });
  const firestore = {
    collection: name => ref(name),
    batch: () => ({ set: (ref, data) => writes.push({ path: ref.path, data }), commit: async () => {} }),
  };
  const source = ts.transpileModule(readFileSync('scripts/sync-sympla-event-access.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  let complete;
  const finished = new Promise(resolve => { complete = resolve; });
  vm.runInNewContext(source, {
    exports: {}, URL,
    process: { env: { SYMPLA_API: 'fake-test-token', SYMPLA_EVENT_HASH: 'event-hash' }, exit: () => complete(new Error('sync failed')) },
    console: { log: message => { if (message.includes('concluída')) complete(); }, error: complete },
    fetch: async url => {
      requestedUrls.push(String(url));
      return { ok: true, json: async () => ({ data: [
        { ...participant, id: 1, ticket_num_qr_code: '001234' },
        { ...participant, id: 2, ticket_num_qr_code: '   ' },
      ], pagination: {} }) };
    },
    require(name) {
      if (name === 'firebase-admin/app') return { getApps: () => [{}] };
      if (name === 'firebase-admin/firestore') return { getFirestore: () => firestore };
      if (name === 'node:crypto') return crypto;
      throw new Error(name);
    },
  });
  const error = await finished;
  assert.equal(error, undefined);
  const lookups = writes.filter(write => write.path.startsWith('ticketQrLookups/'));
  assert.equal(lookups.length, 1);
  assert.equal(lookups[0].path, `ticketQrLookups/${crypto.createHash('sha256').update('001234').digest('hex')}`);
  assert.equal(lookups[0].data.profile.name, 'Ana Silva');
  assert.equal(lookups[0].data.profile.company, 'Indústria');
  assert.equal(lookups[0].data.profile.role, 'Compradora');
  assert.equal(lookups[0].data.uid, undefined);
  assert.equal(lookups[0].data.ticketQrCode, undefined);
  assert.match(requestedUrls[0], /\/public\/v1\.6\.0\/events\/event-hash\/participants/);
  assert.match(requestedUrls[0], /cancelled_filter=include/);
});
