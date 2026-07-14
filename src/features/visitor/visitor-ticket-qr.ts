import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import {
  DEMO_VISITOR_PROFILE,
  EMPTY_VISITOR_PROFILE,
  getVisitorProfileByUid,
  type VisitorProfile,
} from '@/features/visitor/visitor-profile';

const TICKET_QR_LOOKUPS_COLLECTION = 'ticketQrLookups';
const SYMPLA_EVENT_ID = 'sympla-3486582';

type TicketQrLookup = {
  uid?: string;
  ownerUid?: string;
  eventId?: string;
  ticketQrHash?: string;
  userEmailLower?: string;
  source?: 'sympla';
  profile?: Partial<Pick<VisitorProfile, 'name' | 'role' | 'company' | 'email' | 'phone'>>;
};

export type ResolvedVisitorQr = {
  uid: string;
  profile: VisitorProfile;
  source: 'visitor-link' | 'sympla-ticket';
};

function normalizeQrPayload(value: string): string {
  return value.trim();
}

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function toUtf8Bytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i += 1) {
    let codePoint = value.charCodeAt(i);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < value.length) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00);
        i += 1;
      }
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

function sha256Hex(value: string): string {
  const bytes = toUtf8Bytes(value);
  const bitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 9 + 63) >> 6) << 6);
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const words = new Array<number>(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) words[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rightRotate(words[i - 15], 7) ^ rightRotate(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rightRotate(words[i - 2], 17) ^ rightRotate(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + constants[i] + words[i]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return hash.map((word) => word.toString(16).padStart(8, '0')).join('');
}

export function extractVisitorUidFromQrCode(data: string): string | null {
  const payload = normalizeQrPayload(data);
  if (payload.startsWith('expoindustrialsul://visitor/') || payload.startsWith('expoindustrial://visitor/')) {
    return payload.split('/').pop() || null;
  }
  if (payload.includes('/visitor/')) {
    return payload.split('/visitor/')[1]?.split('?')[0] || null;
  }
  return null;
}

function profileFromLookup(data: TicketQrLookup): VisitorProfile {
  return {
    ...EMPTY_VISITOR_PROFILE,
    name: data.profile?.name ?? '',
    role: data.profile?.role ?? '',
    company: data.profile?.company ?? '',
    email: data.profile?.email ?? data.userEmailLower ?? '',
    phone: data.profile?.phone ?? '',
  };
}

export async function publishSymplaTicketQrLookup(
  ticketQrCode: string,
  profile: VisitorProfile,
): Promise<void> {
  if (!db || !auth?.currentUser?.email) return;

  const ticketQrHash = sha256Hex(normalizeQrPayload(ticketQrCode));
  const uid = auth.currentUser.uid;
  const userEmailLower = auth.currentUser.email.trim().toLowerCase();

  await setDoc(
    doc(db, TICKET_QR_LOOKUPS_COLLECTION, ticketQrHash),
    {
      uid,
      ownerUid: uid,
      eventId: SYMPLA_EVENT_ID,
      ticketQrHash,
      userEmailLower,
      source: 'sympla',
      profile: {
        name: profile.name,
        role: profile.role,
        company: profile.company,
        email: profile.email || userEmailLower,
        phone: profile.phone ?? '',
      },
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

export async function resolveVisitorQrCode(data: string): Promise<ResolvedVisitorQr | null> {
  const visitorUid = extractVisitorUidFromQrCode(data);
  if (visitorUid) {
    let profile: VisitorProfile | null = null;
    try {
      profile = visitorUid === 'demo-user' ? DEMO_VISITOR_PROFILE : await getVisitorProfileByUid(visitorUid);
    } catch (err) {
      console.error('Erro ao resolver QR de visitante:', err);
    }
    return profile ? { uid: visitorUid, profile, source: 'visitor-link' } : null;
  }

  if (!db || !auth?.currentUser) return null;

  const ticketQrHash = sha256Hex(normalizeQrPayload(data));
  const snap = await getDoc(doc(db, TICKET_QR_LOOKUPS_COLLECTION, ticketQrHash));
  if (!snap.exists()) return null;

  const lookup = snap.data() as TicketQrLookup;
  if (!lookup.uid) return null;

  let profile: VisitorProfile | null = null;
  try {
    profile = await getVisitorProfileByUid(lookup.uid);
  } catch (err) {
    console.error('Erro ao ler perfil vinculado ao QR Sympla:', err);
  }
  return {
    uid: lookup.uid,
    profile: profile ?? profileFromLookup(lookup),
    source: 'sympla-ticket',
  };
}
