const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Transpile a project module and run it in a fresh context (no production access).
function loadModule(path, requireImpl = () => { throw new Error('no imports expected'); }) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, console, process: { env: {} }, require: requireImpl });
  return exports;
}

// Run the actual resolver with an in-memory Firestore boundary; no production access.
function resolver({ lookup, profile = null, failure = false, symplaEvent = null } = {}) {
  const reads = [];
  const exports = {};
  // Real module: the Sympla edition is configuration, so tests can change it.
  const paidEvent = loadModule('src/features/paid-events/paid-event.ts');
  if (symplaEvent) paidEvent.setSymplaEvent(symplaEvent);
  const source = ts.transpileModule(readFileSync('src/features/visitor/visitor-ticket-qr.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    exports, console,
    require(name) {
      if (name === 'firebase/firestore') return {
        doc: (_, collection, id) => ({ collection, id }),
        getDoc: async ref => {
          reads.push(ref);
          if (failure) throw new Error('offline');
          return { exists: () => Boolean(lookup), data: () => lookup };
        },
        setDoc: async () => {},
      };
      if (name === '@/lib/firebase') return { db: {}, auth: { currentUser: { uid: 'exhibitor', email: 'exhibitor@example.com' } } };
      // Real SHA-256 implementation, not a stub: the hash is part of what we assert.
      if (name === '@/lib/sha256') return loadModule('src/lib/sha256.ts');
      if (name.endsWith('paid-events/paid-event')) return paidEvent;
      if (name.endsWith('visitor-profile')) return {
        EMPTY_VISITOR_PROFILE: { name: '', role: '', company: '', email: '', phone: '', interests: [] },
        DEMO_VISITOR_PROFILE: { name: 'Demo' },
        getVisitorProfileByUid: async () => profile,
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { ...exports, reads, paidEvent };
}
const imported = {
  eventId: 'sympla-3486582', source: 'sympla',
  profile: { name: 'Ana Silva', company: 'Indústria', role: 'Compradora', email: 'ana@example.com', phone: '47999999999' },
};

test('Sympla attendee without an app account has badge details and no invented uid', async () => {
  const api = resolver({ lookup: imported });
  const result = await api.resolveVisitorQrCode('  000123456789  ');
  assert.equal(result.uid, null);
  assert.equal(result.profile.name, 'Ana Silva');
  assert.equal(result.profile.company, 'Indústria');
  assert.equal(result.profile.email, 'ana@example.com');
  assert.equal(api.reads[0].id, createHash('sha256').update('000123456789').digest('hex'));
});
test('linked attendee uses the accessible app profile', async () => {
  const api = resolver({ lookup: { ...imported, uid: 'visitor-1' }, profile: { name: 'Ana', interests: ['Automação'] } });
  const result = await api.resolveVisitorQrCode('qr');
  assert.equal(result.uid, 'visitor-1');
  assert.equal(result.profile.interests[0], 'Automação');
});
test('private or missing linked profile falls back to imported badge data', async () => {
  const result = await resolver({ lookup: { ...imported, uid: 'visitor-1' } }).resolveVisitorQrCode('qr');
  assert.equal(result.profile.name, 'Ana Silva');
});
test('unknown, incomplete, and other-event tickets are not resolved', async () => {
  for (const lookup of [null, { ...imported, eventId: 'another-event' }, { ...imported, profile: undefined }]) {
    assert.equal(await resolver({ lookup }).resolveVisitorQrCode('qr'), null);
  }
});
test('a webhook-indexed ticket with no profile still scans, identified by e-mail', async () => {
  const api = resolver({ lookup: { eventId: 'sympla-3486582', source: 'sympla', userEmailLower: 'joao@example.com' } });
  const result = await api.resolveVisitorQrCode('qr');
  assert.equal(result.uid, null);
  assert.equal(result.source, 'sympla-ticket');
  assert.equal(result.profile.email, 'joao@example.com');
  assert.equal(result.profile.name, '');
});
test('empty and oversized codes do not query Firestore', async () => {
  const api = resolver();
  assert.equal(await api.resolveVisitorQrCode('   '), null);
  assert.equal(await api.resolveVisitorQrCode('x'.repeat(4097)), null);
  assert.equal(api.reads.length, 0);
});
test('native badge links still resolve a visitor profile', async () => {
  const api = resolver({ profile: { name: 'Ana' } });
  const result = await api.resolveVisitorQrCode('expoindustrialsul://visitor/visitor-1');
  assert.equal(result.uid, 'visitor-1');
  assert.equal(result.source, 'visitor-link');
  assert.equal(api.reads.length, 0);
});
test('random capability badge exposes its contact snapshot without exposing the private profile', async () => {
  const lookup = {
    uid: 'visitor-1',
    ownerUid: 'visitor-1',
    profile: { name: 'Ana', email: 'ana@example.com', phone: '47999999999' },
  };
  const api = resolver({ lookup });
  const result = await api.resolveVisitorQrCode(`expoindustrialsul://badge/${'a'.repeat(20)}`);
  assert.equal(result.source, 'visitor-badge');
  assert.equal(result.uid, 'visitor-1');
  assert.equal(result.profile.email, 'ana@example.com');
  assert.equal(api.reads[0].collection, 'visitorBadgeLookups');
});
test('capability badge rejects forged ownership and short identifiers', async () => {
  const forged = resolver({ lookup: { uid: 'visitor-1', ownerUid: 'attacker', profile: { name: 'Ana' } } });
  assert.equal(await forged.resolveVisitorQrCode(`expoindustrialsul://badge/${'a'.repeat(20)}`), null);
  assert.equal(await forged.resolveVisitorQrCode('expoindustrialsul://badge/short'), null);
});
test('network failures are distinct from an unknown ticket', async () => {
  await assert.rejects(resolver({ failure: true }).resolveVisitorQrCode('qr'), /offline/);
});
test('legacy printed badges remain supported with validated field types', async () => {
  const api = resolver();
  const result = await api.resolveVisitorQrCode(JSON.stringify({ name: 'Ana', email: 'ana@example.com', role: 42 }));
  assert.equal(result.source, 'legacy-badge');
  assert.equal(result.profile.name, 'Ana');
  assert.equal(result.profile.role, '');
  assert.equal(await api.resolveVisitorQrCode('{broken'), null);
  assert.equal(await api.resolveVisitorQrCode('{"name": 42, "email":"ana@example.com"}'), null);
  assert.equal(api.reads.length, 0);
});

test('switching the Sympla edition retargets the app without a rebuild', async () => {
  const nextEdition = { id: '9900001', slug: 'expoindustrial-sul-2027' };

  // A ticket from the previous edition stops resolving once the config moves on.
  const stale = resolver({ lookup: imported, symplaEvent: nextEdition });
  assert.equal(await stale.resolveVisitorQrCode('000123456789'), null);

  const current = resolver({
    lookup: { ...imported, eventId: 'sympla-9900001' },
    symplaEvent: nextEdition,
  });
  const result = await current.resolveVisitorQrCode('000123456789');
  assert.equal(result.profile.name, 'Ana Silva');
  assert.equal(current.paidEvent.getSymplaPaidEventId(), 'sympla-9900001');
  assert.equal(
    current.paidEvent.getVisitationTicketUrl(),
    'https://www.sympla.com.br/evento/expoindustrial-sul-2027/9900001',
  );
});

test('an empty edition in event/config falls back to the build default', () => {
  const { paidEvent } = resolver({ symplaEvent: { id: '   ', slug: '' } });
  assert.equal(paidEvent.getSymplaPaidEventId(), 'sympla-3486582');
  assert.equal(paidEvent.getSymplaCheckoutUrl(), 'https://www.sympla.com.br/expoindustrial-sul-2026__3486582');
});
