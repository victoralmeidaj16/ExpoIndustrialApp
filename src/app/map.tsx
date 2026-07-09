import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Light, Radius, Spacing } from '@/constants/theme';
import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { htmlSource } from '@/features/floor-plan/floor-plan-html';
import { CATEGORY_COLOR, type Booth, type BoothCategory } from '@/features/venue/venue';

const ALL_CATEGORIES = 'Todos';
type CategoryFilter = typeof ALL_CATEGORIES | BoothCategory;

type MapBridgeMessage = {
  type: 'SELECT_STAND' | 'ROUTE_TO_STAND' | 'RESET_VIEW';
  standNumber?: string;
};

type MapSelection = {
  number?: string;
  name?: string;
  zone?: string;
};

const EMBEDDED_DETECTION_SOURCE =
  'const isEmbedded = window.ReactNativeWebView !== undefined || navigator.userAgent.includes("ReactNativeWebView");';
const EMBEDDED_DETECTION_TARGET =
  'window.ReactNativeWebView = window.ReactNativeWebView || { postMessage: (payload) => window.parent && window.parent.postMessage(payload, "*") }; const isEmbedded = true;';
const ROUTE_POINTS_SOURCE = `const points = [
                start,
                new THREE.Vector3(start.x, 0.2, end.z),
                end
            ];`;
const ROUTE_POINTS_TARGET = `const points = criarRotaCorredores(start, end);

            function criarRotaCorredores(startPoint, endPoint) {
                const walkwayX = [155, 300, 500, 700, 845, 1020, 1120];
                const walkwayY = [100, 190, 325, 470, 575];
                const nodes = [{ id: 'entrada', x: startPoint.x, z: startPoint.z }];

                walkwayY.forEach(y => {
                    walkwayX.forEach(x => {
                        const point = to3D(x, y, 0, 0);
                        nodes.push({ id: x + ':' + y, x: point.x, z: point.z });
                    });
                });

                const edges = new Map();
                const nodeById = new Map(nodes.map(node => [node.id, node]));
                const connect = (a, b) => {
                    const from = nodeById.get(a);
                    const to = nodeById.get(b);
                    if (!from || !to) return;
                    const cost = Math.hypot(from.x - to.x, from.z - to.z);
                    edges.set(a, [...(edges.get(a) || []), { id: b, cost }]);
                    edges.set(b, [...(edges.get(b) || []), { id: a, cost }]);
                };

                walkwayY.forEach(y => {
                    for (let idx = 0; idx < walkwayX.length - 1; idx += 1) {
                        connect(walkwayX[idx] + ':' + y, walkwayX[idx + 1] + ':' + y);
                    }
                });
                walkwayX.forEach(x => {
                    for (let idx = 0; idx < walkwayY.length - 1; idx += 1) {
                        connect(x + ':' + walkwayY[idx], x + ':' + walkwayY[idx + 1]);
                    }
                });
                connect('entrada', '500:575');
                connect('entrada', '700:575');

                const nearest = nodes
                    .filter(node => node.id !== 'entrada')
                    .reduce((best, node) =>
                        Math.hypot(node.x - endPoint.x, node.z - endPoint.z) <
                        Math.hypot(best.x - endPoint.x, best.z - endPoint.z) ? node : best
                    );
                const distances = new Map(nodes.map(node => [node.id, Number.POSITIVE_INFINITY]));
                const previous = new Map();
                const pending = new Set(nodes.map(node => node.id));
                distances.set('entrada', 0);

                while (pending.size > 0) {
                    const current = Array.from(pending).sort(
                        (a, b) => (distances.get(a) || Number.POSITIVE_INFINITY) -
                        (distances.get(b) || Number.POSITIVE_INFINITY)
                    )[0];
                    if (!current || current === nearest.id) break;
                    pending.delete(current);

                    (edges.get(current) || []).forEach(edge => {
                        if (!pending.has(edge.id)) return;
                        const nextDistance = (distances.get(current) || Number.POSITIVE_INFINITY) + edge.cost;
                        if (nextDistance < (distances.get(edge.id) || Number.POSITIVE_INFINITY)) {
                            distances.set(edge.id, nextDistance);
                            previous.set(edge.id, current);
                        }
                    });
                }

                const path = [];
                let current = nearest.id;
                while (current) {
                    path.unshift(current);
                    current = previous.get(current);
                }

                if (path[0] !== 'entrada') return [startPoint, endPoint];
                return path
                    .map(id => nodeById.get(id))
                    .filter(Boolean)
                    .map(node => new THREE.Vector3(node.x, 0.2, node.z))
                    .concat(endPoint);
            }`;

function createEmbeddedMapHtml() {
  return htmlSource
    .replace('<body>', '<body class="embedded">')
    .replace(EMBEDDED_DETECTION_SOURCE, EMBEDDED_DETECTION_TARGET)
    .replace(ROUTE_POINTS_SOURCE, ROUTE_POINTS_TARGET);
}

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

function normalizedStand(stand: string | undefined) {
  return standNumber(stand).replace(/^0+/, '');
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
  const mapRef = useRef<WebView | HTMLIFrameElement | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [selectedBoothId, setSelectedBoothId] = useState<string | undefined>();
  const [selectedMapStand, setSelectedMapStand] = useState<MapSelection | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [clientReady, setClientReady] = useState(false);

  const embeddedMapHtml = useMemo(createEmbeddedMapHtml, []);
  const visibleExhibitors = clientReady ? exhibitors : [];
  const standParam = clientReady && typeof params.stand === 'string' ? normalizedStand(params.stand) : '';
  const normalizedQuery = normalizeSearch(query);

  const categories = useMemo<CategoryFilter[]>(
    () => [ALL_CATEGORIES, ...Array.from(new Set(visibleExhibitors.map((booth) => booth.category)))],
    [visibleExhibitors],
  );
  const filteredBooths = useMemo(
    () => visibleExhibitors.filter((booth) => matchesBooth(booth, query, category)),
    [category, query, visibleExhibitors],
  );
  const deepLinkedBooth = useMemo(
    () =>
      standParam
        ? visibleExhibitors.find((booth) => normalizedStand(booth.stand) === standParam)
        : undefined,
    [standParam, visibleExhibitors],
  );
  const selectedBooth =
    visibleExhibitors.find((booth) => booth.id === selectedBoothId) ??
    deepLinkedBooth ??
    (normalizedQuery || category !== ALL_CATEGORIES ? filteredBooths[0] : undefined);
  const highlightedStandNumber = selectedBooth
    ? standNumber(selectedBooth.stand)
    : selectedMapStand?.number ?? standParam;
  const resultPreview = normalizedQuery ? filteredBooths.slice(0, 5) : [];

  const postMapMessage = useCallback((message: MapBridgeMessage) => {
    const payload = JSON.stringify(message);

    if (Platform.OS === 'web') {
      (mapRef.current as HTMLIFrameElement | null)?.contentWindow?.postMessage(payload, '*');
      return;
    }

    (mapRef.current as WebView | null)?.postMessage(payload);
  }, []);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (!clientReady || typeof params.search !== 'string') return;
    setQuery(params.search);
  }, [clientReady, params.search]);

  const handleMapMessage = useCallback(
    (rawData: unknown) => {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (!data || typeof data !== 'object') return;

      const message = data as { type?: string; number?: string; name?: string; zone?: string };
      if (message.type === 'BOOTH_SELECTED') {
        const stand = normalizedStand(message.number);
        const booth = visibleExhibitors.find((item) => normalizedStand(item.stand) === stand);

        setSelectedMapStand({
          number: message.number ? standNumber(message.number) : undefined,
          name: message.name,
          zone: message.zone,
        });

        if (booth) {
          setSelectedBoothId(booth.id);
        } else {
          setSelectedBoothId(undefined);
        }
      } else if (message.type === 'BOOTH_DESELECTED') {
        setSelectedBoothId(undefined);
        setSelectedMapStand(null);
      }
    },
    [visibleExhibitors],
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== (mapRef.current as HTMLIFrameElement | null)?.contentWindow) return;

      try {
        handleMapMessage(event.data);
      } catch {
        // Ignore mensagens que nao pertencem a ponte do mapa.
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleMapMessage]);

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

  function selectCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    setSelectedBoothId(undefined);
    setSelectedMapStand(null);
  }

  function selectBooth(booth: Booth) {
    setSelectedBoothId(booth.id);
    setSelectedMapStand({
      number: standNumber(booth.stand),
      name: booth.company,
      zone: booth.industry,
    });
  }

  function handleWebViewMessage(event: any) {
    try {
      handleMapMessage(event.nativeEvent.data);
    } catch (err) {
      console.error('Error parsing message from map WebView:', err);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.mapFrame}>
        {!clientReady ? (
          <View style={styles.mapPlaceholder} />
        ) : Platform.OS === 'web' ? (
          <iframe
            ref={(node) => {
              mapRef.current = node;
            }}
            srcDoc={embeddedMapHtml}
            title="Mapa 3D real da Expo Industrial Sul"
            style={styles.mapIframe as any}
            onLoad={() => setMapReady(true)}
          />
        ) : (
          <WebView
            ref={(node) => {
              mapRef.current = node;
            }}
            originWhitelist={['*']}
            source={{ html: embeddedMapHtml }}
            style={styles.webview}
            onLoadEnd={() => setMapReady(true)}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            bounces={false}
          />
        )}
      </View>

      <View style={[styles.topOverlay, { paddingTop: insets.top + Spacing.two }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Light.textMuted} />
            <TextInput
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedBoothId(undefined);
                setSelectedMapStand(null);
              }}
              placeholder="Buscar empresa, produto ou estande"
              placeholderTextColor={Light.textMuted}
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
                  setSelectedMapStand(null);
                  postMapMessage({ type: 'RESET_VIEW' });
                }}>
                <Ionicons name="close" size={16} color={Light.navyDeep} />
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

      <View
        style={[
          styles.bottomSheet,
          {
            bottom: Math.max(insets.bottom, 12) + 64 + 10,
            paddingBottom: Spacing.three,
          },
        ]}>
        <View style={styles.bottomHandle} />
        {selectedBooth ? (
          <Pressable
            style={styles.cardPressable}
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
            <Ionicons name="chevron-forward" size={20} color={Light.textMuted} style={{ marginLeft: 4 }} />
          </Pressable>
        ) : highlightedStandNumber ? (
          <View style={styles.cardPressable}>
            <View style={styles.detailLogoWrapper}>
              <Ionicons name="cube-outline" size={24} color={Light.gold} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.kicker}>{selectedMapStand?.zone ?? 'Estande destacado'}</Text>
              <Text style={styles.detailTitle} numberOfLines={1}>
                {selectedMapStand?.name ?? `Estande ${highlightedStandNumber}`}
              </Text>
              <Text style={styles.detailText}>Estande físico mapeado no pavilhão da feira.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardPressable}>
            <View style={styles.detailLogoWrapper}>
              <Ionicons name="map-outline" size={24} color={Light.textMuted} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.kicker}>
                {clientReady && source === 'firestore' ? 'Mapa Sincronizado' : 'Mapa Offline'}
              </Text>
              <Text style={styles.detailTitle}>Toque em um estande</Text>
              <Text style={styles.detailText}>Busque pelo menu superior ou aproxime o mapa para selecionar.</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Light.bg,
    flex: 1,
  },
  mapFrame: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Light.bg,
  },
  webview: {
    backgroundColor: Light.bg,
    flex: 1,
  },
  mapPlaceholder: {
    backgroundColor: Light.bg,
    flex: 1,
  },
  mapIframe: {
    borderWidth: 0,
    height: '100%',
    width: '100%',
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
    backgroundColor: Light.surface,
    borderColor: Light.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 46,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    shadowColor: Light.navyDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  searchInput: {
    color: Light.text,
    flex: 1,
    fontSize: 14,
    minHeight: 44,
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: Light.surfaceAlt,
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
    backgroundColor: Light.surface,
    borderColor: Light.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: Spacing.three,
    shadowColor: Light.navyDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: Light.navy,
    borderColor: Light.navy,
  },
  filterDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  filterText: {
    color: Light.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#fff',
  },
  resultsPanel: {
    backgroundColor: Light.surface,
    borderColor: Light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: Light.navyDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 4,
  },
  resultItem: {
    alignItems: 'center',
    borderBottomColor: Light.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  resultItemActive: {
    backgroundColor: '#FBF6E9',
  },
  resultStandBadge: {
    alignItems: 'center',
    backgroundColor: Light.surfaceAlt,
    borderColor: Light.goldPillBorder,
    borderRadius: Radius.sm,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: 8,
  },
  resultStandText: {
    color: Light.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  resultCopy: {
    flex: 1,
  },
  resultTitle: {
    color: Light.navyDeep,
    fontSize: 13.5,
    fontWeight: '800',
  },
  resultMeta: {
    color: Light.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: Light.textMuted,
    fontSize: 13,
    padding: Spacing.three,
  },
  bottomSheet: {
    backgroundColor: Light.surface,
    borderColor: Light.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    left: 16,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    position: 'absolute',
    right: 16,
    shadowColor: Light.navyDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomHandle: {
    alignSelf: 'center',
    backgroundColor: Light.border,
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
    color: Light.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bottomTitle: {
    color: Light.navyDeep,
    fontSize: 18,
    fontWeight: '900',
  },
  bottomText: {
    color: Light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  cardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    width: '100%',
    paddingBottom: Spacing.two,
  },
  detailLogoWrapper: {
    width: 52,
    height: 52,
    backgroundColor: Light.surfaceAlt,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Light.border,
    overflow: 'hidden',
  },
  detailLogoImg: {
    width: '100%',
    height: '100%',
  },
  detailLogoText: {
    color: Light.gold,
    fontSize: 16,
    fontWeight: '900',
  },
  detailCopy: {
    flex: 1,
  },
  kicker: {
    color: Light.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  detailTitle: {
    color: Light.navyDeep,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  detailText: {
    color: Light.textMuted,
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 16,
  },
});
