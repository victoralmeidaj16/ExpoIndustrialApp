/**
 * Domínio do local/croqui — coordenadas normalizadas (0..1) sobre a imagem do
 * croqui oficial. Espelha `ExpoIndustrialApp/src/features/venue/venue.ts`.
 */
export type VenuePoint = { x: number; y: number };

export type BoothCategory = 'Diamante' | 'Super Diamante' | 'Reservado' | 'Standard';

export const BOOTH_CATEGORIES: BoothCategory[] = [
  'Standard',
  'Reservado',
  'Diamante',
  'Super Diamante',
];

export type Booth = {
  id: string;
  company: string;
  logo: string;
  stand: string;
  area: string;
  category: BoothCategory;
  industry: string;
  about: string;
  products: string[];
  fit: number;
  point: VenuePoint;
};

export const VENUE = {
  name: 'Centreventos Cau Hansen',
  address: 'Av. José Vieira, 315 — América, Joinville/SC',
};
