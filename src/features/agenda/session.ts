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
  capacity: number;
  registeredCount: number;
};

export const TRACKS: SessionTrack[] = ['Automação', 'PPCP', 'S&OP', 'ESG', 'Manutenção'];

export const SESSION_SEED: Session[] = [
  {
    id: 'd1-1',
    title: 'Gêmeos Digitais na Indústria Metal-mecânica',
    speaker: 'Dr. Marcos Silva',
    role: 'Diretor de P&D',
    company: 'Siemens',
    time: '10:00 - 10:45',
    location: 'Auditório A (Robótica)',
    track: 'Automação',
    day: 1,
    dateLabel: '16 Nov',
    capacity: 120,
    registeredCount: 74,
    description:
      'Como implementar digital twins para otimizar processos de usinagem e reduzir o tempo de comissionamento de novas máquinas no piso de fábrica.',
  },
  {
    id: 'd1-2',
    title: 'Descomplicando o Planejamento de S&OP Integrado',
    speaker: 'Amanda Costa',
    role: 'Gerente de Supply Chain',
    company: 'WEG',
    time: '11:15 - 12:00',
    location: 'Auditório B (Gestão)',
    track: 'S&OP',
    day: 1,
    dateLabel: '16 Nov',
    capacity: 90,
    registeredCount: 63,
    description:
      'Boas práticas para alinhar vendas, operações e finanças, reduzindo faltas de estoque e melhorando a acuracidade de previsões.',
  },
  {
    id: 'd1-3',
    title: 'Indústria 4.0 & ESG na prática',
    speaker: 'Roberto Oliveira',
    role: 'VP de Sustentabilidade',
    company: 'Bosch',
    time: '14:00 - 15:00',
    location: 'Auditório Central',
    track: 'ESG',
    day: 1,
    dateLabel: '16 Nov',
    capacity: 180,
    registeredCount: 171,
    description:
      'Como a eficiência energética guiada por dados reduz custos operacionais nas fábricas e contribui para a descarbonização da cadeia metal-mecânica.',
  },
  {
    id: 'd1-4',
    title: 'PPCP de Alta Performance para Fábricas Complexas',
    speaker: 'Lucas Santos',
    role: 'Especialista em PPCP',
    company: 'Bosch Rexroth',
    time: '15:30 - 16:15',
    location: 'Auditório B (Gestão)',
    track: 'PPCP',
    day: 1,
    dateLabel: '16 Nov',
    capacity: 90,
    registeredCount: 51,
    description:
      'Planejamento, programação e controle de produção eficientes sob alta variabilidade e cenários complexos com apoio de software integrado.',
  },
  {
    id: 'd1-5',
    title: 'Manutenção Preditiva com Sensores IoT',
    speaker: 'Felipe Melo',
    role: 'Coordenador de Confiabilidade',
    company: 'Schneider Electric',
    time: '16:45 - 17:30',
    location: 'Auditório A (Robótica)',
    track: 'Manutenção',
    day: 1,
    dateLabel: '16 Nov',
    capacity: 120,
    registeredCount: 88,
    description:
      'Estudo de caso da aplicação de sensores de vibração e análise inteligente de dados para prever falhas em compressores de ar e esteiras críticas.',
  },
  {
    id: 'd2-1',
    title: 'Automação Flexível e Células de Solda Automatizadas',
    speaker: 'Eng. Ricardo Dias',
    role: 'Líder de Projetos',
    company: 'ABB Robotics',
    time: '09:30 - 10:15',
    location: 'Auditório A (Robótica)',
    track: 'Automação',
    day: 2,
    dateLabel: '17 Nov',
    capacity: 120,
    registeredCount: 66,
    description:
      'Estratégias de programação rápida e robôs colaborativos para permitir troca rápida de lote em células robotizadas de solda.',
  },
  {
    id: 'd2-2',
    title: 'Descarbonização e Gestão de Resíduos Industriais',
    speaker: 'Patricia Klock',
    role: 'Diretora de ESG',
    company: 'Schneider',
    time: '11:00 - 11:45',
    location: 'Auditório Central',
    track: 'ESG',
    day: 2,
    dateLabel: '17 Nov',
    capacity: 180,
    registeredCount: 97,
    description:
      'Melhores práticas corporativas e ferramentas de software para mensurar e reportar a pegada de carbono do escopo 1 e 2 no Sul do país.',
  },
  {
    id: 'd2-3',
    title: 'O Papel do Planejamento Dinâmico na Indústria 4.0',
    speaker: 'Guilherme Rosa',
    role: 'Head de Planejamento',
    company: 'TechPro Systems',
    time: '14:30 - 15:15',
    location: 'Auditório B (Gestão)',
    track: 'PPCP',
    day: 2,
    dateLabel: '17 Nov',
    capacity: 90,
    registeredCount: 72,
    description:
      'Utilizando machine learning e dados em tempo real no PPCP para responder instantaneamente a quebras de máquina ou atrasos logísticos.',
  },
  {
    id: 'd3-1',
    title: 'S&OP Orientado por IA: O Futuro das Cadeias Integradas',
    speaker: 'Dr. Arthur Mendes',
    role: 'Cientista Chefe de Dados',
    company: 'NVIDIA Industrial',
    time: '10:00 - 11:00',
    location: 'Auditório Central',
    track: 'S&OP',
    day: 3,
    dateLabel: '18 Nov',
    capacity: 180,
    registeredCount: 144,
    description:
      'Modelagem preditiva avançada e computação acelerada aplicadas na previsão integrada de oferta e demanda de matérias-primas.',
  },
  {
    id: 'd3-2',
    title: 'Indicadores Globais de Manutenção: OEE & MTBF',
    speaker: 'Rodrigo Fonseca',
    role: 'Gerente Geral de Operações',
    company: 'WEG Automação',
    time: '14:00 - 14:45',
    location: 'Auditório A (Robótica)',
    track: 'Manutenção',
    day: 3,
    dateLabel: '18 Nov',
    capacity: 120,
    registeredCount: 83,
    description:
      'Como estabelecer metas realistas de confiabilidade e monitorar paradas não planejadas para maximizar a eficiência global de equipamentos fabris.',
  },
  {
    id: 'd4-1',
    title: 'Futuro da Indústria no Sul: Visão 2030',
    speaker: 'Painel C-Level',
    role: 'Executivos Convidados',
    company: 'Joinville Business Park',
    time: '15:00 - 16:30',
    location: 'Auditório Central',
    track: 'Automação',
    day: 4,
    dateLabel: '19 Nov',
    capacity: 180,
    registeredCount: 122,
    description:
      'Discussão aberta sobre as macrotendências, gargalos regulatórios, adoção de IA generativa e formação de talentos técnicos na região Sul.',
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
      capacity: typeof data.capacity === 'number' ? data.capacity : 0,
      registeredCount: typeof data.registeredCount === 'number' ? data.registeredCount : 0,
    };
  },
};
