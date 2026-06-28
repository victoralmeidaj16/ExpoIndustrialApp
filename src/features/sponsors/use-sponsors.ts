/**
 * Hook de leitura dos patrocinadores.
 *
 * - Com Firebase: assina a coleção `sponsors` em tempo real (`onSnapshot`) e
 *   ordena no cliente (tier + order) — evita índice composto no Firestore.
 * - Sem Firebase / erro / coleção vazia: cai no `SPONSOR_SEED`.
 */
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db, isFirebaseConfigured } from '@/lib/firebase';

import {
  SPONSORS_COLLECTION,
  SPONSOR_SEED,
  sortSponsors,
  sponsorConverter,
  type Sponsor,
} from './sponsor';

export type SponsorsSource = 'firestore' | 'seed';

export function useSponsors(): {
  sponsors: Sponsor[];
  loading: boolean;
  source: SponsorsSource;
} {
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => sortSponsors(SPONSOR_SEED));
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [source, setSource] = useState<SponsorsSource>(isFirebaseConfigured ? 'firestore' : 'seed');

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const q = query(collection(db, SPONSORS_COLLECTION).withConverter(sponsorConverter));

    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => d.data());
        setSponsors(docs.length ? sortSponsors(docs) : sortSponsors(SPONSOR_SEED));
        setSource(docs.length ? 'firestore' : 'seed');
        setLoading(false);
      },
      () => {
        setSponsors(sortSponsors(SPONSOR_SEED));
        setSource('seed');
        setLoading(false);
      },
    );
  }, []);

  return { sponsors, loading, source };
}
