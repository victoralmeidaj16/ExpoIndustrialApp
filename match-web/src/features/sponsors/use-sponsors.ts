'use client';

import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  SPONSORS_COLLECTION,
  sortSponsors,
  sponsorConverter,
  type Sponsor,
} from '@/domain/sponsor';
import { db } from '@/lib/firebase';

export function useSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const ref = collection(db, SPONSORS_COLLECTION).withConverter(sponsorConverter);
    return onSnapshot(
      ref,
      (snap) => {
        setSponsors(sortSponsors(snap.docs.map((d) => d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, []);

  return { sponsors, loading, error };
}

export async function upsertSponsor(id: string | null, data: Omit<Sponsor, 'id'>) {
  if (!db) throw new Error('Firebase não configurado.');
  if (id) {
    await setDoc(doc(db, SPONSORS_COLLECTION, id), data, { merge: true });
    return id;
  }
  const created = await addDoc(collection(db, SPONSORS_COLLECTION), data);
  return created.id;
}

export async function deleteSponsor(id: string) {
  if (!db) throw new Error('Firebase não configurado.');
  await deleteDoc(doc(db, SPONSORS_COLLECTION, id));
}
