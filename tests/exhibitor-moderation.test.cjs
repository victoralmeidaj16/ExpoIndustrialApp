const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const exportsObject = {};
const source = ts.transpileModule(
  readFileSync('match-web/src/features/exhibitors/moderation.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
vm.runInNewContext(source, { exports: exportsObject });

const complete = {
  company: 'Indústria Sul', logoUrl: 'https://example.com/logo.png', about: 'Soluções industriais',
  industry: 'Automação', contactEmail: 'contato@example.com', products: ['Robôs'], stand: '86',
};

test('publication requires every commercial checklist item', () => {
  assert.equal(exportsObject.isExhibitorReadyForPublication(complete), true);
  for (const field of ['company', 'logoUrl', 'about', 'industry', 'contactEmail', 'products', 'stand']) {
    const incomplete = { ...complete, [field]: field === 'products' ? [] : '' };
    assert.equal(exportsObject.isExhibitorReadyForPublication(incomplete), false, field);
  }
});

test('contact can be supplied by email, phone, or responsible person', () => {
  const withoutEmail = { ...complete, contactEmail: '', contactPhone: '47999999999' };
  assert.equal(exportsObject.isExhibitorReadyForPublication(withoutEmail), true);
  assert.equal(exportsObject.isExhibitorReadyForPublication({ ...withoutEmail, contactPhone: '', contactName: 'Ana' }), true);
});

test('list fields are trimmed, deduplicated, and accept commas, semicolons, or lines', () => {
  assert.deepEqual(
    [...exportsObject.splitList('Robótica, IoT; Robótica\nAutomação')],
    ['Robótica', 'IoT', 'Automação'],
  );
});
