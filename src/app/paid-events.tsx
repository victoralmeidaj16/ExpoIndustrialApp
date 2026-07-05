import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader, TAB_BAR_CLEARANCE } from '@/components/ui-kit';
import { Light, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/use-auth';
import { usePaidEvents } from '@/features/paid-events/use-paid-events';

export default function PaidEventsScreen() {
  const { user } = useAuth();
  const email = user?.email || '';
  const { events, loading, error } = usePaidEvents(email);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Eventos pagos"
        subtitle="Materiais exclusivos liberados pela inscrição"
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CLEARANCE }]}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Light.gold} />
            <Text style={styles.stateText}>Verificando seus acessos...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Ionicons name="warning-outline" size={22} color={Light.danger} />
            <Text style={styles.stateText}>Não foi possível carregar os eventos pagos.</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="ticket-outline" size={22} color={Light.textMuted} />
            <Text style={styles.stateText}>Nenhum evento pago publicado ainda.</Text>
          </View>
        ) : (
          events.map((event) => {
            const hasAccess = event.access?.status === 'paid';
            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventTop}>
                  <View style={styles.eventIcon}>
                    <Ionicons name="school-outline" size={20} color={Light.gold} />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventMeta}>
                      {[event.dateLabel, event.location].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={[styles.accessPill, hasAccess ? styles.accessPillOk : styles.accessPillLocked]}>
                    <Ionicons
                      name={hasAccess ? 'lock-open-outline' : 'lock-closed-outline'}
                      size={13}
                      color={hasAccess ? '#166534' : Light.textMuted}
                    />
                    <Text style={[styles.accessText, hasAccess && styles.accessTextOk]}>
                      {hasAccess ? 'Liberado' : 'Restrito'}
                    </Text>
                  </View>
                </View>

                {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

                {hasAccess ? (
                  <View style={styles.materials}>
                    {event.materials.length === 0 ? (
                      <Text style={styles.emptyMaterials}>Materiais serão publicados em breve.</Text>
                    ) : (
                      event.materials.map((material) => (
                        <Pressable
                          key={material.id}
                          style={styles.materialCard}
                          onPress={() => Linking.openURL(material.fileUrl)}>
                          <View style={styles.materialIcon}>
                            <Ionicons name="document-text-outline" size={18} color={Light.gold} />
                          </View>
                          <View style={styles.materialBody}>
                            <Text style={styles.materialTitle} numberOfLines={1}>
                              {material.title}
                            </Text>
                            {material.description ? (
                              <Text style={styles.materialMeta} numberOfLines={1}>
                                {material.description}
                              </Text>
                            ) : null}
                          </View>
                          <Ionicons name="download-outline" size={19} color={Light.textMuted} />
                        </Pressable>
                      ))
                    )}
                  </View>
                ) : (
                  <View style={styles.lockedBox}>
                    <Text style={styles.lockedText}>
                      Use no app o mesmo email cadastrado na compra Higestor para liberar os materiais.
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },
  content: { padding: Spacing.four, gap: Spacing.three, marginTop: -34 },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Light.border,
    padding: Spacing.five,
  },
  stateText: { color: Light.textMuted, fontSize: 13, textAlign: 'center' },
  eventCard: {
    backgroundColor: Light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Light.border,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  eventTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: Light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: { flex: 1, gap: 3 },
  eventTitle: { color: Light.navyDeep, fontSize: 15, fontWeight: '800' },
  eventMeta: { color: Light.textMuted, fontSize: 12 },
  accessPill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessPillOk: { backgroundColor: '#DCFCE7' },
  accessPillLocked: { backgroundColor: Light.surfaceAlt },
  accessText: { color: Light.textMuted, fontSize: 11, fontWeight: '800' },
  accessTextOk: { color: '#166534' },
  description: { color: Light.textMuted, fontSize: 13, lineHeight: 18 },
  materials: { gap: Spacing.two },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Light.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.two,
  },
  materialIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialBody: { flex: 1, gap: 2 },
  materialTitle: { color: Light.navyDeep, fontSize: 13, fontWeight: '700' },
  materialMeta: { color: Light.textMuted, fontSize: 11.5 },
  emptyMaterials: { color: Light.textMuted, fontSize: 12 },
  lockedBox: { backgroundColor: Light.surfaceAlt, borderRadius: Radius.sm, padding: Spacing.three },
  lockedText: { color: Light.textMuted, fontSize: 12, lineHeight: 17 },
});
