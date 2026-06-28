import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/use-auth';
import {
  EXHIBITORS_COLLECTION,
  exhibitorConverter,
  type Exhibitor,
  type ExhibitorStatus,
} from '@/features/exhibitors/exhibitor';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { VISITORS_COLLECTION, type VisitorProfile } from '@/features/visitor/visitor-profile';

export type AdminRoleResult = {
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
};

export type AdminExhibitorsResult = {
  exhibitors: Exhibitor[];
  loading: boolean;
  error: Error | null;
};

export function useAdminRole(): AdminRoleResult {
  const { user, configured } = useAuth();
  const uid = user?.uid ?? null;
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedUid, setCheckedUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!configured || !db || !uid) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setIsAdmin(false);
        setCheckedUid(null);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    const ref = doc(db, 'admins', uid);
    return onSnapshot(
      ref,
      (snap) => {
        setIsAdmin(snap.exists());
        setCheckedUid(uid);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setIsAdmin(false);
        setCheckedUid(uid);
        setLoading(false);
        setError(err);
      },
    );
  }, [configured, uid]);

  return { isAdmin, loading: Boolean(configured && uid && checkedUid !== uid) || loading, error };
}

export function useAdminExhibitors(enabled: boolean): AdminExhibitorsResult {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured || !db) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setExhibitors([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    const ref = collection(db, EXHIBITORS_COLLECTION).withConverter(exhibitorConverter);
    return onSnapshot(
      ref,
      (snap) => {
        const docs = snap.docs
          .map((item) => item.data())
          .sort((a, b) => {
            if ((a.status ?? 'draft') !== (b.status ?? 'draft')) {
              return (a.status ?? 'draft') === 'draft' ? -1 : 1;
            }
            return a.company.localeCompare(b.company, 'pt-BR');
          });
        setExhibitors(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, [enabled]);

  return { exhibitors, loading, error };
}

export async function setExhibitorStatus(id: string, status: ExhibitorStatus) {
  if (!db) throw new Error('Firebase não configurado.');
  await updateDoc(doc(db, EXHIBITORS_COLLECTION, id), { status });
}

export type AdminVisitorsResult = {
  visitors: { uid: string; profile: VisitorProfile }[];
  loading: boolean;
  error: Error | null;
};

export function useAdminVisitors(enabled: boolean): AdminVisitorsResult {
  const [visitors, setVisitors] = useState<{ uid: string; profile: VisitorProfile }[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured || !db) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setVisitors([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    const ref = collection(db, VISITORS_COLLECTION);
    return onSnapshot(
      ref,
      (snap) => {
        const docs = snap.docs.map((doc) => ({
          uid: doc.id,
          profile: doc.data() as VisitorProfile,
        })).sort((a, b) => (a.profile.name || '').localeCompare(b.profile.name || '', 'pt-BR'));
        setVisitors(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
  }, [enabled]);

  return { visitors, loading, error };
}
