import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { FloorPlanSkiaMap } from '@/features/floor-plan/floor-plan-skia-map';
import { BOOTHS, CATEGORY_COLOR, type Booth, type BoothCategory } from '@/features/venue/venue';

const ALL_CATEGORIES = 'Todos';
type CategoryFilter = typeof ALL_CATEGORIES | BoothCategory;

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchesBooth(booth: Booth, query: string, category: CategoryFilter) {
  const categoryMatch = category === ALL_CATEGORIES || booth.category === category;
  if (!categoryMatch) return false;

  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;

  const searchable = [
    booth.company,
    booth.logo,
    booth.stand,
    booth.category,
    booth.industry,
    booth.about,
    ...booth.products,
  ]
    .map(normalizeSearch)
    .join(' ');

  return searchable.includes(normalizedQuery);
}

function standNumber(stand: string) {
  return stand.replace(/\D/g, '');
}

export default function SkiaMapScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ search?: string }>();
  const [query, setQuery] = useState(() => (typeof params.search === 'string' ? params.search : ''));
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [selectedBoothId, setSelectedBoothId] = useState<string | undefined>();

  const categories = useMemo<CategoryFilter[]>(
    () => [ALL_CATEGORIES, ...Array.from(new Set(BOOTHS.map((booth) => booth.category)))],
    []
  );
  const filteredBooths = useMemo(
    () => BOOTHS.filter((booth) => matchesBooth(booth, query, category)),
    [category, query]
  );
  const selectedBooth =
    BOOTHS.find((booth) => booth.id === selectedBoothId) ??
    (query || category !== ALL_CATEGORIES ? filteredBooths[0] : undefined);
  const highlightedStandNumber = selectedBooth ? standNumber(selectedBooth.stand) : undefined;

  function selectCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    setSelectedBoothId(undefined);
  }

  function selectStandFromMap(nextStandNumber: string) {
    const booth = BOOTHS.find((item) => standNumber(item.stand) === nextStandNumber.replace(/\D/g, ''));
    if (booth) setSelectedBoothId(booth.id);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={22} color={Brand.gold} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Planta Skia</Text>
            <Text style={styles.title}>Mapa nativo experimental</Text>
            <Text style={styles.subtitle}>
              Versão alternativa com canvas Skia, pinch zoom nativo e pan fluido para testes de performance.
            </Text>
          </View>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Brand.textMuted} />
            <TextInput
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedBoothId(undefined);
              }}
              placeholder="Buscar empresa, setor, produto ou estande"
              placeholderTextColor={Brand.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query ? (
              <Pressable
                accessibilityLabel="Limpar busca"
                style={styles.clearButton}
                onPress={() => {
                  setQuery('');
                  setSelectedBoothId(undefined);
                }}>
                <Ionicons name="close" size={16} color={Brand.textPrimary} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {categories.map((item) => {
              const active = item === category;
              return (
                <Pressable
                  key={item}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => selectCategory(item)}>
                  {item !== ALL_CATEGORIES ? (
                    <View style={[styles.filterDot, { backgroundColor: CATEGORY_COLOR[item] }]} />
                  ) : null}
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.resultHeader}>
            <Text style={styles.resultCount}>
              {filteredBooths.length} {filteredBooths.length === 1 ? 'resultado' : 'resultados'}
            </Text>
            {selectedBooth ? <Text style={styles.resultHint}>Destaque: {selectedBooth.stand}</Text> : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.resultRow}>
            {filteredBooths.map((booth) => {
              const active = selectedBooth?.id === booth.id;
              return (
                <Pressable
                  key={booth.id}
                  style={[styles.resultCard, active && styles.resultCardActive]}
                  onPress={() => setSelectedBoothId(booth.id)}>
                  <View style={styles.resultTop}>
                    <Text style={styles.resultLogo}>{booth.logo}</Text>
                    <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLOR[booth.category] }]} />
                  </View>
                  <Text style={styles.resultTitle} numberOfLines={2}>
                    {booth.company}
                  </Text>
                  <Text style={styles.resultMeta} numberOfLines={1}>
                    {booth.industry}
                  </Text>
                  <Text style={styles.resultStand}>{booth.stand}</Text>
                </Pressable>
              );
            })}
            {!filteredBooths.length ? (
              <View style={styles.emptyResults}>
                <Ionicons name="search" size={18} color={Brand.textMuted} />
                <Text style={styles.emptyText}>Nenhum expositor encontrado.</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>

        <FloorPlanSkiaMap
          highlightedStandNumber={highlightedStandNumber}
          highlightedTitle={selectedBooth?.company}
          highlightedSubtitle={
            selectedBooth
              ? `${selectedBooth.industry} · ${selectedBooth.stand} · ${selectedBooth.category}`
              : undefined
          }
          onStandPress={selectStandFromMap}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Brand.bgPrimary,
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: Brand.goldSoft,
    borderColor: Brand.borderGold,
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: Brand.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: Brand.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: Brand.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  searchCard: {
    backgroundColor: Brand.bgCard,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    marginBottom: Spacing.three,
    padding: Spacing.three,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: Brand.bgElevated,
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 46,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
  },
  searchInput: {
    color: Brand.textPrimary,
    flex: 1,
    fontSize: 14,
    minHeight: 44,
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  filterRow: {
    gap: Spacing.two,
  },
  filterChip: {
    alignItems: 'center',
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: Spacing.three,
  },
  filterChipActive: {
    backgroundColor: Brand.goldSoft,
    borderColor: Brand.borderGold,
  },
  filterDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  filterText: {
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: Brand.textPrimary,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultCount: {
    color: Brand.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  resultHint: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  resultRow: {
    gap: Spacing.two,
  },
  resultCard: {
    backgroundColor: Brand.bgElevated,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 5,
    minHeight: 132,
    padding: Spacing.three,
    width: 176,
  },
  resultCardActive: {
    borderColor: Brand.borderGold,
  },
  resultTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultLogo: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  categoryDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  resultTitle: {
    color: Brand.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 2,
  },
  resultMeta: {
    color: Brand.textSecondary,
    fontSize: 12,
  },
  resultStand: {
    color: Brand.cyan,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 'auto',
  },
  emptyResults: {
    alignItems: 'center',
    borderColor: Brand.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 84,
    padding: Spacing.three,
    width: 240,
  },
  emptyText: {
    color: Brand.textSecondary,
    flex: 1,
    fontSize: 13,
  },
});
