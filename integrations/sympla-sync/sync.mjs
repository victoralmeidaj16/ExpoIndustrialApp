import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const clean = value => typeof value === 'string' ? value.trim() : '';
export const hashQr = value => createHash('sha256').update(value).digest('hex');

export function normalize(p, eventId) {
  const email = clean(p.email).toLowerCase();
  if (!email || !/^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/.test(email)) return null;
  const order = clean(p.order_status).toLowerCase();
  const ticket = clean(p.ticket_status).toLowerCase();
  const revoked = ['c', 'cancelled', 'canceled', 'r', 'refunded', 'declined'];
  const status = revoked.includes(order) || revoked.includes(ticket) ? 'cancelled'
    : ['a', 'approved', 'paid'].includes(order)
      && (!ticket || ['a', 'approved', 'paid'].includes(ticket)) ? 'paid' : 'pending';
  const field = name => clean((p.custom_form ?? []).find(f => clean(f.name).toLowerCase() === name)?.value);
  const qr = clean(p.ticket_num_qr_code);
  return {
    status, orderStatus: order, userEmailLower: email,
    fullName: [clean(p.first_name), clean(p.last_name)].filter(Boolean).join(' '),
    ticketNumber: clean(p.ticket_number), ticketQrCode: qr,
    ticketQrHash: qr ? hashQr(qr) : '', ticketName: clean(p.ticket_name),
    source: 'sympla', symplaEventId: eventId, symplaParticipantId: p.id,
    orderId: p.order_id ?? '', phone: field('whatsapp'), company: field('empresa'),
    role: field('cargo'), cityState: field('cidade/estado'),
  };
}

// Reads the complete snapshot before writing; failure never imports a partial page.
export async function fetchParticipants({ apiKey, eventHash, fetchImpl = fetch }) {
  const participants = [], cursors = new Set();
  let cursor = '';
  do {
    const url = new URL(`https://api.sympla.com.br/public/v1.6.0/events/${eventHash}/participants`);
    for (const [k, v] of Object.entries({ page_size: '500', cancelled_filter: 'include', field_sort: 'ticket_updated_at', sort: 'asc', timezone: 'America/Sao_Paulo' })) url.searchParams.set(k, v);
    if (cursor) url.searchParams.set('cursor', cursor);
    const response = await fetchImpl(url, { headers: { s_token: apiKey, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
    if (response.status === 204) break;
    if (!response.ok) throw new Error(`Sympla HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.data)) throw new Error('Invalid Sympla response');
    participants.push(...payload.data);
    cursor = payload.pagination?.next_cursor || '';
    if (cursor && cursors.has(cursor)) throw new Error('Repeated Sympla cursor');
    cursors.add(cursor);
    if (cursors.size > 1000) throw new Error('Pagination limit exceeded');
  } while (cursor);
  return participants;
}

export function buildDesired(rows, eventId) {
  const attendees = new Map(), desired = new Map();
  // Ascending update order: prefer an approved ticket over cancelled siblings
  // when the same participant email owns more than one ticket.
  for (const p of rows) {
    const data = normalize(p, eventId);
    if (!data) continue;
    if (data.symplaParticipantId == null) throw new Error('Missing participant id');
    const prior = attendees.get(data.userEmailLower);
    if (!prior || data.status === 'paid' || prior.status !== 'paid') attendees.set(data.userEmailLower, data);
    if (data.ticketQrHash && data.status === 'paid') {
      const path = `ticketQrLookups/${data.ticketQrHash}`;
      const previous = desired.get(path);
      if (previous && previous.userEmailLower !== data.userEmailLower) throw new Error('Conflicting QR ownership');
      desired.set(path, {
        eventId: `sympla-${eventId}`, ticketQrHash: data.ticketQrHash,
        userEmailLower: data.userEmailLower, source: 'sympla',
        profile: { name: data.fullName, company: data.company, role: data.role, email: data.userEmailLower, phone: data.phone },
      });
    }
  }
  for (const [email, data] of attendees) desired.set(`paidEvents/sympla-${eventId}/attendees/${email}`, data);
  return desired;
}

export function hasChanges(existing, expected) {
  return !existing || Object.entries(expected).some(([key, value]) => !isDeepStrictEqual(existing[key], value));
}

export async function synchronize(db, rows, eventId, dryRun) {
  const desired = buildDesired(rows, eventId);
  const attendeePath = `paidEvents/sympla-${eventId}/attendees/`;
  // Protect app-owned uid/ownerUid fields. Remove only stale QR indexes belonging
  // to participants actually returned in this snapshot, not unrelated records.
  const [attendees, lookups] = await Promise.all([
    db.collection(`paidEvents/sympla-${eventId}/attendees`).get(),
    db.collection('ticketQrLookups').where('eventId', '==', `sympla-${eventId}`).get(),
  ]);
  const existing = new Map([...attendees.docs, ...lookups.docs].map(s => [s.ref.path, s]));
  const writes = [];
  for (const [path, data] of desired) {
    const snap = existing.get(path), old = snap?.data();
    if (old?.source && old.source !== 'sympla') throw new Error('Destination belongs to another integration');
    if (old?.userEmailLower && old.userEmailLower !== data.userEmailLower) throw new Error('Destination email mismatch');
    if (hasChanges(old, data)) writes.push({ path, data: { ...data, [path.startsWith(attendeePath) ? 'syncedAt' : 'updatedAt']: Date.now() }, snap });
  }
  for (const snap of lookups.docs) {
    const old = snap.data();
    if (old.source === 'sympla' && desired.has(attendeePath + old.userEmailLower) && !desired.has(snap.ref.path)) writes.push({ path: snap.ref.path, snap, remove: true });
  }
  if (!dryRun) {
    for (let i = 0; i < writes.length; i += 400) {
      const batch = db.batch();
      for (const w of writes.slice(i, i + 400)) {
        const ref = db.doc(w.path);
        if (w.remove) batch.delete(ref, { lastUpdateTime: w.snap.updateTime });
        else if (w.snap) batch.update(ref, w.data, { lastUpdateTime: w.snap.updateTime });
        else batch.create(ref, w.data);
      }
      await batch.commit();
    }
  }
  return { read: rows.length, attendees: [...desired.keys()].filter(k => k.startsWith(attendeePath)).length, writes: writes.length, removedQr: writes.filter(w => w.remove).length, dryRun };
}
