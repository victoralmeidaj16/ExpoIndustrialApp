/**
 * Domínio "Patrocinador" — espelha
 * `ExpoIndustrialApp/src/features/sponsors/sponsor.ts`.
 */
import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export const SPONSORS_COLLECTION = 'sponsors';

export type SponsorTier = 'DIAMOND' | 'GOLD' | 'SILVER';

export const SPONSOR_TIERS: SponsorTier[] = ['DIAMOND', 'GOLD', 'SILVER'];

export const TIER_LABEL: Record<SponsorTier, string> = {
  DIAMOND: 'Diamante',
  GOLD: 'Ouro',
  SILVER: 'Prata',
};

export const TIER_RANK: Record<SponsorTier, number> = {
  DIAMOND: 0,
  GOLD: 1,
  SILVER: 2,
};

export type Sponsor = {
  id: string;
  name: string;
  logoText: string;
  logoUrl?: string;
  tier: SponsorTier;
  order: number;
};

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
      logoUrl: data.logoUrl,
      tier: (data.tier as SponsorTier) ?? 'SILVER',
      order: typeof data.order === 'number' ? data.order : 0,
    };
  },
};
