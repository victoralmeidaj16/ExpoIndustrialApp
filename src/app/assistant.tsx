import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Light, Radius, Spacing } from '@/constants/theme';
import { type Session } from '@/features/agenda/session';
import { useSessions } from '@/features/agenda/use-sessions';
import { type Exhibitor } from '@/features/exhibitors/exhibitor';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';

type AssistantAction = {
  label: string;
  route: string;
  params?: Record<string, string>;
};

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  action?: AssistantAction;
};

type KnowledgeDoc =
  | {
      kind: 'exhibitor';
      id: string;
      title: string;
      body: string;
      exhibitor: Exhibitor;
    }
  | {
      kind: 'session';
      id: string;
      title: string;
      body: string;
      session: Session;
    };

type AssistantResponse = {
  text: string;
  action?: AssistantAction;
};

const SUGGESTIONS = [
  'Onde fica o estande da Siemens?',
  'Quais palestras falam de automação?',
  'Mostre expositores de eficiência energética',
  'Tem palestra no Auditório Central?',
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2);
}

function scoreDoc(doc: KnowledgeDoc, tokens: string[]) {
  const title = normalize(doc.title);
  const body = normalize(doc.body);
  return tokens.reduce((score, token) => {
    if (title.includes(token)) return score + 4;
    if (body.includes(token)) return score + 1;
    return score;
  }, 0);
}

function buildDocs(exhibitors: Exhibitor[], sessions: Session[]): KnowledgeDoc[] {
  return [
    ...exhibitors.map((exhibitor) => ({
      kind: 'exhibitor' as const,
      id: exhibitor.id,
      title: `${exhibitor.company} ${exhibitor.stand}`,
      body: [
        exhibitor.company,
        exhibitor.logo,
        exhibitor.stand,
        exhibitor.area,
        exhibitor.category,
        exhibitor.industry,
        exhibitor.about,
        ...exhibitor.products,
        ...(exhibitor.segments ?? []),
        ...(exhibitor.targetAudience ?? []),
        ...(exhibitor.lookingFor ?? []),
        ...(exhibitor.keywords ?? []),
      ].join(' '),
      exhibitor,
    })),
    ...sessions.map((session) => ({
      kind: 'session' as const,
      id: session.id,
      title: `${session.title} ${session.company}`,
      body: [
        session.title,
        session.speaker,
        session.role,
        session.company,
        session.time,
        session.location,
        session.track,
        session.dateLabel,
        session.description,
      ].join(' '),
      session,
    })),
  ];
}

function formatSession(session: Session) {
  return `${session.title}, ${session.time}, ${session.location}, com ${session.speaker}`;
}

function answerQuestion(question: string, docs: KnowledgeDoc[]): AssistantResponse {
  const tokens = tokenize(question);
  const normalizedQuestion = normalize(question);
  const wantsAgenda = /agenda|palestra|sessao|sessão|horario|horário|auditorio|auditório/.test(normalizedQuestion);
  const wantsMap = /onde|mapa|fica|estande|stand|rota|chegar|local/.test(normalizedQuestion);
  const wantsExhibitor = /expositor|empresa|fornecedor|produto|solucao|solução|estande|stand/.test(normalizedQuestion);

  const ranked = docs
    .map((doc) => ({ doc, score: scoreDoc(doc, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const topExhibitors = ranked.filter((item) => item.doc.kind === 'exhibitor').slice(0, 3);
  const topSessions = ranked.filter((item) => item.doc.kind === 'session').slice(0, 3);

  if (wantsAgenda && topSessions.length) {
    const sessions = topSessions.map((item) => (item.doc.kind === 'session' ? item.doc.session : null)).filter(Boolean) as Session[];
    const text = `Encontrei ${sessions.length} sessão${sessions.length > 1 ? 'ões' : ''} relevante${sessions.length > 1 ? 's' : ''}: ${sessions
      .map(formatSession)
      .join(' · ')}.`;
    return {
      text,
      action: { label: 'Abrir agenda', route: '/agenda' },
    };
  }

  if ((wantsMap || wantsExhibitor) && topExhibitors.length) {
    const exhibitors = topExhibitors
      .map((item) => (item.doc.kind === 'exhibitor' ? item.doc.exhibitor : null))
      .filter(Boolean) as Exhibitor[];
    const main = exhibitors[0];
    const alternatives = exhibitors
      .slice(1)
      .map((item) => `${item.company} (${item.stand})`)
      .join(' · ');
    return {
      text: `${main.company} está em ${main.stand}, área ${main.area}. Setor: ${main.industry}. ${main.about}${
        alternatives ? ` Também encontrei: ${alternatives}.` : ''
      }`,
      action: {
        label: wantsMap ? 'Ver no mapa' : 'Abrir expositor',
        route: wantsMap ? '/map' : `/exhibitor/${main.id}`,
        params: wantsMap ? { search: main.company } : undefined,
      },
    };
  }

  if (topExhibitors.length || topSessions.length) {
    const parts = [
      ...topExhibitors.map((item) =>
        item.doc.kind === 'exhibitor'
          ? `${item.doc.exhibitor.company}: ${item.doc.exhibitor.industry}, ${item.doc.exhibitor.stand}`
          : '',
      ),
      ...topSessions.map((item) => (item.doc.kind === 'session' ? formatSession(item.doc.session) : '')),
    ].filter(Boolean);
    return {
      text: `Achei estes resultados relacionados: ${parts.join(' · ')}.`,
      action: { label: topExhibitors.length ? 'Ver expositores no mapa' : 'Abrir agenda', route: topExhibitors.length ? '/map' : '/agenda' },
    };
  }

  return {
    text:
      'Não encontrei um resultado direto nos expositores ou na agenda carregada. Tente buscar por nome da empresa, produto, setor, auditório ou trilha técnica.',
  };
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { exhibitors, loading: loadingExhibitors, source: exhibitorsSource } = useExhibitors();
  const { sessions, loading: loadingSessions, source: sessionsSource } = useSessions();
  const docs = useMemo(() => buildDocs(exhibitors, sessions), [exhibitors, sessions]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Olá. Posso consultar os expositores publicados, a agenda e o mapa da feira para responder perguntas sobre empresas, estandes, produtos, trilhas e horários.',
      timestamp: '10:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const messageIdRef = useRef(2);

  const loadingKnowledge = loadingExhibitors || loadingSessions;

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: `m-${messageIdRef.current++}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    const response = loadingKnowledge
      ? { text: 'Ainda estou carregando a base de expositores e agenda. Tente novamente em alguns segundos.' }
      : answerQuestion(textToSend, docs);

    setTimeout(() => {
      const aiMsg: Message = {
        id: `m-${messageIdRef.current++}`,
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, 250);
  };

  const handleAction = (action: AssistantAction) => {
    if (action.params) {
      router.push({ pathname: action.route as never, params: action.params } as never);
      return;
    }
    router.push(action.route as never);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Light.textNavy} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Assistant Industrial</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, loadingKnowledge && styles.statusDotLoading]} />
            <Text style={styles.statusText}>
              {loadingKnowledge
                ? 'Carregando dados'
                : `${exhibitors.length} expositores · ${sessions.length} sessões`}
            </Text>
          </View>
        </View>
        <View style={styles.headerIconBtn}>
          <Ionicons name="sparkles" size={18} color={Light.gold} />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.sender === 'user' ? styles.userRow : styles.aiRow]}>
            {item.sender === 'ai' && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={13} color={Light.gold} />
              </View>
            )}
            <View style={{ flex: 1, alignItems: item.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.aiText]}>
                  {item.text}
                </Text>
                {item.action && (
                  <Pressable style={styles.actionButton} onPress={() => handleAction(item.action!)}>
                    <Ionicons name="compass-outline" size={16} color={Light.gold} />
                    <Text style={styles.actionButtonText}>{item.action.label}</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingIndicatorContainer}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={13} color={Light.gold} />
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={Light.gold} />
                <Text style={styles.typingText}>Consultando agenda e mapa...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {messages.length === 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Perguntas sugeridas:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {SUGGESTIONS.map((suggestion) => (
              <Pressable key={suggestion} style={styles.suggestionChip} onPress={() => handleSend(suggestion)}>
                <Ionicons name="chatbubble-ellipses-outline" size={13} color={Light.textMuted} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Pergunte sobre estandes, salas, horários..."
            placeholderTextColor={Light.textMuted}
            style={styles.input}
            onSubmitEditing={() => handleSend(inputText)}
          />
          <Pressable
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            disabled={!inputText.trim()}
            onPress={() => handleSend(inputText)}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
    backgroundColor: Light.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Light.iconSoftBg,
    borderWidth: 1,
    borderColor: Light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { color: Light.textNavy, fontSize: 16.5, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Light.success },
  statusDotLoading: { backgroundColor: Light.warning },
  statusText: { color: Light.textMuted, fontSize: 11.5, fontWeight: '600' },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Light.iconSoftBg,
    borderWidth: 1,
    borderColor: Light.border,
  },
  messageList: { padding: Spacing.four, gap: Spacing.three },
  messageRow: { flexDirection: 'row', gap: 10, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end' },
  aiRow: { alignSelf: 'flex-start' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md },
  userBubble: {
    backgroundColor: Light.navy,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderBottomLeftRadius: 2,
  },
  messageText: { fontSize: 14.5, lineHeight: 20 },
  userText: { color: '#FFFFFF', fontWeight: '500' },
  aiText: { color: Light.text },
  timestamp: { color: Light.textMuted, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Light.surfaceAlt,
    borderWidth: 1,
    borderColor: Light.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  actionButtonText: { color: Light.navyDeep, fontSize: 12.5, fontWeight: '700' },
  typingIndicatorContainer: { flexDirection: 'row', gap: 10, alignSelf: 'flex-start', alignItems: 'center' },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderBottomLeftRadius: 2,
  },
  typingText: { color: Light.textMuted, fontSize: 13 },
  suggestionsContainer: { paddingVertical: Spacing.two, borderTopWidth: 1, borderTopColor: Light.border, backgroundColor: Light.bg },
  suggestionsTitle: {
    color: Light.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
    paddingHorizontal: Spacing.four,
    marginBottom: 8,
  },
  suggestionsScroll: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  suggestionText: { color: Light.textNavy, fontSize: 12.5 },
  inputContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    backgroundColor: Light.bg,
    borderTopWidth: 1,
    borderTopColor: Light.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: Radius.pill,
    paddingLeft: 16,
    paddingRight: 6,
    height: 48,
  },
  input: { flex: 1, color: Light.text, fontSize: 14, paddingVertical: 8 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Light.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
