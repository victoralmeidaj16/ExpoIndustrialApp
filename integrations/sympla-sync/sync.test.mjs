import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDesired, fetchParticipants, hasChanges, normalize, synchronize } from './sync.mjs';

const row = { id: 'test-1', email: ' ANA@example.com ', first_name: 'Ana', last_name: 'Teste', order_status: 'APPROVED', ticket_status: 'APPROVED', ticket_num_qr_code: 'qr-test', custom_form: [{ name: ' WHATSAPP ', value: '47999990000' }] };
test('imports approved tickets with profile data, never invents account identity', () => {
  const desired = buildDesired([row], '3486582');
  assert.equal(desired.size, 2);
  const a = desired.get('paidEvents/sympla-3486582/attendees/ana@example.com');
  assert.equal(a.status, 'paid');
  assert.equal(a.phone, '47999990000');
  assert.equal(a.uid, undefined);
});
test('cancelled ticket overrides approved order; pending cannot expose a QR', () => {
  for (const changes of [{ ticket_status: 'CANCELLED' }, { order_status: '' }]) {
    const desired = buildDesired([{ ...row, ...changes }], '3486582');
    assert.equal(desired.size, 1);
    assert.notEqual([...desired.values()][0].status, 'paid');
  }
});
test('another cancelled ticket does not revoke a valid ticket for the same email', () => {
  const desired = buildDesired([row, { ...row, id: 'cancelled', ticket_num_qr_code: 'other', order_status: 'CANCELLED' }], '3486582');
  assert.equal(desired.get('paidEvents/sympla-3486582/attendees/ana@example.com').status, 'paid');
  assert.equal(desired.size, 2);
});
test('unchanged imports ignore app-owned fields and synchronization timestamps', () => {
  const expected = normalize(row, '3486582');
  assert.equal(hasChanges({ ...expected, uid: 'existing-user', ownerUid: 'existing-user', syncedAt: 123 }, expected), false);
});
test('malformed or looping pagination aborts, API errors never include provider data', async () => {
  await assert.rejects(fetchParticipants({ apiKey: 'fake', eventHash: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ data: [row], pagination: { next_cursor: 'same' } }) }) }), /Repeated/);
  await assert.rejects(fetchParticipants({ apiKey: 'fake', eventHash: 'test', fetchImpl: async () => ({ ok: false, status: 401 }) }), /^Error: Sympla HTTP 401$/);
});
test('dry run never writes; repeat imports do not write unchanged data', async () => {
  const desired = buildDesired([row], '3486582');
  const snapshots = [...desired].map(([path, data]) => ({ ref: { path }, data: () => ({ ...data, ownerUid: 'preserved' }) }));
  const db = { collection: path => ({ get: async () => ({ docs: snapshots.filter(s => s.ref.path.startsWith(path + '/')) }), where: () => ({ get: async () => ({ docs: snapshots.filter(s => s.ref.path.startsWith('ticketQrLookups/')) }) }) }), batch: () => { throw new Error('Unexpected write'); } };
  assert.equal((await synchronize(db, [row], '3486582', false)).writes, 0);
  assert.equal((await synchronize(db, [{ ...row, first_name: 'Changed' }], '3486582', true)).writes, 2);
});
