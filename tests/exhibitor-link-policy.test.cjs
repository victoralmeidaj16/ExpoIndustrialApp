const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadPolicy() {
  const exports = {};
  const source = ts.transpileModule(
    readFileSync('match-web/src/lib/exhibitor-link-policy.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInNewContext(source, { exports });
  return exports;
}

const policy = loadPolicy();

function validInput(overrides = {}) {
  return {
    uid: 'user-1',
    email: 'responsavel@empresa.com',
    emailVerified: true,
    targetExhibitorId: '86',
    targetOwnerUid: '',
    claimEmail: 'Responsavel@Empresa.com ',
    contactEmail: '',
    ...overrides,
  };
}

function expectPolicyError(input, status, message) {
  assert.throws(
    () => policy.evaluateExhibitorLink(input),
    (error) => error.status === status && error.message.includes(message),
  );
}

test('authorizes only the verified email selected by the organizer and starts as draft', () => {
  const result = policy.evaluateExhibitorLink(validInput());
  assert.deepEqual({ ...result }, {
    alreadyLinked: false,
    normalizedEmail: 'responsavel@empresa.com',
    initialStatus: 'draft',
  });
});

test('rejects an account whose email is not verified', () => {
  expectPolicyError(validInput({ emailVerified: false }), 403, 'Confirme seu e-mail');
});

test('rejects a booth without an email authorization', () => {
  expectPolicyError(validInput({ claimEmail: '', contactEmail: '' }), 403, 'não possui um e-mail autorizado');
});

test('rejects a verified account with a different email', () => {
  expectPolicyError(validInput({ email: 'intruso@empresa.com' }), 403, 'não está autorizado');
});

test('accepts legacy booths whose authorization is still stored in contactEmail', () => {
  const result = policy.evaluateExhibitorLink(
    validInput({ claimEmail: '', contactEmail: 'responsavel@empresa.com' }),
  );
  assert.equal(result.initialStatus, 'draft');
});

test('rejects a booth already linked to another account', () => {
  expectPolicyError(validInput({ targetOwnerUid: 'user-2' }), 409, 'outra conta');
});

test('rejects an account that already owns another booth', () => {
  expectPolicyError(validInput({ existingOwnedExhibitorId: '42' }), 409, 'outro estande');
});

test('treats a repeated request from the same owner as idempotent', () => {
  const result = policy.evaluateExhibitorLink(
    validInput({ targetOwnerUid: 'user-1', emailVerified: false }),
  );
  assert.deepEqual({ ...result }, { alreadyLinked: true });
});
