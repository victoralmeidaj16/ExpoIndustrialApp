import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { FloorPlanMap } from '@/features/floor-plan/floor-plan-map';
import { CATEGORY_COLOR, type Booth, type BoothCategory } from '@/features/venue/venue';

const ALL_CATEGORIES = 'Todos';
type CategoryFilter = typeof ALL_CATEGORIES | BoothCategory;

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function standNumber(stand: string | undefined) {
  return stand?.replace(/\D/g, '') ?? '';
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

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ search?: string; stand?: string }>();
  const { exhibitors, source } = useExhibitors();
  const [query, setQuery] = useState(() => (typeof params.search === 'string' ? params.search : ''));
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [selectedBoothId, setSelectedBoothId] = useState<string | undefined>();

  const standParam = typeof params.stand === 'string' ? standNumber(params.stand) : '';
  const normalizedQuery = normalizeSearch(query);

  const categories = useMemo<CategoryFilter[]>(
    () => [ALL_CATEGORIES, ...Array.from(new Set(exhibitors.map((booth) => booth.category)))],
    [exhibitors],
  );
  const filteredBooths = useMemo(
    () => exhibitors.filter((booth) => matchesBooth(booth, query, category)),
    [category, exhibitors, query],
  );
  const deepLinkedBooth = useMemo(
    () =>
      standParam
        ? exhibitors.find((booth) => standNumber(booth.stand).replace(/^0+/, '') === standParam.replace(/^0+/, ''))
        : undefined,
    [exhibitors, standParam],
  );
  const selectedBooth =
    exhibitors.find((booth) => booth.id === selectedBoothId) ??
    deepLinkedBooth ??
    (normalizedQuery || category !== ALL_CATEGORIES ? filteredBooths[0] : undefined);
  const highlightedStandNumber = selectedBooth ? standNumber(selectedBooth.stand) : standParam;
  const resultPreview = normalizedQuery ? filteredBooths.slice(0, 5) : [];
  const occupants = useMemo(
    () =>
      new Set(
        exhibitors
          .map((booth) => standNumber(booth.stand).replace(/^0+/, ''))
          .filter(Boolean),
      ),
    [exhibitors],
  );

  function selectCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    setSelectedBoothId(undefined);
  }

  function selectBooth(booth: Booth) {
    setSelectedBoothId(booth.id);
  }

  function selectStandFromMap(nextStandNumber: string) {
    const normalizedStand = standNumber(nextStandNumber).replace(/^0+/, '');
    const booth = exhibitors.find((item) => standNumber(item.stand).replace(/^0+/, '') === normalizedStand);
    if (booth) setSelectedBoothId(booth.id);
  }

  return (
    <View style={styles.screen}>
      <FloorPlanMap
        highlightedStandNumber={highlightedStandNumber}
        onStandPress={selectStandFromMap}
        occupants={occupants}
        initialZoom={1.7}
        showDetails={false}
        style={StyleSheet.absoluteFill}
        mapCardStyle={styles.fullMap}
        zoomControlsStyle={styles.mapZoomControls}
      />

      <View style={[styles.topOverlay, { paddingTop: insets.top + Spacing.two }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Brand.textMuted} />
            <TextInput
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedBoothId(undefined);
              }}
              placeholder="Buscar empresa, produto ou estande"
              placeholderTextColor={Brand.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              autoCapitalize="none"
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

        {resultPreview.length > 0 ? (
          <View style={styles.resultsPanel}>
            {resultPreview.map((booth) => {
              const active = selectedBooth?.id === booth.id;
              return (
                <Pressable
                  key={booth.id}
                  style={[styles.resultItem, active && styles.resultItemActive]}
                  onPress={() => selectBooth(booth)}>
                  <View style={styles.resultStandBadge}>
                    <Text style={styles.resultStandText}>{standNumber(booth.stand) || booth.id}</Text>
                  </View>
                  <View style={styles.resultCopy}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {booth.company}
                    </Text>
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {booth.industry}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : normalizedQuery ? (
          <View style={styles.resultsPanel}>
            <Text style={styles.emptyText}>Nenhum expositor encontrado.</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
        <View style={styles.bottomHandle} />
        {selectedBooth ? (
          <>
            <View style={styles.bottomTop}>
              <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLOR[selectedBooth.category] }]} />
              <Text style={styles.bottomKicker}>
                {selectedBooth.category} · {selectedBooth.stand}
              </Text>
            </View>
            <Text style={styles.bottomTitle} numberOfLines={1}>
              {selectedBooth.company}
            </Text>
            <Text style={styles.bottomText} numberOfLines={2}>
              {selectedBooth.industry} · rota sugerida pelos corredores a partir da entrada.
            </Text>
          </>
        ) : highlightedStandNumber ? (
          <>
            <Text style={styles.bottomKicker}>Estande destacado</Text>
            <Text style={styles.bottomTitle}>Estande {highlightedStandNumber}</Text>
            <Text style={styles.bottomText}>Rota sugerida pelos corredores a partir da entrada.</Text>
          </>
        ) : (
          <>
            <Text style={styles.bottomKicker}>{source === 'firestore' ? 'Mapa sincronizado' : 'Mapa offline'}</Text>
            <Text style={styles.bottomTitle}>Toque em um estande</Text>
            <Text style={styles.bottomText}>Use a busca no topo ou aproxime o mapa para localizar empresas e serviços.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Brand.bgPrimary,
    flex: 1,
  },
  fullMap: {
    backgroundColor: Brand.bgPrimary,
    borderRadius: 0,
  },
  mapZoomControls: {
    top: 150,
  },
  topOverlay: {
    gap: Spacing.two,
    left: 0,
    paddingHorizontal: Spacing.three,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 23, 42, 0.94)',
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flex: 1,
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
    paddingRight: Spacing.three,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 23, 42, 0.9)',
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
  resultsPanel: {
    backgroundColor: 'rgba(13, 23, 42, 0.96)',
    borderColor: Brand.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultItem: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  resultItemActive: {
    backgroundColor: Brand.goldSoft,
  },
  resultStandBadge: {
    alignItems: 'center',
    backgroundColor: Brand.bgPrimary,
    borderColor: Brand.borderGold,
    borderRadius: Radius.sm,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: 8,
  },
  resultStandText: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  resultCopy: {
    flex: 1,
  },
  resultTitle: {
    color: Brand.textPrimary,
    fontSize: 13.5,
    fontWeight: '800',
  },
  resultMeta: {
    color: Brand.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: Brand.textSecondary,
    fontSize: 13,
    padding: Spacing.three,
  },
  bottomSheet: {
    backgroundColor: 'rgba(13, 23, 42, 0.96)',
    borderColor: Brand.border,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    bottom: 0,
    gap: 4,
    left: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    position: 'absolute',
    right: 0,
  },
  bottomHandle: {
    alignSelf: 'center',
    backgroundColor: Brand.border,
    borderRadius: Radius.pill,
    height: 4,
    marginBottom: Spacing.two,
    width: 42,
  },
  bottomTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  categoryDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  bottomKicker: {
    color: Brand.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bottomTitle: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  bottomText: {
    color: Brand.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
