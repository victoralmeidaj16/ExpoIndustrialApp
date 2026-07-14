import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { OFFICIAL_PAID_EVENTS } from '../paid-events/paid-event';

export const SESSIONS_COLLECTION = 'sessions';

export const TRACKS = [
  'VII Encontro Brasileiro de PPCP & Gestão Industrial + I Encontro Brasileiro de S&OP, S&OE & IBP',
  'VII Encontro do Programa 5S e Excelência Operacional + II Fórum da Qualidade e ESG',
  'Seminário de Manutenção e Confiabilidade + Seminário de Indústria 4.0, Automação e Transformação Digital',
  'Seminário Desafios e Oportunidades da Reforma Tributária C-Level Meeting',
] as const;

export type SessionTrack = (typeof TRACKS)[number];

export type Session = {
  id: string;
  title: string;
  speaker: string;
  role: string;
  company: string;
  time: string;
  location: string;
  track: SessionTrack;
  day: number;
  dateLabel: string;
  description: string;
  imageUrl?: string;
  registrationUrl?: string;
  capacity: number;
  registeredCount: number;
};

export const SESSION_SEED: Session[] = [
  {
    id: 'session-17300',
    title: 'VII Encontro Brasileiro de PPCP & Gestão Industrial + I Encontro Brasileiro de S&OP, S&OE & IBP',
    speaker: 'Painel de Especialistas',
    role: 'Palestrantes e Executivos',
    company: '7+ Club / Convidados',
    time: '08:00 - 18:00',
    location: 'Expocentro Edmundo Doubrawa',
    track: TRACKS[0],
    day: 1,
    dateLabel: '16 Nov',
    capacity: 500,
    registeredCount: 0,
    registrationUrl: OFFICIAL_PAID_EVENTS[0].paymentUrl,
    description: 'O principal encontro de Planejamento, Programação e Controle de Produção (PPCP) e Sales & Operations Planning (S&OP) do Sul do Brasil, reunindo líderes industriais para debater eficiência e excelência operacional.',
  },
  {
    id: 'session-17299',
    title: 'VII Encontro do Programa 5S e Excelência Operacional + II Fórum da Qualidade e ESG',
    speaker: 'Auditório Principal',
    role: 'Especialistas do Setor',
    company: 'Comissão Organizadora',
    time: '08:00 - 18:00',
    location: 'Expocentro Edmundo Doubrawa',
    track: TRACKS[1],
    day: 3,
    dateLabel: '18 Nov',
    capacity: 500,
    registeredCount: 0,
    registrationUrl: OFFICIAL_PAID_EVENTS[1].paymentUrl,
    description: 'Discussões aprofundadas sobre o Programa 5S, gestão da qualidade e a integração das práticas ESG na estratégia e operação industrial moderna.',
  },
  {
    id: 'session-18696',
    title: 'Seminário de Manutenção e Confiabilidade + Seminário de Indústria 4.0, Automação e Transformação Digital',
    speaker: 'Líderes de Tecnologia',
    role: 'Pesquisadores e Engenheiros',
    company: 'Parceiros Tecnológicos',
    time: '08:00 - 18:00',
    location: 'Expocentro Edmundo Doubrawa',
    track: TRACKS[2],
    day: 3,
    dateLabel: '18 Nov',
    capacity: 500,
    registeredCount: 0,
    registrationUrl: OFFICIAL_PAID_EVENTS[2].paymentUrl,
    description: 'Seminário focado em transformação digital, adoção de tecnologias da Indústria 4.0, automação industrial e as melhores práticas em manutenção e confiabilidade de ativos.',
  },
];


export const sessionConverter: FirestoreDataConverter<Session> = {
  toFirestore(session: Session) {
    const { id: _omit, ...data } = session;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Session {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title ?? '',
      speaker: data.speaker ?? '',
      role: data.role ?? '',
      company: data.company ?? '',
      time: data.time ?? '',
      location: data.location ?? '',
      track: (data.track as SessionTrack) ?? TRACKS[0],
      day: typeof data.day === 'number' ? data.day : 1,
      dateLabel: data.dateLabel ?? '',
      description: data.description ?? '',
      imageUrl: data.imageUrl ?? '',
      registrationUrl: data.registrationUrl ?? getSessionRegistrationUrl(snapshot.id, data.title ?? ''),
      capacity: typeof data.capacity === 'number' ? data.capacity : 0,
      registeredCount: typeof data.registeredCount === 'number' ? data.registeredCount : 0,
    };
  },
};

export function getSessionRegistrationUrl(id: string, title = ''): string {
  if (id === 'session-17300' || title.includes('PPCP')) return OFFICIAL_PAID_EVENTS[0].paymentUrl;
  if (id === 'session-17299' || title.includes('5S')) return OFFICIAL_PAID_EVENTS[1].paymentUrl;
  if (id === 'session-18696' || title.includes('Manutenção') || title.includes('Indústria 4.0')) {
    return OFFICIAL_PAID_EVENTS[2].paymentUrl;
  }
  return '';
}

export function getSessionImageSource(session: Pick<Session, 'imageUrl'>) {
  if (session.imageUrl) return { uri: session.imageUrl };
  return require('@/assets/images/expo-hero.png');
}
