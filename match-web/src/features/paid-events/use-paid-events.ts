'use client';

import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';

import {
  EMPTY_PAID_EVENT_FORM,
  PAID_EVENTS_COLLECTION,
  paidEventFromDoc,
  type PaidEvent,
  type PaidEventFormData,
} from '@/domain/paid-event';
import { db } from '@/lib/firebase';

function validatePaymentUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Use um link iniciado por http:// ou https://.');
    }
    return url.toString();
  } catch {
    throw new Error('Informe um link de pagamento valido.');
  }
}

function normalizeForm(form: PaidEventFormData): PaidEventFormData {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    dateLabel: form.dateLabel.trim(),
    location: form.location.trim(),
    higestorEventId: form.higestorEventId.trim(),
    paymentUrl: validatePaymentUrl(form.paymentUrl),
    order: Number.isFinite(form.order) ? form.order : 0,
  };
}

export function toPaidEventForm(event?: PaidEvent | null): PaidEventFormData {
  if (!event) return EMPTY_PAID_EVENT_FORM;
  return {
    title: event.title,
    description: event.description,
    dateLabel: event.dateLabel,
    location: event.location,
    higestorEventId: event.higestorEventId,
    paymentUrl: event.paymentUrl,
    order: event.order,
  };
}

export function usePaidEvents() {
  const [events, setEvents] = useState<PaidEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, PAID_EVENTS_COLLECTION), orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((docSnap) => paidEventFromDoc(docSnap.id, docSnap.data()))
          .sort((a, b) => a.order - b.order || b.createdAt - a.createdAt);
        setEvents(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, []);

  return { events, loading, error };
}

export async function savePaidEvent(form: PaidEventFormData, id?: string): Promise<void> {
  if (!db) throw new Error('Firebase nao configurado.');

  const data = normalizeForm(form);
  if (!data.title) throw new Error('Informe o titulo do evento pago.');

  const now = Date.now();
  if (id) {
    await setDoc(
      doc(db, PAID_EVENTS_COLLECTION, id),
      {
        ...data,
        updatedAt: now,
      },
      { merge: true },
    );
    return;
  }

  await addDoc(collection(db, PAID_EVENTS_COLLECTION), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
}

export async function deletePaidEvent(id: string): Promise<void> {
  if (!db) throw new Error('Firebase nao configurado.');
  await deleteDoc(doc(db, PAID_EVENTS_COLLECTION, id));
}
