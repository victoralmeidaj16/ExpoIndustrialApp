/**
 * Configuração do evento (nome, datas, local) — fonte da verdade no Firestore,
 * doc único `event/config`, gerido pelo painel do organizador (match-web).
 *
 * Lê em tempo real e cai no fallback (textos atuais do app) enquanto o doc não
 * existir / Firebase não estiver configurado.
 */
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db, isFirebaseConfigured } from '@/lib/firebase';

export const EVENT_COLLECTION = 'event';
export const EVENT_CONFIG_ID = 'config';

export type EventConfig = {
  name: string;
  tagline: string;
  dateLabel: string;
  startDate: string;
  endDate: string;
  venueName: string;
  venueAddress: string;
};

/** Fallback = textos hoje hardcoded na home, para não quebrar sem o doc. */
export const EVENT_FALLBACK: EventConfig = {
  name: 'EXPOINDUSTRIAL SUL · 2026',
  tagline: 'Feira de soluções para a indústria',
  dateLabel: '16-19 NOV',
  startDate: '',
  endDate: '',
  venueName: 'Expocentro Edmundo Doubrawa',
  venueAddress: 'Joinville - SC · 14h às 21h',
};

function normalize(data: Record<string, unknown> | undefined): EventConfig {
  if (!data) return EVENT_FALLBACK;
  return {
    name: (data.name as string)?.trim() || EVENT_FALLBACK.name,
    tagline: (data.tagline as string)?.trim() || EVENT_FALLBACK.tagline,
    dateLabel: (data.dateLabel as string)?.trim() || EVENT_FALLBACK.dateLabel,
    startDate: (data.startDate as string) ?? '',
    endDate: (data.endDate as string) ?? '',
    venueName: (data.venueName as string)?.trim() || EVENT_FALLBACK.venueName,
    venueAddress: (data.venueAddress as string)?.trim() || EVENT_FALLBACK.venueAddress,
  };
}

export function useEventConfig(): { event: EventConfig; loading: boolean } {
  const [event, setEvent] = useState<EventConfig>(EVENT_FALLBACK);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }
    const ref = doc(db, EVENT_COLLECTION, EVENT_CONFIG_ID);
    return onSnapshot(
      ref,
      (snap) => {
        setEvent(normalize(snap.exists() ? snap.data() : undefined));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  return { event, loading };
}
