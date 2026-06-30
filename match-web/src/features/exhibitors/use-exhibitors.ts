'use client';

import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  EXHIBITORS_COLLECTION,
  exhibitorConverter,
  type BoothCategory,
  type Exhibitor,
} from '@/domain/exhibitor';
import { type VenuePoint } from '@/domain/venue';
import { db } from '@/lib/firebase';

export function useExhibitors() {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const ref = collection(db, EXHIBITORS_COLLECTION).withConverter(exhibitorConverter);
    return onSnapshot(
      ref,
      (snap) => {
        const docs = snap.docs
          .map((d) => d.data())
          .sort((a, b) => a.company.localeCompare(b.company, 'pt-BR'));
        setExhibitors(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, []);

  return { exhibitors, loading, error };
}

export type ExhibitorPlacement = {
  point?: VenuePoint;
  stand?: string;
  area?: string;
  category?: BoothCategory;
  fit?: number;
  logoUrl?: string;
};

/** Atualiza os campos do organizador (posição/estande/área/categoria/score). */
export async function updateExhibitorPlacement(id: string, placement: ExhibitorPlacement) {
  if (!db) throw new Error('Firebase não configurado.');
  await updateDoc(doc(db, EXHIBITORS_COLLECTION, id), { ...placement });
}
