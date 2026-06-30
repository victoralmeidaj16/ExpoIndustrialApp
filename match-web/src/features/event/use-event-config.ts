'use client';

import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  EVENT_COLLECTION,
  EVENT_CONFIG_ID,
  emptyEventConfig,
  eventConfigConverter,
  type EventConfig,
} from '@/domain/event';
import { db } from '@/lib/firebase';

export function useEventConfig() {
  const [config, setConfig] = useState<EventConfig>(emptyEventConfig);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const ref = doc(db, EVENT_COLLECTION, EVENT_CONFIG_ID).withConverter(eventConfigConverter);
    return onSnapshot(
      ref,
      (snap) => {
        setExists(snap.exists());
        setConfig(snap.exists() ? snap.data() : emptyEventConfig());
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, []);

  return { config, exists, loading, error };
}

export async function saveEventConfig(data: EventConfig) {
  if (!db) throw new Error('Firebase não configurado.');
  await setDoc(doc(db, EVENT_COLLECTION, EVENT_CONFIG_ID), data, { merge: true });
}
