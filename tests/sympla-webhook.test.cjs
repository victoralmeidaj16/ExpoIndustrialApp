const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

// Campos que as Security Rules aceitam em `ticketQrLookups` (firestore.rules).
// Num merge o `request.resource.data` é o doc resultante, então qualquer campo a
// mais gravado pelo webhook bloquearia para sempre o publish feito pelo app.
const ALLOWED_LOOKUP_KEYS = [
  'uid', 'ownerUid', 'eventId', 'ticketQrHash', 'userEmailLower', 'source', 'profile', 'updatedAt',
];

const HASH = value => crypto.createHash('sha256').update(value).digest('hex');

function loadWebhook({ configuredSecret = 'test-secret', providedSecret = 'test-secret' } = {}) {
  const writes = [];
  const ref = path => ({
    path,
    collection: name => ref(`${path}/${name}`),
    doc: id => ref(`${path}/${id}`),
    set: async (data) => { writes.push({ path, data, op: 'set' }); },
    delete: async () => { writes.push({ path, op: 'delete' }); },
  });
  const source = ts.transpileModule(
    readFileSync('match-web/src/app/api/webhooks/sympla/route.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, URL,
    process: { env: configuredSecret ? { SYMPLA_WEBHOOK_SECRET: configuredSecret } : {} },
    console: { log: () => {}, error: () => {} },
    require(name) {
      if (name === 'next/server') {
        return { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } };
      }
      if (name === 'node:crypto') return crypto;
      if (name.endsWith('admin-firebase')) return { getAdminDb: () => ({ collection: n => ref(n) }) };
      throw new Error('Unexpected import: ' + name);
    },
  });
  const post = payload => exports.POST({
    url: 'https://match365.vercel.app/api/webhooks/sympla',
    headers: { get: name => name === 'x-webhook-secret' ? providedSecret : null },
    json: async () => payload,
  });
  return { post, writes, lookups: () => writes.filter(w => w.path.startsWith('ticketQrLookups/')) };
}

test('webhook fails closed without a configured secret', async () => {
  const api = loadWebhook({ configuredSecret: '', providedSecret: '' });
  const response = await api.post(payload);
  assert.equal(response.status, 503);
  assert.equal(api.writes.length, 0);
});

test('webhook rejects an invalid secret before touching Firestore', async () => {
  const api = loadWebhook({ providedSecret: 'wrong-secret' });
  const response = await api.post(payload);
  assert.equal(response.status, 401);
  assert.equal(api.writes.length, 0);
});

const payload = {
  event_id: 3486582, email: 'Ana@Example.com', first_name: 'Ana', last_name: 'Silva',
  ticket_num_qr_code: '001234', ticket_name: 'Visitação', order_status: 'A',
  custom_form: [
    { name: 'EMPRESA', value: 'Indústria' },
    { name: ' CARGO', value: 'Compradora' },
    { name: 'WHATSAPP', value: '47999999999' },
  ],
};

test('lookup carries the badge profile so a Sympla-only attendee can be scanned', async () => {
  const api = loadWebhook();
  const response = await api.post(payload);
  assert.equal(response.status, 200);

  const lookups = api.lookups();
  assert.equal(lookups.length, 1);
  assert.equal(lookups[0].path, `ticketQrLookups/${HASH('001234')}`);
  // Spread: o objeto nasce dentro do vm e não é reference-equal ao protótipo daqui.
  assert.deepEqual({ ...lookups[0].data.profile }, {
    name: 'Ana Silva', company: 'Indústria', role: 'Compradora',
    email: 'ana@example.com', phone: '47999999999',
  });
  // Trava a compatibilidade com as Security Rules.
  for (const key of Object.keys(lookups[0].data)) assert.ok(ALLOWED_LOOKUP_KEYS.includes(key), key);
});

test('a payload with no QR code writes no lookup instead of colliding on sha256("")', async () => {
  for (const ticket of [undefined, '', '   ']) {
    const api = loadWebhook();
    await api.post({ ...payload, ticket_num_qr_code: ticket, ticket_number: ticket });
    assert.equal(api.lookups().length, 0);
    // O acesso do participante continua registrado; só o índice por QR é omitido.
    assert.equal(api.writes.length, 1);
  }
});

test('a cancelled order loses paid status and stops resolving at the badge scanner', async () => {
  for (const status of ['C', 'cancelled', 'canceled', 'R', 'refunded', 'declined']) {
    const api = loadWebhook();
    await api.post({ ...payload, order_status: status });
    assert.equal(api.writes[0].data.status, 'cancelled');
    assert.equal(api.lookups()[0].op, 'delete');
  }
});

test('only an explicitly approved order status enables real-time access', async () => {
  for (const order_status of ['A', 'approved', 'paid']) {
    const api = loadWebhook();
    await api.post({ ...payload, order_status });
    assert.equal(api.writes[0].data.status, 'paid');
    assert.equal(api.lookups()[0].op, 'set');
  }
});

test('an absent or unknown status stays pending and cannot resolve a QR', async () => {
  for (const order_status of [undefined, '', 'processing']) {
    const api = loadWebhook();
    await api.post({ ...payload, order_status });
    assert.equal(api.writes[0].data.status, 'pending');
    assert.equal(api.lookups()[0].op, 'delete');
  }
});
