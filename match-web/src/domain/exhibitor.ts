/**
 * Domínio "Expositor" — espelha `ExpoIndustrialApp/src/features/exhibitors/exhibitor.ts`.
 * O id do documento é o id do estande (ex.: "86"); não duplicamos no corpo.
 */
import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { type Booth, type BoothCategory } from './venue';

export type { BoothCategory };

export type ExhibitorStatus = 'draft' | 'published';

export type Exhibitor = Booth & {
  ownerUid?: string;
  status?: ExhibitorStatus;
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

export const EXHIBITORS_COLLECTION = 'exhibitors';

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

/** `true` quando o expositor ainda não tem posição definida no croqui. */
export function hasPlacement(item: Exhibitor): boolean {
  return Boolean(item.point) && !(item.point.x === 0.5 && item.point.y === 0.5);
}
