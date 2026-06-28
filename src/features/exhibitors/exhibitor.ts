/**
 * Domínio "Expositor" — a fonte da verdade passa a ser o Firestore.
 *
 * O tipo reaproveita o `Booth` já existente (mesma forma usada pelas telas) e
 * acrescenta os campos de cadastro/moderação. O array `BOOTHS` de `venue.ts`
 * segue como SEED (carga inicial do banco) e como FALLBACK enquanto o Firebase
 * não estiver configurado.
 */
import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { type Booth, type BoothCategory } from '@/features/venue/venue';

/** Reexport para o formulário de cadastro não precisar conhecer `venue`. */
export type { BoothCategory };

export const BOOTH_CATEGORIES: BoothCategory[] = [
  'Standard',
  'Reservado',
  'Diamante',
  'Super Diamante',
];

export type ExhibitorStatus = 'draft' | 'published';

export type Exhibitor = Booth & {
  /** uid do expositor dono do cadastro (usado nas Security Rules na Fase 2). */
  ownerUid?: string;
  /** Visível ao público apenas quando `published`. */
  status?: ExhibitorStatus;
  /** URL do logo no Firebase Storage (Fase 3); por ora usamos `logo` textual. */
  logoUrl?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  segments?: string[];
  targetAudience?: string[];
  lookingFor?: string[];
  keywords?: string[];
};

/** Coleção raiz dos expositores no Firestore. */
export const EXHIBITORS_COLLECTION = 'exhibitors';

/**
 * Converte documento Firestore ↔ `Exhibitor`. O `id` do documento é o id do
 * estande (ex.: "86"), então não duplicamos esse campo dentro do documento.
 */
export const exhibitorConverter: FirestoreDataConverter<Exhibitor> = {
  toFirestore(exhibitor: Exhibitor) {
    const { id: _omit, ...data } = exhibitor;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Exhibitor {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      company: data.company ?? '',
      logo: data.logo ?? '',
      stand: data.stand ?? '',
      area: data.area ?? '',
      category: data.category ?? 'Standard',
      industry: data.industry ?? '',
      about: data.about ?? '',
      products: Array.isArray(data.products) ? data.products : [],
      fit: typeof data.fit === 'number' ? data.fit : 0,
      point: data.point ?? { x: 0.5, y: 0.5 },
      ownerUid: data.ownerUid,
      status: data.status ?? 'draft',
      logoUrl: data.logoUrl,
      contactName: data.contactName ?? '',
      contactRole: data.contactRole ?? '',
      contactEmail: data.contactEmail ?? '',
      contactPhone: data.contactPhone ?? '',
      website: data.website ?? '',
      instagram: data.instagram ?? '',
      linkedin: data.linkedin ?? '',
      segments: Array.isArray(data.segments) ? data.segments : [],
      targetAudience: Array.isArray(data.targetAudience) ? data.targetAudience : [],
      lookingFor: Array.isArray(data.lookingFor) ? data.lookingFor : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
    };
  },
};
