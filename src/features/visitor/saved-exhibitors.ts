/**
 * Empresas salvas pelo visitante (bookmark "Salvar empresa").
 *
 * A fonte da verdade é o array `savedExhibitors` no doc `visitors/{uid}` (mesmo
 * documento do perfil — privado ao dono pelas rules). Sem Firebase OU sem
 * login, persiste localmente no AsyncStorage (modo demo).
 *
 * O `toggle` é otimista: atualiza o estado na hora e persiste em segundo plano,
 * então a leitura é feita uma vez por montagem (não precisa de realtime para um
 * bookmark — cada tela reflete o estado atual ao abrir).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

import { VISITORS_COLLECTION } from './visitor-profile';

const SAVED_KEY = '@expoindustrial:saved-exhibitors';

function canUseFirestore(): boolean {
  return isFirebaseConfigured && Boolean(db) && Boolean(auth?.currentUser);
}

async function loadSaved(): Promise<string[]> {
  if (canUseFirestore()) {
    const snap = await getDoc(doc(db!, VISITORS_COLLECTION, auth!.currentUser!.uid));
    const ids = snap.data()?.savedExhibitors;
    return Array.isArray(ids) ? ids : [];
  }
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function persistToggle(id: string, wasSaved: boolean, next: string[]): Promise<void> {
  if (canUseFirestore()) {
    await setDoc(
      doc(db!, VISITORS_COLLECTION, auth!.currentUser!.uid),
      { savedExhibitors: wasSaved ? arrayRemove(id) : arrayUnion(id), ownerUid: auth!.currentUser!.uid },
      { merge: true },
    );
    return;
  }
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
}

export type UseSavedExhibitorsResult = {
  savedIds: string[];
  loading: boolean;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
};

export function useSavedExhibitors(): UseSavedExhibitorsResult {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth?.currentUser?.uid;

  useEffect(() => {
    let active = true;
    loadSaved().then((ids) => {
      if (active) {
        setSavedIds(ids);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [uid]);

  const toggle = useCallback((id: string) => {
    setSavedIds((cur) => {
      const wasSaved = cur.includes(id);
      const next = wasSaved ? cur.filter((x) => x !== id) : [...cur, id];
      void persistToggle(id, wasSaved, next);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, loading, isSaved, toggle };
}
