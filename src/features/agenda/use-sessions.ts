import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, onSnapshot, query, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/use-auth';
import { VISITORS_COLLECTION } from '@/features/visitor/visitor-profile';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

import {
  SESSIONS_COLLECTION,
  SESSION_SEED,
  sessionConverter,
  type Session,
} from './session';

const LOCAL_PREFS_KEY = '@expoindustrial:agenda-preferences';
const OLD_MOCK_SESSION_IDS = new Set([
  'd1-1', 'd1-2', 'd1-3', 'd1-4', 'd1-5',
  'd2-1', 'd2-2', 'd2-3',
  'd3-1', 'd3-2',
  'd4-1',
]);

type AgendaPreferences = {
  favoriteIds: string[];
  reminderIds: string[];
  registeredIds: string[];
};

const EMPTY_PREFS: AgendaPreferences = {
  favoriteIds: [],
  reminderIds: [],
  registeredIds: [],
};

export type SessionsSource = 'firestore' | 'seed';

export function useSessions(): {
  sessions: Session[];
  loading: boolean;
  error: Error | null;
  source: SessionsSource;
} {
  const [sessions, setSessions] = useState<Session[]>(SESSION_SEED);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<SessionsSource>(isFirebaseConfigured ? 'firestore' : 'seed');

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    // Sem orderBy no servidor (dois campos exigiriam índice composto). A grade
    // é pequena, então ordena no cliente por dia e horário.
    const q = query(collection(db, SESSIONS_COLLECTION).withConverter(sessionConverter));

    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((item) => item.data())
          .filter((session) => !OLD_MOCK_SESSION_IDS.has(session.id))
          .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
        setSessions(docs.length ? docs : SESSION_SEED);
        setSource(docs.length ? 'firestore' : 'seed');
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setSessions(SESSION_SEED);
        setSource('seed');
        setLoading(false);
      },
    );
  }, []);

  return { sessions, loading, error, source };
}

function normalizePrefs(data: Record<string, unknown> | null | undefined): AgendaPreferences {
  return {
    favoriteIds: Array.isArray(data?.agendaFavoriteIds) ? (data?.agendaFavoriteIds as string[]) : [],
    reminderIds: Array.isArray(data?.agendaReminderIds) ? (data?.agendaReminderIds as string[]) : [],
    registeredIds: Array.isArray(data?.agendaRegisteredSessionIds)
      ? (data?.agendaRegisteredSessionIds as string[])
      : [],
  };
}

async function readLocalPrefs(): Promise<AgendaPreferences> {
  const raw = await AsyncStorage.getItem(LOCAL_PREFS_KEY);
  if (!raw) return EMPTY_PREFS;
  try {
    return { ...EMPTY_PREFS, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PREFS;
  }
}

async function writeLocalPrefs(prefs: AgendaPreferences) {
  await AsyncStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
}

export function useAgendaPreferences(sessions: Session[]) {
  const { user, configured } = useAuth();
  const [prefs, setPrefs] = useState<AgendaPreferences>(EMPTY_PREFS);
  const [loading, setLoading] = useState(true);

  const uid = user?.uid ?? auth?.currentUser?.uid;

  useEffect(() => {
    let active = true;

    if (configured && db && uid) {
      const ref = doc(db, VISITORS_COLLECTION, uid);
      return onSnapshot(
        ref,
        (snap) => {
          if (!active) return;
          setPrefs(normalizePrefs(snap.exists() ? snap.data() : null));
          setLoading(false);
        },
        () => {
          if (!active) return;
          setLoading(false);
        },
      );
    }

    readLocalPrefs()
      .then((local) => {
        if (active) setPrefs(local);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [configured, uid]);

  const persist = useCallback(
    async (next: AgendaPreferences) => {
      setPrefs(next);
      if (configured && db && uid) {
        await setDoc(
          doc(db, VISITORS_COLLECTION, uid),
          {
            agendaFavoriteIds: next.favoriteIds,
            agendaReminderIds: next.reminderIds,
            agendaRegisteredSessionIds: next.registeredIds,
            ownerUid: uid,
          },
          { merge: true },
        );
      } else {
        await writeLocalPrefs(next);
      }
    },
    [configured, uid],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const favoriteIds = prefs.favoriteIds.includes(id)
        ? prefs.favoriteIds.filter((item) => item !== id)
        : [...prefs.favoriteIds, id];
      await persist({ ...prefs, favoriteIds });
    },
    [persist, prefs],
  );

  const toggleReminder = useCallback(
    async (id: string) => {
      const reminderIds = prefs.reminderIds.includes(id)
        ? prefs.reminderIds.filter((item) => item !== id)
        : [...prefs.reminderIds, id];
      await persist({ ...prefs, reminderIds });
    },
    [persist, prefs],
  );

  const toggleRegistration = useCallback(
    async (id: string): Promise<'registered' | 'cancelled' | 'full'> => {
      const session = sessions.find((item) => item.id === id);
      const registered = prefs.registeredIds.includes(id);
      const full = session ? session.registeredCount >= session.capacity : false;

      if (!registered && full) return 'full';

      const registeredIds = registered
        ? prefs.registeredIds.filter((item) => item !== id)
        : [...prefs.registeredIds, id];
      await persist({ ...prefs, registeredIds });
      return registered ? 'cancelled' : 'registered';
    },
    [persist, prefs, sessions],
  );

  const registeredSessions = useMemo(
    () => sessions.filter((session) => prefs.registeredIds.includes(session.id)),
    [prefs.registeredIds, sessions],
  );

  return {
    ...prefs,
    loading,
    registeredSessions,
    toggleFavorite,
    toggleReminder,
    toggleRegistration,
  };
}
