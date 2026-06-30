import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { htmlSource } from '@/features/floor-plan/floor-plan-html';
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

export default function Map3DScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ search?: string; stand?: string }>();
  const { exhibitors, source } = useExhibitors();
  const [query, setQuery] = useState(() => (typeof params.search === 'string' ? params.search : ''));
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [selectedBoothId, setSelectedBoothId] = useState<string | undefined>();
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<WebView | HTMLIFrameElement | null>(null);

  const standParam = typeof params.stand === 'string' ? standNumber(params.stand).replace(/^0+/, '') : '';

  const categories = useMemo<CategoryFilter[]>(
    () => [ALL_CATEGORIES, ...Array.from(new Set(exhibitors.map((booth) => booth.category)))],
    [exhibitors]
  );
  const filteredBooths = useMemo(
    () => exhibitors.filter((booth) => matchesBooth(booth, query, category)),
    [category, exhibitors, query]
  );

  const deepLinkedBooth = useMemo(
    () =>
      standParam
        ? exhibitors.find((booth) => standNumber(booth.stand).replace(/^0+/, '') === standParam)
        : undefined,
    [standParam, exhibitors]
  );

  const selectedBooth =
    exhibitors.find((booth) => booth.id === selectedBoothId) ??
    deepLinkedBooth ??
    (query || category !== ALL_CATEGORIES ? filteredBooths[0] : undefined);

  const highlightedStandNumber = selectedBooth
    ? standNumber(selectedBooth.stand)
    : standParam;

  useEffect(() => {
    if (!mapReady || !highlightedStandNumber) return;

    const timer = setTimeout(() => {
      postMapMessage({
        type: 'SELECT_STAND',
        standNumber: highlightedStandNumber,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [highlightedStandNumber, mapReady, postMapMessage]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onMessage = (event: MessageEvent) => {
      try {
        handleMapMessage(event.data);
      } catch {
        // Ignora mensagens de extensões/devtools que não sejam da ponte do mapa.
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  });

  function selectCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    setSelectedBoothId(undefined);
  }

  function handleBoothSelect(boothId: string) {
    setSelectedBoothId(boothId);
    const booth = exhibitors.find((b) => b.id === boothId);
    if (booth) {
      postMapMessage({
        type: 'SELECT_STAND',
        standNumber: standNumber(booth.stand),
      });
    }
  }

  function handleRoutePress() {
    if (selectedBooth) {
      postMapMessage({
        type: 'ROUTE_TO_STAND',
        standNumber: standNumber(selectedBooth.stand),
      });
    }
  }

  function postMapMessage(message: { type: string; standNumber?: string }) {
    const payload = JSON.stringify(message);
    if (Platform.OS === 'web') {
      (mapRef.current as HTMLIFrameElement | null)?.contentWindow?.postMessage(payload, '*');
      return;
    }
    (mapRef.current as WebView | null)?.postMessage(payload);
  }

  function handleMapMessage(rawData: unknown) {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    if (data.type === 'BOOTH_SELECTED') {
      const booth = exhibitors.find(
        (item) =>
          item.id === data.id ||
          standNumber(item.stand) === standNumber(data.number || '')
      );
      if (booth) {
        setSelectedBoothId(booth.id);
      }
    } else if (data.type === 'BOOTH_DESELECTED') {
      setSelectedBoothId(undefined);
    }
  }

  function handleWebViewMessage(event: any) {
    try {
      handleMapMessage(event.nativeEvent.data);
    } catch (err) {
      console.error('Error parsing message from WebView:', err);
    }
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
          <Pressable
            accessibilityLabel="Voltar para mapa 2D"
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Brand.textPrimary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Experiência 3D</Text>
            <Text style={styles.title}>Planta em 3D Interativa</Text>
            <Text style={styles.subtitle}>
              Rotacione com os dedos, selecione os estandes para ver detalhes ou trace rotas dinâmicas a partir da entrada.
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
                  onPress={() => handleBoothSelect(booth.id)}>
                  <View style={styles.resultTop}>
                    {booth.logoUrl ? (
                      <ExhibitorLogo
                        logoUrl={booth.logoUrl}
                        logo={booth.logo}
                        style={styles.resultLogoImg}
                        textSize={10}
                      />
                    ) : (
                      <Text style={styles.resultLogo}>{booth.logo}</Text>
                    )}
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

        {/* 3D WebView Container */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              ref={(node) => {
                mapRef.current = node;
              }}
              srcDoc={htmlSource}
              title="Mapa 3D real da Expoindustrial Sul"
              style={styles.webIframe as any}
              onLoad={() => setMapReady(true)}
            />
          ) : (
            <WebView
              ref={(node) => {
                mapRef.current = node;
              }}
              originWhitelist={['*']}
              source={{ html: htmlSource }}
              style={styles.webview}
              onLoadEnd={() => setMapReady(true)}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={false}
              bounces={false}
            />
          )}
        </View>

        {selectedBooth ? (
          <Pressable
            style={styles.detailsCard}
            onPress={() => router.push(`/exhibitor/${selectedBooth.id}`)}>
            <View style={styles.detailLogoWrapper}>
              {selectedBooth.logoUrl ? (
                <ExhibitorLogo
                  logoUrl={selectedBooth.logoUrl}
                  logo={selectedBooth.logo}
                  style={styles.detailLogoImg}
                  textSize={12}
                />
              ) : (
                <Text style={styles.detailLogoText}>{selectedBooth.logo}</Text>
              )}
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.kicker}>Estande {selectedBooth.stand} · {selectedBooth.category}</Text>
              <Text style={styles.detailTitle} numberOfLines={1}>{selectedBooth.company}</Text>
              <Text style={styles.detailText} numberOfLines={2}>{selectedBooth.about || selectedBooth.industry}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Brand.textMuted} style={{ marginLeft: 4 }} />
          </Pressable>
        ) : null}
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
  backButton: {
    alignItems: 'center',
    backgroundColor: Brand.bgCard,
    borderColor: Brand.border,
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
  resultLogoImg: { width: 56, height: 22 },
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
  mapContainer: {
    backgroundColor: Brand.bgCard,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    height: 480,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  webview: {
    backgroundColor: '#07090e',
    flex: 1,
  },
  webIframe: {
    borderWidth: 0,
    height: '100%',
    width: '100%',
  },
  detailsCard: {
    alignItems: 'center',
    backgroundColor: Brand.bgCard,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  detailLogoWrapper: {
    width: 56,
    height: 56,
    backgroundColor: Brand.bgElevated,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  detailLogoImg: {
    width: '100%',
    height: '100%',
  },
  detailLogoText: {
    color: Brand.gold,
    fontSize: 16,
    fontWeight: '900',
  },
  detailCopy: {
    flex: 1,
  },
  kicker: {
    color: Brand.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  detailTitle: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  detailText: {
    color: Brand.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 16,
  },
});
