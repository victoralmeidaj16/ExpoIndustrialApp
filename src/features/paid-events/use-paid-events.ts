import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  normalizeAccessEmail,
  OFFICIAL_PAID_EVENTS,
  PAID_EVENTS_COLLECTION,
  isOfficialPaidEventId,
  type PaidEvent,
  type PaidEventAccess,
  type PaidEventMaterial,
} from '@/features/paid-events/paid-event';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export type PaidEventWithAccess = PaidEvent & {
  access: PaidEventAccess | null;
  materials: PaidEventMaterial[];
};

function paidEventFromDoc(id: string, data: Record<string, unknown>): PaidEvent {
  const official = OFFICIAL_PAID_EVENTS.find((event) => event.id === id);
  return {
    id,
    title: official?.title ?? (data.title as string) ?? '',
    description: official?.description ?? (data.description as string) ?? '',
    dateLabel: official?.dateLabel ?? (data.dateLabel as string) ?? '',
    location: official?.location ?? (data.location as string) ?? '',
    higestorEventId: official?.higestorEventId ?? (data.higestorEventId as string) ?? '',
    paymentUrl: official?.paymentUrl ?? (data.paymentUrl as string) ?? '',
    order: official?.order ?? (typeof data.order === 'number' ? data.order : 0),
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
  };
}

function paidEventFromOfficial(event: (typeof OFFICIAL_PAID_EVENTS)[number]): PaidEvent {
  return {
    ...event,
    createdAt: 0,
  };
}

function accessFromData(data: Record<string, unknown>): PaidEventAccess {
  return {
    status: (data.status as PaidEventAccess['status']) ?? 'pending',
    userEmailLower: (data.userEmailLower as string) ?? '',
    fullName: (data.fullName as string) ?? '',
    cpfLast4: (data.cpfLast4 as string) ?? '',
    ticketNumber: (data.ticketNumber as string) ?? '',
    ticketQrCode: (data.ticketQrCode as string) ?? '',
    ticketQrHash: (data.ticketQrHash as string) ?? '',
    ticketName: (data.ticketName as string) ?? '',
    source: (data.source as PaidEventAccess['source']) ?? 'manual',
    syncedAt: typeof data.syncedAt === 'number' ? data.syncedAt : 0,
  };
}

function materialFromDoc(id: string, data: Record<string, unknown>): PaidEventMaterial {
  return {
    id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    fileUrl: (data.fileUrl as string) ?? '',
    fileName: (data.fileName as string) ?? '',
    contentType: (data.contentType as string) ?? '',
    order: typeof data.order === 'number' ? data.order : 0,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
  };
}

export function usePaidEvents(userEmail: string | null | undefined): {
  events: PaidEventWithAccess[];
  loading: boolean;
  error: Error | null;
} {
  const [events, setEvents] = useState<PaidEventWithAccess[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      return;
    }

    const firestore = db;
    const email = normalizeAccessEmail(userEmail);
    const ref = collection(firestore, PAID_EVENTS_COLLECTION);

    return onSnapshot(
      ref,
      async (snap) => {
        try {
          const eventsFromFirestore = snap.docs
            .filter((eventDoc) => isOfficialPaidEventId(eventDoc.id))
            .map((eventDoc) => paidEventFromDoc(eventDoc.id, eventDoc.data()))
          const existingIds = new Set(eventsFromFirestore.map((event) => event.id));
          const baseEvents = [
            ...eventsFromFirestore,
            ...OFFICIAL_PAID_EVENTS
              .filter((event) => !existingIds.has(event.id))
              .map(paidEventFromOfficial),
          ].sort((a, b) => a.order - b.order || b.createdAt - a.createdAt);

          const hydrated = await Promise.all(
            baseEvents.map(async (event) => {
              let access: PaidEventAccess | null = null;
              let materials: PaidEventMaterial[] = [];

              if (email) {
                const accessSnap = await getDoc(
                  doc(firestore, PAID_EVENTS_COLLECTION, event.id, 'attendees', email),
                );
                if (accessSnap.exists()) {
                  access = accessFromData(accessSnap.data());
                }
              }

              if (access?.status === 'paid') {
                const materialsSnap = await getDocs(
                  collection(firestore, PAID_EVENTS_COLLECTION, event.id, 'materials'),
                );
                materials = materialsSnap.docs
                  .map((materialDoc) => materialFromDoc(materialDoc.id, materialDoc.data()))
                  .sort((a, b) => a.order - b.order || b.createdAt - a.createdAt);
              }

              return { ...event, access, materials };
            }),
          );

          setEvents(hydrated);
          setLoading(false);
          setError(null);
        } catch (err) {
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, [userEmail]);

  return { events, loading, error };
}
