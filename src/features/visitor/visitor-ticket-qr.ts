import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { sha256Hex } from '@/lib/sha256';
import { getSymplaPaidEventId } from '@/features/paid-events/paid-event';
import {
  DEMO_VISITOR_PROFILE,
  EMPTY_VISITOR_PROFILE,
  getVisitorProfileByUid,
  VISITOR_PRIVATE_PROFILES_COLLECTION,
  type VisitorProfile,
} from '@/features/visitor/visitor-profile';

const TICKET_QR_LOOKUPS_COLLECTION = 'ticketQrLookups';
const VISITOR_BADGE_LOOKUPS_COLLECTION = 'visitorBadgeLookups';

type TicketQrLookup = {
  uid?: string;
  ownerUid?: string;
  eventId?: string;
  ticketQrHash?: string;
  userEmailLower?: string;
  source?: 'sympla';
  profile?: Partial<Pick<
    VisitorProfile,
    'name' | 'role' | 'company' | 'email' | 'phone' | 'area' | 'interests' | 'lookingFor'
  >>;
};

export type ResolvedVisitorQr = {
  uid: string | null;
  profile: VisitorProfile;
  source: 'visitor-badge' | 'visitor-link' | 'sympla-ticket' | 'legacy-badge';
};

function normalizeQrPayload(value: string): string {
  return value.trim();
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

function extractVisitorBadgeId(data: string): string | null {
  const payload = normalizeQrPayload(data);
  if (payload.startsWith('expoindustrialsul://badge/')) {
    return payload.split('/').pop() || null;
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
    area: data.profile?.area ?? '',
    interests: data.profile?.interests ?? [],
    lookingFor: data.profile?.lookingFor ?? '',
  };
}

/**
 * Publica um cartão de crachá atrás de um identificador aleatório e não
 * enumerável. Apresentar o QR fisicamente concede acesso somente a esse cartão,
 * sem abrir o documento privado do visitante.
 */
export async function publishVisitorBadgeLookup(profile: VisitorProfile): Promise<string | null> {
  if (!db || !auth?.currentUser) return null;
  const uid = auth.currentUser.uid;
  const privateRef = doc(db, VISITOR_PRIVATE_PROFILES_COLLECTION, uid);
  const privateSnap = await getDoc(privateRef);
  const savedLookupId = privateSnap.exists() ? privateSnap.data().badgeLookupId : '';
  const lookupId = typeof savedLookupId === 'string' && savedLookupId.length >= 16
    ? savedLookupId
    : doc(collection(db, VISITOR_BADGE_LOOKUPS_COLLECTION)).id;

  if (lookupId !== savedLookupId) {
    await setDoc(privateRef, { ownerUid: uid, badgeLookupId: lookupId }, { merge: true });
  }

  await setDoc(
    doc(db, VISITOR_BADGE_LOOKUPS_COLLECTION, lookupId),
    {
      uid,
      ownerUid: uid,
      profile: {
        name: profile.name,
        role: profile.role,
        company: profile.company,
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        area: profile.area,
        interests: profile.interests ?? [],
        lookingFor: profile.lookingFor ?? '',
      },
      updatedAt: Date.now(),
    },
    { merge: true },
  );

  return `expoindustrialsul://badge/${lookupId}`;
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
      eventId: getSymplaPaidEventId(),
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
  if (!data.trim() || data.length > 4096) return null;
  // Older printed badges carried the contact itself as JSON.
  if (data.trim().startsWith('{')) {
    try {
      const legacy = JSON.parse(data);
      if (typeof legacy.name !== 'string' || !legacy.name.trim()
          || typeof legacy.email !== 'string' || !legacy.email.trim()) return null;
      return {
        uid: null,
        source: 'legacy-badge',
        profile: profileFromLookup({ profile: {
          name: legacy.name.trim(), email: legacy.email.trim(),
          company: typeof legacy.company === 'string' ? legacy.company : '',
          role: typeof legacy.role === 'string' ? legacy.role : '',
          phone: typeof legacy.phone === 'string' ? legacy.phone : '',
        } }),
      };
    } catch { return null; }
  }
  const badgeLookupId = extractVisitorBadgeId(data);
  if (badgeLookupId) {
    if (!db || !auth?.currentUser || badgeLookupId.length < 16) return null;
    const snap = await getDoc(doc(db, VISITOR_BADGE_LOOKUPS_COLLECTION, badgeLookupId));
    if (!snap.exists()) return null;
    const lookup = snap.data() as TicketQrLookup;
    if (!lookup.uid || lookup.ownerUid !== lookup.uid || !lookup.profile?.name) return null;
    return {
      uid: lookup.uid,
      profile: profileFromLookup(lookup),
      source: 'visitor-badge',
    };
  }
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
  if (lookup.eventId !== getSymplaPaidEventId() || lookup.source !== 'sympla') return null;
  // Doc recém-criado pelo webhook traz só o e-mail: vale como crachá (o expositor
  // confirma nome/empresa no estande). Só descarta doc sem nada identificável.
  if (!lookup.uid && !lookup.profile?.name && !lookup.userEmailLower) return null;

  let profile: VisitorProfile | null = null;
  try {
    if (lookup.uid) profile = await getVisitorProfileByUid(lookup.uid);
  } catch (err) {
    console.error('Erro ao ler perfil vinculado ao QR Sympla:', err);
  }
  return {
    uid: lookup.uid ?? null,
    profile: profile ?? profileFromLookup(lookup),
    source: 'sympla-ticket',
  };
}
