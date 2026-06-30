'use client';

import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  SESSIONS_COLLECTION,
  sessionConverter,
  type Session,
} from '@/domain/session';
import { db } from '@/lib/firebase';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const ref = collection(db, SESSIONS_COLLECTION).withConverter(sessionConverter);
    return onSnapshot(
      ref,
      (snap) => {
        const docs = snap.docs
          .map((d) => d.data())
          .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
        setSessions(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, []);

  return { sessions, loading, error };
}

/** Cria (auto-id) ou atualiza (id existente) uma sessão. */
export async function upsertSession(id: string | null, data: Omit<Session, 'id'>) {
  if (!db) throw new Error('Firebase não configurado.');
  if (id) {
    await setDoc(doc(db, SESSIONS_COLLECTION, id), data, { merge: true });
    return id;
  }
  const created = await addDoc(collection(db, SESSIONS_COLLECTION), data);
  return created.id;
}

export async function deleteSession(id: string) {
  if (!db) throw new Error('Firebase não configurado.');
  await deleteDoc(doc(db, SESSIONS_COLLECTION, id));
}
