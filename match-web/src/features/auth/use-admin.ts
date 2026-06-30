'use client';

/**
 * Checagem de papel admin — espelha
 * `ExpoIndustrialApp/src/features/admin/use-admin.ts`.
 * O papel é o doc `admins/{uid}` (escrita bloqueada para cliente).
 */
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { db } from '@/lib/firebase';

export type AdminRoleResult = {
  isAdmin: boolean;
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
      setIsAdmin(false);
      setCheckedUid(null);
      setLoading(false);
      return;
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

  return {
    isAdmin,
    loading: Boolean(configured && uid && checkedUid !== uid) || loading,
    error,
  };
}
