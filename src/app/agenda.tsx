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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { TRACKS, type Session } from '@/features/agenda/session';
import { useAgendaPreferences, useSessions } from '@/features/agenda/use-sessions';

const ALL_TRACKS = 'Todas';
const FAVORITES_TRACK = 'Favoritos';
const TRACK_FILTERS = [ALL_TRACKS, ...TRACKS, FAVORITES_TRACK] as const;

function getTrackColor(track: string) {
  switch (track) {
    case 'Automação':
      return Brand.techBlue;
    case 'PPCP':
      return Brand.gold;
    case 'S&OP':
      return Brand.cyan;
    case 'ESG':
      return '#22C55E';
    case 'Manutenção':
      return '#EF4444';
    default:
      return Brand.textSecondary;
  }
}

function seatsLeft(session: Session, registered: boolean) {
  const left = Math.max(0, session.capacity - session.registeredCount);
  return registered ? Math.max(1, left) : left;
}

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <View>
          <Text style={styles.headerTitle}>Agenda do Evento</Text>
          <Text style={styles.headerSubtitle}>
            {source === 'firestore' ? 'Grade sincronizada em tempo real' : 'Grade local de demonstração'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          {loading ? (
            <ActivityIndicator size="small" color={Brand.gold} />
          ) : (
            <Ionicons name="time-outline" size={16} color={Brand.gold} />
          )}
          <Text style={styles.headerBadgeText}>{sessions.length} sessões</Text>
        </View>
      </View>

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

      <View style={styles.tracksWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tracksScroll}>
          {TRACK_FILTERS.map((track) => {
            const isActive = selectedTrack === track;
            return (
              <Pressable
                key={track}
                style={[
                  styles.trackChip,
                  isActive && styles.trackChipActive,
                  track === FAVORITES_TRACK && styles.favChip,
                ]}
                onPress={() => setSelectedTrack(track)}>
                {track === FAVORITES_TRACK && (
                  <Ionicons
                    name={isActive ? 'star' : 'star-outline'}
                    size={12}
                    color={isActive ? Brand.bgPrimary : Brand.gold}
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
        contentContainerStyle={[styles.sessionList, { paddingBottom: 110 }]}
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
                    <View style={[styles.trackLabel, { backgroundColor: accentColor + '20' }]}>
                      <Text style={[styles.trackLabelText, { color: accentColor }]}>
                        {item.track.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sessionTitle}>{item.title}</Text>

                  <View style={styles.speakerRow}>
                    <Ionicons name="person-circle-outline" size={16} color={Brand.textSecondary} />
                    <Text style={styles.speakerText}>
                      {item.speaker} · <Text style={styles.companyText}>{item.company}</Text>
                    </Text>
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={Brand.textMuted} />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable style={styles.actionBtn} onPress={() => toggleFavorite(item.id)}>
                    <Ionicons
                      name={isFav ? 'star' : 'star-outline'}
                      size={20}
                      color={isFav ? Brand.gold : Brand.textMuted}
                    />
                  </Pressable>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Brand.textMuted}
                    style={{ marginTop: 8 }}
                  />
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.roleText}>
                    {item.role} na <Text style={{ color: Brand.textPrimary }}>{item.company}</Text>
                  </Text>
                  <Text style={styles.descriptionText}>{item.description}</Text>

                  <View style={styles.capacityRow}>
                    <View style={[styles.statusPill, full && styles.statusPillDanger]}>
                      <Ionicons
                        name={full ? 'close-circle-outline' : 'people-outline'}
                        size={14}
                        color={full ? '#EF4444' : Brand.gold}
                      />
                      <Text style={[styles.statusPillText, full && styles.statusPillTextDanger]}>
                        {full ? 'Lotada' : `${left} vagas disponíveis`}
                      </Text>
                    </View>
                    {hasReminder && (
                      <View style={styles.statusPill}>
                        <Ionicons name="notifications" size={14} color={Brand.gold} />
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
                        color={isRegistered ? Brand.bgPrimary : Brand.gold}
                      />
                      <Text style={[styles.secondaryBtnText, isRegistered && styles.secondaryBtnTextActive]}>
                        {isRegistered ? 'Inscrito' : 'Inscrever-se'}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn} onPress={() => toggleReminder(item.id)}>
                      <Ionicons
                        name={hasReminder ? 'notifications' : 'notifications-outline'}
                        size={14}
                        color={Brand.gold}
                      />
                      <Text style={styles.secondaryBtnText}>{hasReminder ? 'Remover lembrete' : 'Lembrete'}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={() => router.push({ pathname: '/map', params: { search: item.location } })}>
                      <Ionicons name="map-outline" size={14} color={Brand.gold} />
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
              color={Brand.textMuted}
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
  screen: { flex: 1, backgroundColor: Brand.bgPrimary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  headerTitle: { color: Brand.textPrimary, fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: Brand.textSecondary, fontSize: 12, marginTop: 2 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  headerBadgeText: { color: Brand.textPrimary, fontSize: 11, fontWeight: '700' },
  daysContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    gap: 10,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Brand.bgPrimary,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  dayButtonActive: { backgroundColor: '#0E172F', borderColor: 'rgba(47, 107, 255, 0.4)' },
  dayText: { color: Brand.textSecondary, fontSize: 13, fontWeight: '700' },
  dayTextActive: { color: Brand.textPrimary },
  dateText: { color: Brand.textMuted, fontSize: 10, marginTop: 2 },
  dateTextActive: { color: Brand.techBlue },
  tracksWrapper: {
    paddingVertical: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  tracksScroll: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  trackChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgPrimary,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  trackChipActive: { backgroundColor: Brand.techBlue, borderColor: Brand.techBlue },
  favChip: { flexDirection: 'row', alignItems: 'center' },
  trackText: { color: Brand.textSecondary, fontSize: 12, fontWeight: '600' },
  trackTextActive: { color: Brand.textPrimary, fontWeight: '700' },
  sessionList: { padding: Spacing.four, gap: Spacing.three },
  sessionCard: {
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  sessionCardFav: { borderColor: Brand.borderGold },
  cardHeader: { flexDirection: 'row', paddingRight: Spacing.three },
  cardAccent: { width: 5, alignSelf: 'stretch' },
  cardInfo: { flex: 1, paddingVertical: Spacing.three, paddingLeft: Spacing.three, gap: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { color: Brand.gold, fontSize: 13, fontWeight: '800' },
  trackLabel: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  trackLabelText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6 },
  sessionTitle: { color: Brand.textPrimary, fontSize: 15.5, fontWeight: '700', lineHeight: 21 },
  speakerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  speakerText: { color: Brand.textPrimary, fontSize: 13, fontWeight: '600' },
  companyText: { color: Brand.textSecondary, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { color: Brand.textSecondary, fontSize: 12 },
  cardActions: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    justifyContent: 'flex-start',
    width: 32,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  roleText: { color: Brand.textSecondary, fontSize: 12, fontWeight: '600' },
  descriptionText: { color: Brand.textSecondary, fontSize: 13, lineHeight: 18.5 },
  capacityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    backgroundColor: Brand.goldSoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
  },
  statusPillDanger: { borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.10)' },
  statusPillText: { color: Brand.textPrimary, fontSize: 11.5, fontWeight: '700' },
  statusPillTextDanger: { color: '#FCA5A5' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: 6 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.bgPrimary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  secondaryBtnActive: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  secondaryBtnText: { color: Brand.textPrimary, fontSize: 11.5, fontWeight: '700' },
  secondaryBtnTextActive: { color: Brand.bgPrimary },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: 8,
  },
  emptyTitle: { color: Brand.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 8 },
  emptySubtitle: {
    color: Brand.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.five,
    lineHeight: 18,
  },
});
