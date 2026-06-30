import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { EXHIBITORS_COLLECTION, exhibitorConverter, type Exhibitor } from '@/domain/exhibitor';

export type ExhibitorLead = {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone?: string;
  source?: string;
  createdAt?: number;
};

/**
 * Busca o perfil de expositor vinculado ao UID do usuário logado (dono).
 */
export async function getExhibitorByOwner(ownerUid: string): Promise<Exhibitor | null> {
  if (!db) return null;

  const q = query(
    collection(db, EXHIBITORS_COLLECTION).withConverter(exhibitorConverter),
    where('ownerUid', '==', ownerUid),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  return querySnapshot.docs[0].data();
}

/**
 * Atualiza o perfil do expositor no Firestore.
 */
export async function updateExhibitor(exhibitorId: string, data: Partial<Exhibitor>): Promise<void> {
  if (!db) return;
  const docRef = doc(db, EXHIBITORS_COLLECTION, exhibitorId);
  await updateDoc(docRef, data);
}

/**
 * Retorna os leads comerciais captados pelo expositor (ownerUid).
 */
export async function getExhibitorLeads(ownerUid: string): Promise<ExhibitorLead[]> {
  if (!db) return [];

  const q = query(
    collection(db, 'leads'),
    where('ownerUid', '==', ownerUid)
  );

  const querySnapshot = await getDocs(q);
  const leads: ExhibitorLead[] = [];

  querySnapshot.forEach((snap) => {
    const data = snap.data();
    leads.push({
      id: snap.id,
      name: data.name ?? '',
      role: data.role ?? '',
      company: data.company ?? '',
      email: data.email ?? '',
      phone: data.phone,
      source: data.source,
      createdAt: data.createdAt,
    });
  });

  // Ordenar no client por mais recente
  return leads.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}
