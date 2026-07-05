import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderIconButton, TAB_BAR_CLEARANCE } from '@/components/ui-kit';
import { ScalePressable } from '@/components/ScalePressable';
import { Light, Radius, Spacing } from '@/constants/theme';
import { getSessionImageSource } from '@/features/agenda/session';
import { useAgendaPreferences, useSessions } from '@/features/agenda/use-sessions';

function getTrackColor(track: string) {
  switch (track) {
    case 'Automação':
      return '#2F6BFF';
    case 'PPCP':
      return Light.gold;
    case 'S&OP':
      return '#00A9C7';
    case 'ESG':
      return '#159A5B';
    case 'Manutenção':
      return '#EF4444';
    default:
      return Light.textMuted;
  }
}

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, loading } = useSessions();
  const {
    favoriteIds,
    reminderIds,
    registeredIds,
    toggleFavorite,
    toggleReminder,
    toggleRegistration,
  } = useAgendaPreferences(sessions);

  const session = sessions.find((item) => item.id === id);

  if (!session) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        {loading ? (
          <ActivityIndicator color={Light.gold} />
        ) : (
          <>
            <Ionicons name="calendar-outline" size={40} color={Light.textMuted} />
            <Text style={styles.emptyTitle}>Evento não encontrado.</Text>
            <ScalePressable style={styles.backButtonInline} onPress={() => router.back()}>
              <Text style={styles.backButtonInlineText}>Voltar</Text>
            </ScalePressable>
          </>
        )}
      </View>
    );
  }

  const accentColor = getTrackColor(session.track);
  const sessionId = session.id;
  const isFav = favoriteIds.includes(session.id);
  const hasReminder = reminderIds.includes(session.id);
  const isRegistered = registeredIds.includes(session.id);
  const seatsLeft = Math.max(0, session.capacity - session.registeredCount);
  const full = !isRegistered && seatsLeft === 0;

  async function onToggleRegistration() {
    const result = await toggleRegistration(sessionId);
    if (result === 'full') {
      Alert.alert('Sessão lotada', 'Não há vagas disponíveis para este evento.');
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}>
        <View style={[styles.heroWrap, { paddingTop: insets.top + 12 }]}>
          <View style={styles.hero}>
            <Image source={getSessionImageSource(session)} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(7,26,51,0.18)', 'rgba(7,26,51,0.62)', 'rgba(7,26,51,0.96)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTop}>
            <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
            <HeaderIconButton
              icon={isFav ? 'star' : 'star-outline'}
              onPress={() => toggleFavorite(session.id)}
            />
          </View>

          <View style={styles.heroContent}>
            <View style={[styles.trackPill, { backgroundColor: accentColor }]}>
              <Text style={styles.trackPillText}>{session.track.toUpperCase()}</Text>
            </View>
            <Text style={styles.title}>{session.title}</Text>
            <Text style={styles.subtitle}>
              {session.dateLabel} · {session.time} · {session.location}
            </Text>
          </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoCard}>
            <View style={styles.speakerRow}>
              <View style={styles.speakerIcon}>
                <Ionicons name="person-circle-outline" size={24} color={Light.gold} />
              </View>
              <View style={styles.speakerBody}>
                <Text style={styles.speakerName}>{session.speaker}</Text>
                <Text style={styles.speakerMeta}>
                  {session.role} · {session.company}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <Metric icon="location-outline" label="Local" value={session.location} />
              <Metric
                icon={full ? 'close-circle-outline' : 'people-outline'}
                label="Vagas"
                value={full ? 'Lotada' : `${isRegistered ? Math.max(1, seatsLeft) : seatsLeft} disponíveis`}
                danger={full}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Sobre o evento</Text>
          <Text style={styles.description}>{session.description}</Text>

          <View style={styles.actionGrid}>
            <ScalePressable
              style={[styles.primaryAction, isRegistered && styles.primaryActionActive]}
              onPress={onToggleRegistration}>
              <Ionicons
                name={isRegistered ? 'checkmark-circle' : 'add-circle-outline'}
                size={18}
                color={isRegistered ? '#fff' : Light.navyDeep}
              />
              <Text style={[styles.primaryActionText, isRegistered && styles.primaryActionTextActive]}>
                {isRegistered ? 'Inscrito' : 'Inscrever-se'}
              </Text>
            </ScalePressable>

            <ScalePressable style={styles.secondaryAction} onPress={() => toggleReminder(session.id)}>
              <Ionicons
                name={hasReminder ? 'notifications' : 'notifications-outline'}
                size={18}
                color={Light.gold}
              />
              <Text style={styles.secondaryActionText}>
                {hasReminder ? 'Lembrete ativo' : 'Ativar lembrete'}
              </Text>
            </ScalePressable>

            <ScalePressable
              style={styles.secondaryAction}
              onPress={() => router.push({ pathname: '/map', params: { search: session.location } })}>
              <Ionicons name="map-outline" size={18} color={Light.gold} />
              <Text style={styles.secondaryActionText}>Ver no mapa</Text>
            </ScalePressable>
          </View>

          <Text style={styles.sectionTitle}>Materiais</Text>
          <View style={styles.materialsBox}>
            <View style={styles.materialIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={Light.gold} />
            </View>
            <View style={styles.materialBody}>
              <Text style={styles.materialTitle}>Conteúdo exclusivo do evento</Text>
              <Text style={styles.materialText}>
                Apresentações, PDFs e links complementares aparecerão aqui quando forem publicados pela organização.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={16} color={danger ? Light.danger : Light.gold} />
      <View style={styles.metricText}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, danger && styles.metricValueDanger]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  emptyTitle: { color: Light.navyDeep, fontSize: 16, fontWeight: '800' },
  backButtonInline: { paddingHorizontal: 14, paddingVertical: 9 },
  backButtonInlineText: { color: Light.gold, fontWeight: '800' },
  heroWrap: {
    backgroundColor: Light.bg,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  hero: {
    minHeight: 330,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    justifyContent: 'space-between',
    backgroundColor: Light.navy,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroContent: { gap: Spacing.two },
  trackPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  trackPillText: { color: '#fff', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', lineHeight: 36 },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, lineHeight: 19, fontWeight: '700' },
  body: { padding: Spacing.four, gap: Spacing.three, backgroundColor: Light.bg },
  infoCard: {
    backgroundColor: Light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Light.border,
    padding: Spacing.three,
    gap: Spacing.three,
    marginTop: -44,
  },
  speakerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  speakerIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerBody: { flex: 1, gap: 3 },
  speakerName: { color: Light.navyDeep, fontSize: 16, fontWeight: '800' },
  speakerMeta: { color: Light.textMuted, fontSize: 12.5, lineHeight: 17 },
  metricsRow: { gap: Spacing.two },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Light.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.two,
  },
  metricText: { flex: 1, gap: 2 },
  metricLabel: { color: Light.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  metricValue: { color: Light.navyDeep, fontSize: 13, fontWeight: '800' },
  metricValueDanger: { color: Light.danger },
  sectionTitle: { color: Light.navyDeep, fontSize: 17, fontWeight: '900', marginTop: Spacing.two },
  description: { color: Light.textMuted, fontSize: 14, lineHeight: 21 },
  actionGrid: { gap: Spacing.two },
  primaryAction: {
    minHeight: 50,
    borderRadius: Radius.sm,
    backgroundColor: Light.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  primaryActionActive: { backgroundColor: Light.navy },
  primaryActionText: { color: Light.navyDeep, fontSize: 14, fontWeight: '900' },
  primaryActionTextActive: { color: '#fff' },
  secondaryAction: {
    minHeight: 46,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Light.border,
    backgroundColor: Light.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  secondaryActionText: { color: Light.navyDeep, fontSize: 13, fontWeight: '800' },
  materialsBox: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: Light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Light.border,
    padding: Spacing.three,
  },
  materialIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: '#FBF6E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialBody: { flex: 1, gap: 4 },
  materialTitle: { color: Light.navyDeep, fontSize: 14, fontWeight: '900' },
  materialText: { color: Light.textMuted, fontSize: 12.5, lineHeight: 18 },
});
