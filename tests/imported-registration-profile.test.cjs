const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadMerge() {
  const source = ts.transpileModule(
    readFileSync('src/features/visitor/imported-registration-profile.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'firebase/firestore') return {};
      if (name.includes('paid-events/paid-event')) {
        return { getSymplaPaidEventId: () => 'sympla-current', OFFICIAL_PAID_EVENTS: [] };
      }
      if (name.includes('/lib/firebase')) return { auth: null, db: null };
      throw new Error(name);
    },
  });
  return exports.mergeImportedRegistrations;
}

test('reaproveita Sympla e completa lacunas com R Gestor sem apagar dados', () => {
  const merge = loadMerge();
  const result = merge([
    {
      source: 'higestor',
      fullName: 'Nome do R Gestor',
      phone: '(47) 99999-0000',
      company: 'Indústria Exemplo',
      syncedAt: 20,
    },
    {
      source: 'sympla',
      fullName: 'Nome da Sympla',
      role: 'Gerente Industrial',
      phone: '',
      syncedAt: 10,
    },
  ]);

  assert.deepEqual(
    { ...result },
    {
      name: 'Nome da Sympla',
      phone: '(47) 99999-0000',
      company: 'Indústria Exemplo',
      role: 'Gerente Industrial',
      source: 'sympla',
    },
  );
});

test('valores vazios de uma inscricao nunca substituem valores aproveitaveis', () => {
  const merge = loadMerge();
  const result = merge([
    { source: 'higestor', fullName: 'Ana', phone: '47999990000', company: 'ACME', role: 'Diretora' },
    { source: 'sympla', fullName: '', phone: '', company: '', role: '' },
  ]);

  assert.equal(result.name, 'Ana');
  assert.equal(result.phone, '47999990000');
  assert.equal(result.company, 'ACME');
  assert.equal(result.role, 'Diretora');
});
