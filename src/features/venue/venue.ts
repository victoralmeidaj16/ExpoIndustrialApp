/**
 * Domínio do local do evento (Centreventos Cau Hansen).
 *
 * As posições usam COORDENADAS NORMALIZADAS sobre o croqui oficial:
 *   x: 0 (borda esquerda) → 1 (borda direita)
 *   y: 0 (topo) → 1 (base)
 * Assim os marcadores acompanham automaticamente o zoom/escala da imagem.
 */

export type VenuePoint = { x: number; y: number };

export type BoothCategory = 'Diamante' | 'Super Diamante' | 'Reservado' | 'Standard';

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
  fit: number; // % de compatibilidade (matchmaking)
  point: VenuePoint;
};

export const VENUE = {
  name: 'Centreventos Cau Hansen',
  address: 'Av. José Vieira, 315 — América, Joinville/SC',
  // Dimensões aproximadas do pavilhão (m) para estimar distância/tempo.
  widthMeters: 80,
  heightMeters: 48,
};

/** Entrada principal (base, ao centro). */
export const ENTRANCE: VenuePoint = { x: 0.42, y: 0.92 };

/** Halls / zonas do pavilhão (retângulos normalizados na planta vetorial). */
export type Hall = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  filled?: boolean;
};

export const HALLS: Hall[] = [
  { id: 'a', label: 'Hall A · Automação', x: 0.06, y: 0.1, w: 0.4, h: 0.28 },
  { id: 'b', label: 'Hall B · Robótica', x: 0.54, y: 0.1, w: 0.4, h: 0.28 },
  { id: 'c', label: 'Hall C · Energia', x: 0.06, y: 0.46, w: 0.4, h: 0.28 },
  { id: 'stage', label: 'Conferência', x: 0.54, y: 0.46, w: 0.4, h: 0.22, filled: true },
];

/** Rota (waypoints em escada) da entrada até o estande em destaque. */
export const ROUTE_TO_HIGHLIGHT: VenuePoint[] = [
  { x: 0.42, y: 0.9 },
  { x: 0.42, y: 0.62 },
  { x: 0.72, y: 0.62 },
  { x: 0.72, y: 0.24 },
];

/** Estandes em destaque (posições aproximadas sobre o croqui — refinar com a planta cotada). */
export const BOOTHS: Booth[] = [
  {
    id: '86',
    company: 'Siemens Digital Industries',
    logo: 'SIEMENS',
    stand: 'Estande 86',
    area: '12 m²',
    category: 'Diamante',
    industry: 'Automação & Robótica',
    about:
      'Soluções de automação, digitalização industrial e robótica para aumentar a eficiência (OEE) da sua planta.',
    products: ['CLPs SIMATIC', 'Drives SINAMICS', 'Gêmeo Digital', 'MES / SCADA'],
    fit: 95,
    point: { x: 0.72, y: 0.2 },
  },
  {
    id: '95',
    company: 'Schneider Electric',
    logo: 'Schneider',
    stand: 'Estande 95',
    area: '12 m²',
    category: 'Diamante',
    industry: 'Eficiência Energética',
    about:
      'Gestão de energia e automação para indústrias que buscam redução de custos e metas de ESG.',
    products: ['EcoStruxure', 'Inversores', 'Quadros elétricos', 'Monitoramento de energia'],
    fit: 88,
    point: { x: 0.6, y: 0.3 },
  },
  {
    id: '50',
    company: 'Bosch Rexroth',
    logo: 'BOSCH',
    stand: 'Estande 50',
    area: '8 m²',
    category: 'Super Diamante',
    industry: 'Hidráulica & Mecatrônica',
    about: 'Tecnologia em acionamentos, hidráulica e mecatrônica para máquinas e linhas de produção.',
    products: ['Sistemas hidráulicos', 'Servoacionamentos', 'Perfis de alumínio', 'Prensas'],
    fit: 86,
    point: { x: 0.18, y: 0.2 },
  },
  {
    id: '113',
    company: 'WEG Automação',
    logo: 'WEG',
    stand: 'Estande 113',
    area: '8 m²',
    category: 'Standard',
    industry: 'Motores & Drives',
    about: 'Motores elétricos, inversores e soluções de acionamento de alta eficiência.',
    products: ['Motores W22', 'Inversores CFW', 'Soft-starters', 'Painéis'],
    fit: 79,
    point: { x: 0.16, y: 0.56 },
  },
  {
    id: '162',
    company: 'ABB Robotics',
    logo: 'ABB',
    stand: 'Estande 162',
    area: '8 m²',
    category: 'Reservado',
    industry: 'Robótica Colaborativa',
    about: 'Robôs industriais e colaborativos (cobots) para soldagem, paletização e montagem.',
    products: ['Cobots GoFa', 'Robôs IRB', 'RobotStudio', 'Células de solda'],
    fit: 84,
    point: { x: 0.62, y: 0.56 },
  },
  {
    id: '28',
    company: 'Festo Brasil',
    logo: 'FESTO',
    stand: 'Estande 28',
    area: '8 m²',
    category: 'Standard',
    industry: 'Pneumática Industrial',
    about: 'Automação pneumática e elétrica, além de capacitação técnica para a indústria.',
    products: ['Atuadores', 'Válvulas', 'Sensores', 'Festo Didactic'],
    fit: 81,
    point: { x: 0.34, y: 0.3 },
  },
];

/** Busca um estande pelo id. */
export function getBooth(id: string | undefined): Booth | undefined {
  return BOOTHS.find((b) => b.id === id);
}

export const CATEGORY_COLOR: Record<BoothCategory, string> = {
  Diamante: '#9BB7E0',
  'Super Diamante': '#F0C674',
  Reservado: '#E8907C',
  Standard: '#9BD3A0',
};

/** Distância em metros entre dois pontos normalizados, usando as dimensões do pavilhão. */
export function distanceMeters(a: VenuePoint, b: VenuePoint): number {
  const dx = (a.x - b.x) * VENUE.widthMeters;
  const dy = (a.y - b.y) * VENUE.heightMeters;
  return Math.round(Math.hypot(dx, dy));
}

/** Tempo de caminhada estimado (min), a ~1,2 m/s. */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 1.2 / 60));
}
