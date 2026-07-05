import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export const SESSIONS_COLLECTION = 'sessions';

export type SessionTrack = 'Automação' | 'PPCP' | 'S&OP' | 'ESG' | 'Manutenção';

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
  capacity: number;
  registeredCount: number;
};

export const TRACKS: SessionTrack[] = ['Automação', 'PPCP', 'S&OP', 'ESG', 'Manutenção'];

export const SESSION_SEED: Session[] = [
  {
    id: 'session-17300',
    title: 'VII Encontro Brasileiro de PPCP & Gestão Industrial + I Encontro Brasileiro de S&OP/S&OE/IBP',
    speaker: 'Painel de Especialistas',
    role: 'Palestrantes e Executivos',
    company: '7+ Club / Convidados',
    time: '08:00 - 18:00',
    location: 'Expocentro Edmundo Doubrawa',
    track: 'PPCP',
    day: 1,
    dateLabel: '16 Nov',
    capacity: 500,
    registeredCount: 0,
    description: 'O principal encontro de Planejamento, Programação e Controle de Produção (PPCP) e Sales & Operations Planning (S&OP) do Sul do Brasil, reunindo líderes industriais para debater eficiência e excelência operacional.',
  },
  {
    id: 'session-17299',
    title: 'VII Encontro do Programa 5S & Excelência Operacional + Fórum da Qualidade/ESG - 2026',
    speaker: 'Auditório Principal',
    role: 'Especialistas do Setor',
    company: 'Comissão Organizadora',
    time: '08:00 - 18:00',
    location: 'Expocentro Edmundo Doubrawa',
    track: 'ESG',
    day: 3,
    dateLabel: '18 Nov',
    capacity: 500,
    registeredCount: 0,
    description: 'Discussões aprofundadas sobre o Programa 5S, gestão da qualidade e a integração das práticas ESG na estratégia e operação industrial moderna.',
  },
  {
    id: 'session-18696',
    title: 'Seminário Indústria 4.0, Automação e Transformação Digital + Seminário Manutenção e Confiabilidade',
    speaker: 'Líderes de Tecnologia',
    role: 'Pesquisadores e Engenheiros',
    company: 'Parceiros Tecnológicos',
    time: '08:00 - 18:00',
    location: 'Expocentro Edmundo Doubrawa',
    track: 'Automação',
    day: 3,
    dateLabel: '18 Nov',
    capacity: 500,
    registeredCount: 0,
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
      track: data.track ?? 'Automação',
      day: typeof data.day === 'number' ? data.day : 1,
      dateLabel: data.dateLabel ?? '',
      description: data.description ?? '',
      imageUrl: data.imageUrl ?? '',
      capacity: typeof data.capacity === 'number' ? data.capacity : 0,
      registeredCount: typeof data.registeredCount === 'number' ? data.registeredCount : 0,
    };
  },
};

export function getSessionImageSource(session: Pick<Session, 'imageUrl'>) {
  if (session.imageUrl) return { uri: session.imageUrl };
  return require('@/assets/images/expo-hero.png');
}
