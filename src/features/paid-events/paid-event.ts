export const PAID_EVENTS_COLLECTION = 'paidEvents';

export const VISITATION_TICKET_URL =
  'https://www.sympla.com.br/evento/expoindustrial-sul-2026/3486582';

export const OFFICIAL_PAID_EVENTS = [
  {
    id: 'higestor-17300',
    higestorEventId: '17300',
    title: 'VII Encontro Brasileiro de PPCP & Gestão Industrial + I Encontro Brasileiro de S&OP, S&OE & IBP',
    description:
      'Encontro técnico para profissionais de planejamento, programação e controle de produção, gestão industrial, S&OP, S&OE e IBP.',
    dateLabel: '16 Nov 2026',
    location: 'Expocentro Edmundo Doubrawa, Joinville/SC',
    paymentUrl:
      'https://app.higestor.com.br/inscricao/17300/vii-encontro-brasileiro-de-ppcp-gestao-industrial-i-encontro-brasileiro-de-s-op-s-oe-ibp',
    order: 10,
  },
  {
    id: 'higestor-17299',
    higestorEventId: '17299',
    title: 'VII Encontro do Programa 5S e Excelência Operacional + II Fórum da Qualidade e ESG',
    description:
      'Evento sobre Programa 5S, excelência operacional, qualidade e práticas ESG aplicadas à gestão industrial.',
    dateLabel: '18 Nov 2026',
    location: 'Expocentro Edmundo Doubrawa, Joinville/SC',
    paymentUrl:
      'https://app.higestor.com.br/inscricao/17299/vii-encontro-do-programa-5s-excelencia-operacional-forum-da-qualidade-2026-sp',
    order: 20,
  },
  {
    id: 'higestor-18696',
    higestorEventId: '18696',
    title:
      'Seminário de Manutenção e Confiabilidade + Seminário de Indústria 4.0, Automação e Transformação Digital',
    description:
      'Seminário para líderes e técnicos interessados em manutenção, confiabilidade, Indústria 4.0, automação e transformação digital.',
    dateLabel: '18 Nov 2026',
    location: 'Expocentro Edmundo Doubrawa, Joinville/SC',
    paymentUrl:
      'https://app.higestor.com.br/inscricao/18696/seminario-industria-4-0-automacao-e-transformacao-digital-seminario-manutencao-e-confiabilidade',
    order: 30,
  },
] as const;

const OFFICIAL_PAID_EVENT_IDS = new Set<string>(OFFICIAL_PAID_EVENTS.map((event) => event.id));

export function isOfficialPaidEventId(id: string): boolean {
  return OFFICIAL_PAID_EVENT_IDS.has(id);
}

export type PaidEvent = {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  location: string;
  higestorEventId?: string;
  paymentUrl?: string;
  order: number;
  createdAt: number;
};

export type PaidEventAccess = {
  status: 'paid' | 'pending' | 'cancelled';
  userEmailLower: string;
  fullName: string;
  cpfLast4?: string;
  ticketNumber?: string;
  ticketQrCode?: string;
  ticketQrHash?: string;
  ticketName?: string;
  source: 'higestor' | 'sympla' | 'manual';
  syncedAt: number;
};

export type PaidEventMaterial = {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  contentType: string;
  order: number;
  createdAt: number;
};

export function normalizeAccessEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}
