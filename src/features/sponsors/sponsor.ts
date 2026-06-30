/**
 * Domínio "Patrocinador" — fonte da verdade no Firestore (coleção `sponsors`).
 *
 * O `SPONSOR_SEED` é a carga inicial do banco e também o FALLBACK enquanto o
 * Firebase não estiver configurado. A cor de cada card é derivada do `tier` na
 * própria tela (não fica no banco).
 */
import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { auth, db, storage } from '@/lib/firebase';

export const SPONSORS_COLLECTION = 'sponsors';

export type SponsorTier = 'DIAMOND' | 'GOLD' | 'SILVER';

export type Sponsor = {
  id: string;
  /** Nome da empresa. */
  name: string;
  /** Texto exibido como "logo" no card (ex.: 'INTEL'). */
  logoText: string;
  /** URL da logo enviada para o Firebase Storage. */
  logoUrl?: string;
  tier: SponsorTier;
  /** Ordem dentro do mesmo tier (menor primeiro). */
  order: number;
};

/** Peso de cada tier para ordenação (Diamante primeiro). */
export const TIER_RANK: Record<SponsorTier, number> = {
  DIAMOND: 0,
  GOLD: 1,
  SILVER: 2,
};

export const SPONSOR_SEED: Sponsor[] = [
  { id: 'intel', name: 'Intel', logoText: 'INTEL', tier: 'DIAMOND', order: 0 },
  { id: 'cisco', name: 'Cisco', logoText: 'CISCO', tier: 'DIAMOND', order: 1 },
  { id: 'microsoft', name: 'Microsoft', logoText: 'MICROSOFT', tier: 'GOLD', order: 0 },
  { id: 'dell', name: 'Dell', logoText: 'DELL', tier: 'GOLD', order: 1 },
  { id: 'sap', name: 'SAP', logoText: 'SAP', tier: 'SILVER', order: 0 },
  { id: 'oracle', name: 'Oracle', logoText: 'ORACLE', tier: 'SILVER', order: 1 },
];

/** Ordena por tier (Diamante → Ouro → Prata) e depois pela `order`. */
export function sortSponsors(sponsors: Sponsor[]): Sponsor[] {
  return [...sponsors].sort(
    (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.order - b.order,
  );
}

export const sponsorConverter: FirestoreDataConverter<Sponsor> = {
  toFirestore(sponsor: Sponsor) {
    const { id: _omit, ...data } = sponsor;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Sponsor {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name ?? '',
      logoText: data.logoText ?? '',
      logoUrl: data.logoUrl ?? '',
      tier: (data.tier as SponsorTier) ?? 'SILVER',
      order: typeof data.order === 'number' ? data.order : 0,
    };
  },
};

export async function updateSponsorLogoUrl(id: string, logoUrl: string): Promise<void> {
  if (!db) throw new Error('Firebase não configurado.');
  await updateDoc(doc(db, SPONSORS_COLLECTION, id), { logoUrl });
}

export async function uploadSponsorLogo(sponsorId: string, uri: string): Promise<string> {
  if (!storage || !auth?.currentUser) {
    throw new Error('É preciso estar autenticado e o Firebase configurado.');
  }
  const uid = auth.currentUser.uid;
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `sponsors/${uid}/${sponsorId}-logo`);
  await uploadBytes(storageRef, blob, {
    contentType: blob.type || 'image/jpeg',
  });
  return getDownloadURL(storageRef);
}
