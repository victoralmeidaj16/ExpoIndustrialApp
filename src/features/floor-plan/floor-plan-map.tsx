import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Brand, Radius, Spacing } from '@/constants/theme';

import { type FloorCategory, type FloorObject, expoIndustrialFloorPlan, getCommercialStands, getFloorObjects } from './floor-plan-data';

const PALETTE: Record<FloorCategory, string> = {
  standard: '#2F6BFF',
  mini: '#00C8FF',
  premium: '#22C55E',
  case: '#E9F7FF',
  auditorium: '#767D87',
  service: '#C9A24C',
  circulation: '#242B35',
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;
const ZOOM_STEP = 0.35;

type FloorPlanMapProps = {
  highlightedStandNumber?: string;
  highlightedTitle?: string;
  highlightedSubtitle?: string;
  onStandPress?: (standNumber: string) => void;
  /** Números de estande (normalizados) com expositor publicado — marca ocupação. */
  occupants?: Set<string>;
};

function canShowLabel(item: FloorObject) {
  return ['standard', 'mini', 'premium', 'auditorium'].includes(item.category);
}

function normalizeStandNumber(value: string | undefined) {
  return value?.replace(/\D/g, '').replace(/^0+/, '') ?? '';
}

export function FloorPlanMap({
  highlightedStandNumber,
  highlightedTitle,
  highlightedSubtitle,
  onStandPress,
  occupants,
}: FloorPlanMapProps) {
  const { width } = useWindowDimensions();
  const plan = expoIndustrialFloorPlan;
  const objects = useMemo(() => {
    const categoryOrder: Record<FloorCategory, number> = {
      circulation: 0,
      case: 1,
      service: 2,
      auditorium: 3,
      premium: 4,
      standard: 5,
      mini: 5,
    };

    return getFloorObjects(plan).sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);
  }, [plan]);
  const commercialStands = useMemo(() => getCommercialStands(plan), [plan]);
  const highlightedStand = useMemo(
    () =>
      commercialStands.find(
        (item) => normalizeStandNumber(item.number) === normalizeStandNumber(highlightedStandNumber)
      ) ?? null,
    [commercialStands, highlightedStandNumber]
  );
  const [selectedFromMap, setSelectedFromMap] = useState<FloorObject | null>(null);
  const selected = highlightedStand ?? selectedFromMap ?? commercialStands.find((item) => item.number === '86') ?? null;
  const [zoom, setZoom] = useState(MAX_ZOOM);
  const mapWidth = Math.max(940, width * 2.25) * zoom;
  const mapHeight = (mapWidth / plan.hall.width) * plan.hall.height;

  return (
    <View style={styles.shell}>
      <View style={styles.mapCard}>
        <View style={styles.zoomControls}>
          <Pressable
            accessibilityLabel="Aumentar zoom"
            style={styles.zoomButton}
            onPress={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}>
            <Ionicons name="add" size={18} color={Brand.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable
            accessibilityLabel="Diminuir zoom"
            style={styles.zoomButton}
            onPress={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}>
            <Ionicons name="remove" size={18} color={Brand.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable accessibilityLabel="Resetar zoom" style={styles.zoomButton} onPress={() => setZoom(1)}>
            <Ionicons name="scan-outline" size={17} color={Brand.textPrimary} />
          </Pressable>
        </View>
        <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator>
          <ScrollView bounces={false} showsVerticalScrollIndicator>
            <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${plan.hall.width} ${plan.hall.height}`}>
              <Rect x={0} y={0} width={plan.hall.width} height={plan.hall.height} rx={16} fill="#141923" />
              <Path
                d="M145 100 H855 M145 575 H855 M300 100 V575 M700 100 V575 M155 100 V575 M845 100 V575"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray="2 18"
              />

              {objects.map((item) => {
                const isSelected = selected?.id === item.id;
                const isHighlighted = highlightedStand?.id === item.id;
                const label = canShowLabel(item) ? item.number : undefined;
                const isOccupied = Boolean(
                  item.number && occupants?.has(normalizeStandNumber(item.number)),
                );

                return (
                  <G
                    key={item.id}
                    onPress={() => {
                      setSelectedFromMap(item);
                      if (item.number) onStandPress?.(item.number);
                    }}>
                    <Rect
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      rx={item.category === 'circulation' ? 8 : 2}
                      fill={PALETTE[item.category]}
                      stroke={isHighlighted ? Brand.gold : isSelected ? Brand.cyan : 'rgba(3,5,13,0.72)'}
                      strokeWidth={isHighlighted ? 4 : isSelected ? 3 : 1.4}
                    />
                    {isOccupied ? (
                      <Circle cx={item.x + item.width - 5} cy={item.y + 5} r={3} fill={Brand.gold} />
                    ) : null}
                    {label ? (
                      <SvgText
                        x={item.x + item.width / 2}
                        y={item.y + item.height / 2 + 4}
                        fill="#FFFFFF"
                        fontSize={item.width < 34 ? 9 : 12}
                        fontWeight="900"
                        textAnchor="middle">
                        {label}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}
            </Svg>
          </ScrollView>
        </ScrollView>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailIcon}>
          <Ionicons
            name={selected?.category === 'auditorium' ? 'mic' : selected?.category === 'service' ? 'information-circle' : 'cube'}
            size={22}
            color={Brand.gold}
          />
        </View>
        <View style={styles.detailCopy}>
          <Text style={styles.kicker}>{selected?.zone ?? 'Selecione no mapa'}</Text>
          <Text style={styles.detailTitle}>{highlightedTitle ?? selected?.name ?? 'Toque em um bloco'}</Text>
          <Text style={styles.detailText}>
            {highlightedSubtitle ??
              (selected
              ? `${selected.type ?? 'ÁREA'}${selected.area ? ` · ${selected.area} m²` : ''}`
              : 'Número, tipo, metragem e zona aparecem aqui.')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: Spacing.three,
    paddingBottom: 120,
  },
  kicker: {
    color: Brand.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  mapCard: {
    backgroundColor: Brand.bgCard,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    maxHeight: 470,
    overflow: 'hidden',
  },
  zoomControls: {
    backgroundColor: 'rgba(5, 8, 22, 0.88)',
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    position: 'absolute',
    right: Spacing.two,
    top: Spacing.two,
    zIndex: 5,
  },
  zoomButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  zoomDivider: {
    backgroundColor: Brand.border,
    height: 24,
    marginTop: 7,
    width: 1,
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
  },
  detailIcon: {
    alignItems: 'center',
    backgroundColor: Brand.goldSoft,
    borderRadius: Radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  detailCopy: {
    flex: 1,
  },
  detailTitle: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  detailText: {
    color: Brand.textSecondary,
    fontSize: 14,
    marginTop: 3,
  },
});
