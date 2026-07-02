import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenHeader, TAB_BAR_CLEARANCE } from '@/components/ui-kit';
import { Light } from '@/constants/theme';
import { TRACKS, type Session } from '@/features/agenda/session';
import { useAgendaPreferences, useSessions } from '@/features/agenda/use-sessions';

const ALL_TRACKS = 'Todas';
const FAVORITES_TRACK = 'Favoritos';
const TRACK_FILTERS = [ALL_TRACKS, ...TRACKS, FAVORITES_TRACK] as const;

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

function seatsLeft(session: Session, registered: boolean) {
  const left = Math.max(0, session.capacity - session.registeredCount);
  return registered ? Math.max(1, left) : left;
}

export default function AgendaScreen() {
  const { sessions, loading, source } = useSessions();
  const {
    favoriteIds,
    reminderIds,
    registeredIds,
    toggleFavorite,
    toggleReminder,
    toggleRegistration,
  } = useAgendaPreferences(sessions);

  const days = useMemo(
    () =>
      Array.from(new Map(sessions.map((session) => [session.day, session.dateLabel])).entries()).map(
        ([num, date]) => ({ num, label: `Dia ${num}`, date }),
      ),
    [sessions],
  );

  const [selectedDay, setSelectedDay] = useState(days[0]?.num ?? 1);
  const [selectedTrack, setSelectedTrack] = useState<(typeof TRACK_FILTERS)[number]>(ALL_TRACKS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeDay = days.some((day) => day.num === selectedDay) ? selectedDay : days[0]?.num ?? 1;
  const filteredSessions = sessions.filter((session) => {
    if (selectedTrack === FAVORITES_TRACK) return favoriteIds.includes(session.id);
    const matchesDay = session.day === activeDay;
    if (selectedTrack === ALL_TRACKS) return matchesDay;
    return matchesDay && session.track === selectedTrack;
  });

  async function onToggleRegistration(session: Session) {
    const result = await toggleRegistration(session.id);
    if (result === 'full') {
      Alert.alert('Sessão lotada', 'Não há vagas disponíveis para esta palestra.');
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Agenda"
        subtitle={source === 'firestore' ? 'Grade em tempo real' : 'Grade de demonstração'}
        right={
          <View style={styles.headerBadge}>
            {loading ? (
              <ActivityIndicator size="small" color={Light.goldLight} />
            ) : (
              <Ionicons name="time-outline" size={14} color={Light.goldLight} />
            )}
            <Text style={styles.headerBadgeText}>{sessions.length} sessões</Text>
          </View>
        }
      />

      {/* Controles (dias + trilhas) em card claro sobreposto */}
      <View style={styles.controls}>
        <View style={styles.daysContainer}>
          {days.map((day) => {
            const isActive = activeDay === day.num;
            return (
              <Pressable
                key={day.num}
                style={[styles.dayButton, isActive && styles.dayButtonActive]}
                onPress={() => setSelectedDay(day.num)}>
                <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{day.label}</Text>
                <Text style={[styles.dateText, isActive && styles.dateTextActive]}>{day.date}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tracksScroll}>
          {TRACK_FILTERS.map((track) => {
            const isActive = selectedTrack === track;
            return (
              <Pressable
                key={track}
                style={[styles.trackChip, isActive && styles.trackChipActive, track === FAVORITES_TRACK && styles.favChip]}
                onPress={() => setSelectedTrack(track)}>
                {track === FAVORITES_TRACK && (
                  <Ionicons
                    name={isActive ? 'star' : 'star-outline'}
                    size={12}
                    color={isActive ? '#fff' : Light.gold}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[styles.trackText, isActive && styles.trackTextActive]}>{track}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.sessionList, { paddingBottom: TAB_BAR_CLEARANCE }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const isFav = favoriteIds.includes(item.id);
          const hasReminder = reminderIds.includes(item.id);
          const isRegistered = registeredIds.includes(item.id);
          const accentColor = getTrackColor(item.track);
          const left = seatsLeft(item, isRegistered);
          const full = !isRegistered && left === 0;

          return (
            <View style={[styles.sessionCard, isFav && styles.sessionCardFav]}>
              <Pressable
                style={styles.cardHeader}
                onPress={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}>
                <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

                <View style={styles.cardInfo}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <View style={[styles.trackLabel, { backgroundColor: accentColor + '1A' }]}>
                      <Text style={[styles.trackLabelText, { color: accentColor }]}>
                        {item.track.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sessionTitle}>{item.title}</Text>

                  <View style={styles.speakerRow}>
                    <Ionicons name="person-circle-outline" size={16} color={Light.textMuted} />
                    <Text style={styles.speakerText}>
                      {item.speaker} · <Text style={styles.companyText}>{item.company}</Text>
                    </Text>
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={Light.textMuted} />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable style={styles.actionBtn} onPress={() => toggleFavorite(item.id)}>
                    <Ionicons
                      name={isFav ? 'star' : 'star-outline'}
                      size={20}
                      color={isFav ? Light.gold : Light.textFaint}
                    />
                  </Pressable>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Light.textMuted}
                    style={{ marginTop: 8 }}
                  />
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.roleText}>
                    {item.role} na <Text style={{ color: Light.navyDeep, fontWeight: '700' }}>{item.company}</Text>
                  </Text>
                  <Text style={styles.descriptionText}>{item.description}</Text>

                  <View style={styles.capacityRow}>
                    <View style={[styles.statusPill, full && styles.statusPillDanger]}>
                      <Ionicons
                        name={full ? 'close-circle-outline' : 'people-outline'}
                        size={14}
                        color={full ? Light.danger : Light.gold}
                      />
                      <Text style={[styles.statusPillText, full && styles.statusPillTextDanger]}>
                        {full ? 'Lotada' : `${left} vagas disponíveis`}
                      </Text>
                    </View>
                    {hasReminder && (
                      <View style={styles.statusPill}>
                        <Ionicons name="notifications" size={14} color={Light.gold} />
                        <Text style={styles.statusPillText}>Lembrete ativo</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.buttonRow}>
                    <Pressable
                      style={[styles.secondaryBtn, isRegistered && styles.secondaryBtnActive]}
                      onPress={() => onToggleRegistration(item)}>
                      <Ionicons
                        name={isRegistered ? 'checkmark-circle' : 'add-circle-outline'}
                        size={14}
                        color={isRegistered ? '#fff' : Light.gold}
                      />
                      <Text style={[styles.secondaryBtnText, isRegistered && styles.secondaryBtnTextActive]}>
                        {isRegistered ? 'Inscrito' : 'Inscrever-se'}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn} onPress={() => toggleReminder(item.id)}>
                      <Ionicons
                        name={hasReminder ? 'notifications' : 'notifications-outline'}
                        size={14}
                        color={Light.gold}
                      />
                      <Text style={styles.secondaryBtnText}>{hasReminder ? 'Remover lembrete' : 'Lembrete'}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={() => router.push({ pathname: '/map', params: { search: item.location } })}>
                      <Ionicons name="map-outline" size={14} color={Light.gold} />
                      <Text style={styles.secondaryBtnText}>Ver mapa</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={selectedTrack === FAVORITES_TRACK ? 'star-outline' : 'calendar-outline'}
              size={48}
              color={Light.textFaint}
            />
            <Text style={styles.emptyTitle}>Nenhuma palestra encontrada</Text>
            <Text style={styles.emptySubtitle}>
              {selectedTrack === FAVORITES_TRACK
                ? 'Você ainda não adicionou nenhuma palestra aos seus favoritos.'
                : 'Não há palestras agendadas para esta trilha neste dia.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  headerBadgeText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },

  controls: {
    marginTop: -30,
    marginHorizontal: 16,
    backgroundColor: Light.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Light.border,
    paddingVertical: 12,
    gap: 10,
    shadowColor: Light.navyDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  daysContainer: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Light.surfaceAlt,
    borderWidth: 1,
    borderColor: Light.border,
  },
  dayButtonActive: { backgroundColor: Light.navy, borderColor: Light.navy },
  dayText: { color: Light.textMuted, fontSize: 13, fontWeight: '700' },
  dayTextActive: { color: '#fff' },
  dateText: { color: Light.textFaint, fontSize: 10, marginTop: 2 },
  dateTextActive: { color: Light.goldLight },

  tracksScroll: { paddingHorizontal: 12, gap: 8 },
  trackChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Light.surfaceAlt,
    borderWidth: 1,
    borderColor: Light.border,
  },
  trackChipActive: { backgroundColor: Light.navy, borderColor: Light.navy },
  favChip: { flexDirection: 'row', alignItems: 'center' },
  trackText: { color: Light.textMuted, fontSize: 12, fontWeight: '600' },
  trackTextActive: { color: '#fff', fontWeight: '700' },

  sessionList: { padding: 16, gap: 12 },
  sessionCard: {
    backgroundColor: Light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Light.border,
    overflow: 'hidden',
  },
  sessionCardFav: { borderColor: 'rgba(201,162,76,0.5)' },
  cardHeader: { flexDirection: 'row', paddingRight: 12 },
  cardAccent: { width: 5, alignSelf: 'stretch' },
  cardInfo: { flex: 1, paddingVertical: 12, paddingLeft: 12, gap: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { color: Light.gold, fontSize: 13, fontWeight: '800' },
  trackLabel: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  trackLabelText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6 },
  sessionTitle: { color: Light.navyDeep, fontSize: 15.5, fontWeight: '700', lineHeight: 21 },
  speakerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  speakerText: { color: Light.navyDeep, fontSize: 13, fontWeight: '600' },
  companyText: { color: Light.textMuted, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { color: Light.textMuted, fontSize: 12 },
  cardActions: { alignItems: 'center', paddingVertical: 12, justifyContent: 'flex-start', width: 32 },
  actionBtn: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  detailsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingTop: 12,
    gap: 10,
  },
  roleText: { color: Light.textMuted, fontSize: 12, fontWeight: '600' },
  descriptionText: { color: Light.textMuted, fontSize: 13, lineHeight: 18.5 },
  capacityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    backgroundColor: '#FBF6E9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusPillDanger: { borderColor: 'rgba(239,68,68,0.28)', backgroundColor: 'rgba(239,68,68,0.08)' },
  statusPillText: { color: Light.goldTextStrong, fontSize: 11.5, fontWeight: '700' },
  statusPillTextDanger: { color: Light.danger },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Light.border,
    backgroundColor: Light.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secondaryBtnActive: { backgroundColor: Light.navy, borderColor: Light.navy },
  secondaryBtnText: { color: Light.navyDeep, fontSize: 11.5, fontWeight: '700' },
  secondaryBtnTextActive: { color: '#fff' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { color: Light.navyDeep, fontSize: 15, fontWeight: '700', marginTop: 8 },
  emptySubtitle: {
    color: Light.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
