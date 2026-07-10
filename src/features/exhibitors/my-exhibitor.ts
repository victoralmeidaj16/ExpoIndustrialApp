/**
 * Cadastro do PRÓPRIO expositor (auto-serviço).
 *
 * Cada expositor autenticado é dono do documento `exhibitors/{uid}`. Ele edita
 * apenas os campos da empresa; `point` (posição no croqui), `fit` e `status`
 * (moderação) ficam a cargo do organizador (Fase 4). Por isso novos cadastros
 * nascem como `draft` e só aparecem no app público após publicação.
 */
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';

import { auth, db, isFirebaseConfigured, storage } from '@/lib/firebase';

import {
  EXHIBITORS_COLLECTION,
  exhibitorConverter,
  type Exhibitor,
} from './exhibitor';

/** Campos que o expositor pode editar. */
export type ExhibitorFormData = {
  company: string;
  logo: string;
  logoUrl?: string;
  industry: string;
  about: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  instagram: string;
  linkedin: string;
  segments: string[];
  targetAudience: string[];
  lookingFor: string[];
  keywords: string[];
};

export const EMPTY_FORM: ExhibitorFormData = {
  company: '',
  logo: '',
  logoUrl: '',
  industry: '',
  about: '',
  contactName: '',
  contactRole: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  instagram: '',
  linkedin: '',
  segments: [],
  targetAudience: [],
  lookingFor: [],
  keywords: [],
};

/** Extrai os campos editáveis de um `Exhibitor` para preencher o formulário. */
export function toFormData(e: Exhibitor): ExhibitorFormData {
  return {
    company: e.company,
    logo: e.logo,
    logoUrl: e.logoUrl || '',
    industry: e.industry,
    about: e.about,
    contactName: e.contactName || '',
    contactRole: e.contactRole || '',
    contactEmail: e.contactEmail || '',
    contactPhone: e.contactPhone || '',
    website: e.website || '',
    instagram: e.instagram || '',
    linkedin: e.linkedin || '',
    segments: e.segments || [],
    targetAudience: e.targetAudience || [],
    lookingFor: e.lookingFor || [],
    keywords: e.keywords || [],
  };
}

export type MyExhibitorResult = {
  exhibitor: Exhibitor | null;
  loading: boolean;
  error: Error | null;
};

/** Assina o documento do expositor logado (inclui rascunhos). */
export function useMyExhibitor(): MyExhibitorResult {
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const uid = auth?.currentUser?.uid;

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !uid) {
      let active = true;
      queueMicrotask(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    const ref = doc(db, EXHIBITORS_COLLECTION, uid).withConverter(exhibitorConverter);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setExhibitor(snap.exists() ? snap.data() : null);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return { exhibitor, loading, error };
}

/**
 * Cria/atualiza o cadastro do expositor logado. Mantém `point`/`fit`/`status`
 * sob controle do organizador: `status: 'draft'` só é definido na CRIAÇÃO, para
 * não rebaixar um cadastro já publicado quando o expositor o edita.
 */
export async function saveMyExhibitor(data: ExhibitorFormData): Promise<void> {
  if (!db || !auth?.currentUser) {
    throw new Error('É preciso estar autenticado para salvar o cadastro.');
  }
  const uid = auth.currentUser.uid;
  const ref = doc(db, EXHIBITORS_COLLECTION, uid);
  const exists = (await getDoc(ref)).exists();

  const payload: Record<string, unknown> = {
    ...data,
    segments: data.segments.filter((p) => p.trim().length > 0),
    targetAudience: data.targetAudience.filter((p) => p.trim().length > 0),
    lookingFor: data.lookingFor.filter((p) => p.trim().length > 0),
    keywords: data.keywords.filter((p) => p.trim().length > 0),
    ownerUid: uid,
  };
  if (!exists) payload.status = 'draft';

  await setDoc(ref, payload, { merge: true });
}

export async function uploadExhibitorLogo(uri: string): Promise<string> {
  if (!storage || !auth?.currentUser) {
    throw new Error('É preciso estar autenticado e o Firebase configurado.');
  }
  const uid = auth.currentUser.uid;
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `logos/${uid}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
