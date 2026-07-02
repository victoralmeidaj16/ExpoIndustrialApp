import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { ScoreRing } from '@/components/score-ring';
import { Card, ScreenBody, ScreenHeader, SearchBar, TAB_BAR_CLEARANCE } from '@/components/ui-kit';
import { Light } from '@/constants/theme';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { CATEGORY_COLOR } from '@/features/venue/venue';

export default function ExhibitorsScreen() {
  const { exhibitors } = useExhibitors();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exhibitors;
    return exhibitors.filter(
      (b) =>
        b.company.toLowerCase().includes(q) ||
        b.industry.toLowerCase().includes(q) ||
        (b.stand ?? '').toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q),
    );
  }, [exhibitors, search]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Expositores"
          subtitle={`${exhibitors.length} empresas no evento`}
        />

        <ScreenBody>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar empresa, setor ou estande…"
          />

          <View style={styles.list}>
            {filtered.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => router.push(`/exhibitor/${b.id}`)}>
                <Card style={styles.card}>
                  <ExhibitorLogo logoUrl={b.logoUrl} logo={b.logo} style={styles.logo} textSize={11} />
                  <View style={styles.info}>
                    <Text style={styles.company}>{b.company}</Text>
                    <Text style={styles.industry} numberOfLines={1}>{b.industry}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.catDot, { backgroundColor: CATEGORY_COLOR[b.category] }]} />
                      <Text style={styles.meta}>
                        {b.category} · {b.stand}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.right}>
                    <ScoreRing score={b.fit} size={46} stroke={4} label="" trackColor={Light.border} />
                    <Ionicons name="chevron-forward" size={18} color={Light.textFaint} />
                  </View>
                </Card>
              </Pressable>
            ))}

            {filtered.length === 0 && (
              <Card style={styles.empty}>
                <Text style={styles.emptyText}>Nenhum expositor encontrado para “{search}”.</Text>
              </Card>
            )}
          </View>
        </ScreenBody>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },
  list: { gap: 12 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
  },
  logo: { width: 56, height: 46, backgroundColor: Light.surfaceAlt },
  info: { flex: 1, gap: 3 },
  company: { color: Light.navyDeep, fontSize: 15, fontWeight: '700' },
  industry: { color: Light.textMuted, fontSize: 12.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  meta: { color: Light.textMuted, fontSize: 11.5 },
  right: { alignItems: 'center', gap: 4 },

  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyText: { color: Light.textMuted, fontSize: 13.5, textAlign: 'center' },
});
