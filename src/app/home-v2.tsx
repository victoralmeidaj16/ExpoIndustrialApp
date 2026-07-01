import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { Radius } from '@/constants/theme';
import { useEventConfig } from '@/features/event/use-event-config';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { useSessions } from '@/features/agenda/use-sessions';
import { useVisitorProfile } from '@/features/visitor/visitor-profile';

type IconName = keyof typeof Ionicons.glyphMap;

// Paleta clara desta tela (espelha o board de design "showcase").
const NAVY = '#0C2345';
const NAVY_DEEP = '#071A33';
const GOLD = '#C9A24C';
const GOLD_LIGHT = '#D8B25A';
const MUTED = '#94a3b8';
const BORDER = '#eef1f6';

const OVERVIEW = [
  { value: '10.000+', label: 'visitantes', accent: NAVY },
  { value: '200+', label: 'expositores', accent: NAVY },
  { value: '8', label: 'eventos', accent: GOLD },
];

const ACTIONS: { icon: IconName; label: string; hint: string; route: string }[] = [
  { icon: 'qr-code-outline', label: 'Meu Crachá', hint: 'Escanear', route: '/profile' },
  { icon: 'calendar-outline', label: 'Agenda', hint: 'Programação', route: '/agenda' },
  { icon: 'navigate-outline', label: 'Navegar', hint: 'Mapa smart', route: '/map' },
];

/** Iniciais do palestrante para o avatar (ex.: "Dr. Elena Santos" → "ES"). */
function initials(name: string): string {
  const parts = name.replace(/^(Dr\.?|Dra\.?|Eng\.?)\s+/i, '').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

function firstName(name?: string): string {
  const n = (name ?? '').trim().split(/\s+/)[0];
  return n || 'Executivo';
}

export default function Home2Screen() {
  const insets = useSafeAreaInsets();
  const { event } = useEventConfig();
  const { exhibitors } = useExhibitors();
  const { sessions } = useSessions();
  const { profile } = useVisitorProfile();

  // Até 2 expositores publicados com logo/nome para o bloco de destaque.
  const featured = useMemo(
    () => exhibitors.filter((e) => e.status !== 'draft').slice(0, 2),
    [exhibitors],
  );

  const nextSession = sessions[0];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* 1. HEADER (navy) */}
        <LinearGradient
          colors={[NAVY, NAVY_DEEP]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 14 }]}>
          {/* Círculos decorativos (blueprint) */}
          <View style={[styles.decoCircle, { width: 180, height: 180 }]} />
          <View style={[styles.decoCircle, { width: 120, height: 120 }]} />

          <View style={styles.headerTopRow}>
            <Pressable style={styles.iconButton} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push('/connections')}
              hitSlop={8}>
              <Ionicons name="notifications-outline" size={17} color="#fff" />
              <View style={styles.notifDot} />
            </Pressable>
          </View>

          <Text style={styles.brand}>
            EXPO<Text style={{ color: GOLD_LIGHT }}>INDUSTRIAL</Text> SUL
          </Text>

          <Text style={styles.welcome}>Bem-vindo, {firstName(profile?.name)}!</Text>
          <Text style={styles.welcomeSub}>{event.tagline || 'Seu dia num relance.'}</Text>
        </LinearGradient>

        {/* 2. EVENT OVERVIEW (sobreposto ao header) */}
        <View style={styles.body}>
          <View style={styles.overviewCard}>
            <Text style={styles.cardTitle}>Visão do Evento</Text>
            <View style={styles.overviewRow}>
              {OVERVIEW.map((item, i) => (
                <View key={item.label} style={styles.overviewCellWrap}>
                  {i > 0 && <View style={styles.overviewDivider} />}
                  <View style={styles.overviewCell}>
                    <Text style={[styles.overviewVal, { color: item.accent }]}>{item.value}</Text>
                    <Text style={styles.overviewLbl}>{item.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 3. AI INSIGHT */}
          <LinearGradient
            colors={['#fbf6e9', '#f8f1df']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.insightPill}>
            <View style={styles.insightIcon}>
              <Ionicons name="bulb-outline" size={15} color={GOLD} />
            </View>
            <Text style={styles.insightText}>
              <Text style={styles.insightLabel}>Match IA: </Text>
              Conecte-se com a Siemens em soluções de Indústria 4.0.
            </Text>
          </LinearGradient>

          {/* 4. AÇÕES RÁPIDAS */}
          <View style={styles.actionsRow}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                style={styles.actionCard}
                onPress={() => router.push(a.route as never)}>
                <View style={styles.actionIcon}>
                  <Ionicons name={a.icon} size={20} color={NAVY} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Text style={styles.actionHint}>{a.hint}</Text>
              </Pressable>
            ))}
          </View>

          {/* 5. EXPOSITORES EM DESTAQUE */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expositores em Destaque</Text>
              <Pressable onPress={() => router.push('/exhibitors')} hitSlop={8}>
                <Text style={styles.sectionLink}>Ver todos</Text>
              </Pressable>
            </View>
            <View style={styles.exhibitorRow}>
              {featured.length > 0 ? (
                featured.map((e) => (
                  <Pressable
                    key={e.id}
                    style={styles.exhibitorBox}
                    onPress={() => router.push(`/exhibitor/${e.id}` as never)}>
                    <ExhibitorLogo logoUrl={e.logoUrl} logo={e.logo} style={styles.exhibitorLogo} textSize={13} />
                  </Pressable>
                ))
              ) : (
                <>
                  <View style={styles.exhibitorBox}>
                    <Text style={styles.logoSap}>SAP</Text>
                  </View>
                  <View style={styles.exhibitorBox}>
                    <Text style={styles.logoSiemens}>SIEMENS</Text>
                  </View>
                </>
              )}
              <Pressable
                style={[styles.exhibitorBox, styles.exhibitorMore]}
                onPress={() => router.push('/exhibitors')}>
                <Ionicons name="chevron-forward" size={18} color="#c4cdda" />
              </Pressable>
            </View>
          </View>

          {/* 6. PRÓXIMA NA AGENDA */}
          {nextSession && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Próxima na Agenda</Text>
                <Pressable onPress={() => router.push('/agenda')} hitSlop={8}>
                  <Text style={styles.sectionLink}>Ver agenda</Text>
                </Pressable>
              </View>
              <Pressable style={styles.meetingCard} onPress={() => router.push('/agenda')}>
                <View style={styles.meetingAvatar}>
                  <Text style={styles.meetingAvatarText}>{initials(nextSession.speaker)}</Text>
                </View>
                <View style={styles.meetingInfo}>
                  <Text style={styles.meetingName} numberOfLines={1}>{nextSession.title}</Text>
                  <Text style={styles.meetingMeta} numberOfLines={1}>
                    {nextSession.speaker} · {nextSession.time}
                  </Text>
                </View>
                <View style={styles.meetingBtn}>
                  <Text style={styles.meetingBtnText}>Ver</Text>
                </View>
              </Pressable>
            </View>
          )}

          <View style={{ height: insets.bottom + 24 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 8 },

  header: {
    paddingHorizontal: 22,
    paddingBottom: 58,
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    right: -50,
    bottom: -70,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,162,76,0.25)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: NAVY,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  welcome: {
    fontSize: 25,
    fontWeight: '700',
    color: '#fff',
    marginTop: 18,
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.66)',
    marginTop: 4,
  },

  body: {
    paddingHorizontal: 16,
    marginTop: -42,
    gap: 14,
  },

  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    shadowColor: NAVY_DEEP,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 4,
  },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: NAVY_DEEP, marginBottom: 14 },
  overviewRow: { flexDirection: 'row', alignItems: 'center' },
  overviewCellWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  overviewDivider: { width: 1, height: 32, backgroundColor: BORDER },
  overviewCell: { flex: 1, alignItems: 'center' },
  overviewVal: { fontSize: 19, fontWeight: '700' },
  overviewLbl: { fontSize: 11, color: MUTED, marginTop: 2 },

  insightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f0e4c4',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: { flex: 1, fontSize: 12, color: '#7a6320', lineHeight: 16.5 },
  insightLabel: { fontWeight: '700', color: '#8a6d15' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f4f7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12.5, fontWeight: '700', color: NAVY_DEEP },
  actionHint: { fontSize: 10, color: MUTED },

  section: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: NAVY_DEEP },
  sectionLink: { fontSize: 12, fontWeight: '700', color: GOLD },

  exhibitorRow: { flexDirection: 'row', gap: 10 },
  exhibitorBox: {
    flex: 1,
    height: 58,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exhibitorLogo: { width: '82%', height: '70%', backgroundColor: 'transparent' },
  exhibitorMore: { flex: 0, width: 40, backgroundColor: '#f8fafc' },
  logoSap: { color: '#0a4ba3', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  logoSiemens: { color: '#009999', fontWeight: '700', fontSize: 14 },

  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  meetingAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingAvatarText: { color: GOLD_LIGHT, fontWeight: '700', fontSize: 14 },
  meetingInfo: { flex: 1, minWidth: 0 },
  meetingName: { fontSize: 13.5, fontWeight: '700', color: NAVY_DEEP },
  meetingMeta: { fontSize: 11.5, color: MUTED, marginTop: 2 },
  meetingBtn: {
    backgroundColor: NAVY,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
  },
  meetingBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
