const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadVisitorProfileModule() {
  const exports = {};
  const source = ts.transpileModule(
    readFileSync('src/features/visitor/visitor-profile.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'firebase/firestore') return {
        deleteField: () => 'delete', doc: () => ({}), getDoc: async () => ({}),
        onSnapshot: () => () => {}, serverTimestamp: () => 0, writeBatch: () => ({}),
      };
      if (name === 'react') return { useEffect() {}, useState() {} };
      if (name === '@/lib/firebase') return { auth: null, db: null, isFirebaseConfigured: false };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return exports;
}

test('public visitor fields cannot populate private contacts', () => {
  const { visitorProfileFromData } = loadVisitorProfileModule();
  const profile = visitorProfileFromData({
    name: 'Ana', email: 'public@example.com', phone: 'public-phone', pushTokens: ['secret'],
  });
  assert.equal(profile.name, 'Ana');
  assert.equal(profile.email, '');
  assert.equal(profile.phone, '');
  assert.equal(profile.pushTokens, undefined);
});

test('private contact data is merged only when explicitly supplied', () => {
  const { visitorProfileFromData } = loadVisitorProfileModule();
  const profile = visitorProfileFromData(
    { name: 'Ana', discoverable: true },
    { email: 'private@example.com', phone: '47999999999' },
  );
  assert.equal(profile.email, 'private@example.com');
  assert.equal(profile.phone, '47999999999');
});

test('Firestore rules isolate private profiles, contact cards and non-listable badges', () => {
  const rules = readFileSync('firestore.rules', 'utf8');
  assert.match(rules, /match \/visitorPrivateProfiles\/\{id\}/);
  assert.match(rules, /match \/visitorContactCards\/\{id\}/);
  assert.match(rules, /match \/visitorBadgeLookups\/\{id\}/);
  assert.match(rules, /allow list: if false/);
  for (const field of ['email', 'phone', 'pushTokens', 'leadCapturedAt']) {
    assert.match(rules, new RegExp(`'${field}'`));
  }
});
