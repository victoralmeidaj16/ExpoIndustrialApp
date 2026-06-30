'use client';

import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  VISITORS_COLLECTION,
  visitorConverter,
  type VisitorProfile,
} from '@/domain/visitor';
import { db } from '@/lib/firebase';

export function useVisitors() {
  const [visitors, setVisitors] = useState<VisitorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const ref = collection(db, VISITORS_COLLECTION).withConverter(visitorConverter);
    return onSnapshot(
      ref,
      (snap) => {
        const docs = snap.docs
          .map((d) => d.data())
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        setVisitors(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching visitors:', err);
        setError(err);
        setLoading(false);
      },
    );
  }, []);

  return { visitors, loading, error };
}
