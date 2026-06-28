/**
 * Hooks de leitura dos expositores.
 *
 * - Com Firebase configurado: assina o Firestore em tempo real (`onSnapshot`),
 *   trazendo apenas os expositores `published`.
 * - Sem Firebase (ou erro/coleção vazia): cai no SEED `BOOTHS` para o app
 *   continuar funcional durante o desenvolvimento.
 */
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db, isFirebaseConfigured } from '@/lib/firebase';
import { BOOTHS } from '@/features/venue/venue';

import { EXHIBITORS_COLLECTION, exhibitorConverter, type Exhibitor } from './exhibitor';

export type ExhibitorsSource = 'firestore' | 'seed';

export type UseExhibitorsResult = {
  exhibitors: Exhibitor[];
  loading: boolean;
  error: Error | null;
  /** De onde vieram os dados — útil para um aviso de "modo offline/seed". */
  source: ExhibitorsSource;
};

/** Seed normalizado para o tipo `Exhibitor` (tudo já publicado). */
const SEED: Exhibitor[] = BOOTHS.map((b) => ({ ...b, status: 'published' as const }));

export function useExhibitors(): UseExhibitorsResult {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>(SEED);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<ExhibitorsSource>(isFirebaseConfigured ? 'firestore' : 'seed');

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    // Apenas o filtro de igualdade (usa índice automático de campo único). A
    // ordenação por nome é feita no cliente para não exigir índice composto
    // `status + company` — a lista carrega inteira, então ordenar em JS é barato.
    const q = query(
      collection(db, EXHIBITORS_COLLECTION).withConverter(exhibitorConverter),
      where('status', '==', 'published'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => d.data())
          .sort((a, b) => a.company.localeCompare(b.company, 'pt-BR'));
        // Coleção ainda vazia → mantém o seed para não mostrar lista vazia.
        setExhibitors(docs.length ? docs : SEED);
        setSource(docs.length ? 'firestore' : 'seed');
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setExhibitors(SEED);
        setSource('seed');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { exhibitors, loading, error, source };
}

/** Busca um expositor pelo id na lista carregada. */
export function useExhibitor(id: string | undefined): {
  exhibitor: Exhibitor | undefined;
  loading: boolean;
} {
  const { exhibitors, loading } = useExhibitors();
  return { exhibitor: exhibitors.find((e) => e.id === id), loading };
}
