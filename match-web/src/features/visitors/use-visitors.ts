'use client';

import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  mergeVisitorProfile,
  VISITOR_PRIVATE_PROFILES_COLLECTION,
  VISITORS_COLLECTION,
  visitorConverter,
  visitorPrivateConverter,
  type VisitorPrivateProfile,
  type VisitorProfile,
} from '@/domain/visitor';
import { db } from '@/lib/firebase';

export function useVisitors() {
  const [visitors, setVisitors] = useState<VisitorProfile[]>([]);
  const [loading, setLoading] = useState(Boolean(db));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) return;
    let publicProfiles: VisitorProfile[] = [];
    let privateProfiles = new Map<string, VisitorPrivateProfile>();
    let publicLoaded = false;
    let privateLoaded = false;
    const publish = () => {
      if (!publicLoaded || !privateLoaded) return;
      setVisitors(publicProfiles
        .map((profile) => mergeVisitorProfile(profile, privateProfiles.get(profile.uid)))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR')));
      setLoading(false);
      setError(null);
    };
    const fail = (err: Error) => {
      console.error('Error fetching visitors:', err);
      setError(err);
      setLoading(false);
    };
    const unsubscribePublic = onSnapshot(
      collection(db, VISITORS_COLLECTION).withConverter(visitorConverter),
      (snap) => {
        publicProfiles = snap.docs.map((item) => item.data());
        publicLoaded = true;
        publish();
      },
      fail,
    );
    const unsubscribePrivate = onSnapshot(
      collection(db, VISITOR_PRIVATE_PROFILES_COLLECTION).withConverter(visitorPrivateConverter),
      (snap) => {
        privateProfiles = new Map(snap.docs.map((item) => [item.id, item.data()]));
        privateLoaded = true;
        publish();
      },
      fail,
    );
    return () => {
      unsubscribePublic();
      unsubscribePrivate();
    };
  }, []);

  return { visitors, loading, error };
}
