'use client';

import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  EXHIBITORS_COLLECTION,
  exhibitorConverter,
  type BoothCategory,
  type Exhibitor,
  type ExhibitorStatus,
} from '@/domain/exhibitor';
import { type VenuePoint } from '@/domain/venue';
import { db } from '@/lib/firebase';

export function useExhibitors() {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(Boolean(db));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) return;
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
  claimEmail?: string;
};

/** Atualiza os campos do organizador (posição/estande/área/categoria/score). */
export async function updateExhibitorPlacement(id: string, placement: ExhibitorPlacement) {
  if (!db) throw new Error('Firebase não configurado.');
  await updateDoc(doc(db, EXHIBITORS_COLLECTION, id), { ...placement });
}

export type ExhibitorCommercialUpdate = Pick<
  Exhibitor,
  | 'company'
  | 'industry'
  | 'about'
  | 'products'
  | 'contactName'
  | 'contactRole'
  | 'contactEmail'
  | 'contactPhone'
  | 'website'
  | 'instagram'
  | 'linkedin'
  | 'segments'
  | 'targetAudience'
  | 'lookingFor'
  | 'keywords'
>;

/** Corrige a ficha comercial como organizador, sem alterar posição ou vínculo. */
export async function updateExhibitorCommercialProfile(id: string, data: ExhibitorCommercialUpdate) {
  if (!db) throw new Error('Firebase não configurado.');
  await updateDoc(doc(db, EXHIBITORS_COLLECTION, id), data);
}

/** Moderação explícita: somente regras de admin permitem alterar este campo. */
export async function updateExhibitorStatus(id: string, status: ExhibitorStatus) {
  if (!db) throw new Error('Firebase não configurado.');
  await updateDoc(doc(db, EXHIBITORS_COLLECTION, id), { status });
}

/** Salva as correções revisadas e publica em uma única gravação. */
export async function publishExhibitor(id: string, data: ExhibitorCommercialUpdate) {
  if (!db) throw new Error('Firebase não configurado.');
  await updateDoc(doc(db, EXHIBITORS_COLLECTION, id), { ...data, status: 'published' });
}
