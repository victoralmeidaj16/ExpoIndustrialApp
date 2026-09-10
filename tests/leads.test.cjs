const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(path, requireImpl = () => { throw new Error('no imports expected'); }) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, console, require: requireImpl });
  return exports;
}

// Runs the real leads module against an in-memory Firestore boundary, recording
// every operation so we can assert the capture costs exactly one write.
function leadsModule({ uid = 'exhibitor-1' } = {}) {
  const ops = [];
  const api = loadModule('src/features/visitor/leads.ts', (name) => {
    if (name === 'firebase/firestore') return {
      collection: (_db, path) => ({ path }),
      doc: (_db, path, id) => ({ path, id }),
      addDoc: async (ref, data) => { ops.push({ op: 'addDoc', ref, data }); return { id: 'generated-id' }; },
      setDoc: async (ref, data, options) => { ops.push({ op: 'setDoc', ref, data, options }); },
      deleteDoc: async () => {},
      getDocs: async (q) => { ops.push({ op: 'getDocs', q }); return { docs: [] }; },
      onSnapshot: () => () => {},
      query: (...args) => ({ args }),
      where: (field, _op, value) => ({ field, value }),
    };
    if (name === '@/lib/firebase') return {
      isFirebaseConfigured: true,
      db: {},
      auth: { currentUser: { uid } },
    };
    if (name === '@/lib/sha256') return loadModule('src/lib/sha256.ts');
    if (name === 'react') return { useEffect: () => {}, useState: () => [] };
    if (name === '@react-native-async-storage/async-storage') return { default: { getItem: async () => null, setItem: async () => {} } };
    if (name === 'expo-file-system') return { File: class {}, Paths: {} };
    if (name === 'expo-sharing') return { isAvailableAsync: async () => false, shareAsync: async () => {} };
    throw new Error(`Unexpected import: ${name}`);
  });
  return { ...api, ops };
}

const expectedId = (uid, key) => `${uid}_${createHash('sha256').update(key).digest('hex')}`;

const ana = {
  name: 'Ana Silva', role: 'Compradora', company: 'Indústria',
  email: 'Ana@Example.com ', phone: '(47) 99999-9999', source: 'Estande: ACME',
};

test('capturing a badge costs a single write and never downloads the lead collection', async () => {
  const leads = leadsModule();
  const saved = await leads.addSavedLead(ana);

  assert.deepEqual(leads.ops.map((o) => o.op), ['setDoc']);
  assert.equal(leads.ops[0].options.merge, true);
  assert.equal(leads.ops[0].ref.path, 'leads');
  assert.equal(saved.ownerUid, 'exhibitor-1');
  assert.equal(typeof saved.createdAt, 'number');
});

test('the document id is derived from the email, so a re-scan overwrites instead of duplicating', async () => {
  const first = leadsModule();
  const a = await first.addSavedLead(ana);
  const second = leadsModule();
  // Same person, different casing/spacing and a stale company name.
  const b = await second.addSavedLead({ ...ana, company: 'Indústria S.A.', email: 'ana@example.com' });

  assert.equal(a.id, expectedId('exhibitor-1', 'email:ana@example.com'));
  assert.equal(b.id, a.id);
});

test('two exhibitors scanning the same visitor get separate leads', async () => {
  const mine = await leadsModule({ uid: 'exhibitor-1' }).addSavedLead(ana);
  const theirs = await leadsModule({ uid: 'exhibitor-2' }).addSavedLead(ana);

  assert.notEqual(mine.id, theirs.id);
  assert.equal(theirs.id, expectedId('exhibitor-2', 'email:ana@example.com'));
});

test('badges without an email fall back to phone, then to name plus company', async () => {
  const byPhone = await leadsModule().addSavedLead({ ...ana, email: '' });
  assert.equal(byPhone.id, expectedId('exhibitor-1', 'phone:47999999999'));

  const byName = await leadsModule().addSavedLead({ ...ana, email: '', phone: '' });
  assert.equal(byName.id, expectedId('exhibitor-1', 'name:ana silva|indústria'));
});

test('an unidentifiable badge still saves, with a generated id, rather than collapsing into one doc', async () => {
  const leads = leadsModule();
  const saved = await leads.addSavedLead({ ...ana, name: '', email: '', phone: '' });

  assert.deepEqual(leads.ops.map((o) => o.op), ['addDoc']);
  assert.equal(saved.id, 'generated-id');
});
