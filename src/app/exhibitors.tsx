import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { ScoreRing } from '@/components/score-ring';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { CATEGORY_COLOR } from '@/features/venue/venue';

export default function ExhibitorsScreen() {
  const insets = useSafeAreaInsets();
  const { exhibitors } = useExhibitors();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.two, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Expositores</Text>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={Brand.textMuted} />
          <Text style={styles.searchPlaceholder}>Buscar empresa, setor ou estande…</Text>
        </View>

        <Text style={styles.count}>{exhibitors.length} expositores em destaque</Text>

        <View style={{ gap: Spacing.two }}>
          {exhibitors.map((b) => (
            <Pressable
              key={b.id}
              style={styles.card}
              onPress={() => router.push(`/exhibitor/${b.id}`)}>
              <ExhibitorLogo logoUrl={b.logoUrl} logo={b.logo} style={styles.logo} textSize={11} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.company}>{b.company}</Text>
                <Text style={styles.industry}>{b.industry}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.catDot, { backgroundColor: CATEGORY_COLOR[b.category] }]} />
                  <Text style={styles.meta}>
                    {b.category} · {b.stand}
                  </Text>
                </View>
              </View>
              <View style={styles.right}>
                <ScoreRing score={b.fit} size={46} stroke={4} label="" />
                <Ionicons name="chevron-forward" size={18} color={Brand.textMuted} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgPrimary },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  title: { color: Brand.textPrimary, fontSize: 22, fontWeight: '800' },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  searchPlaceholder: { color: Brand.textMuted, fontSize: 14 },
  count: { color: Brand.textSecondary, fontSize: 13 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  logo: { width: 60, height: 48 },
  company: { color: Brand.textPrimary, fontSize: 15, fontWeight: '700' },
  industry: { color: Brand.textSecondary, fontSize: 12.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  meta: { color: Brand.textMuted, fontSize: 11.5 },
  right: { alignItems: 'center', gap: 4 },
});
