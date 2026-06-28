import { Ionicons } from '@expo/vector-icons';
import {
  Canvas,
  FitBox,
  Group,
  Paragraph,
  Path,
  Rect,
  RoundedRect,
  Skia,
  type SkParagraph,
} from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Radius, Spacing } from '@/constants/theme';

import {
  type FloorCategory,
  type FloorObject,
  expoIndustrialFloorPlan,
  getCommercialStands,
  getFloorObjects,
} from './floor-plan-data';

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
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.85;
const MAP_MAX_HEIGHT = 470;

type FloorPlanSkiaMapProps = {
  highlightedStandNumber?: string;
  highlightedTitle?: string;
  highlightedSubtitle?: string;
  onStandPress?: (standNumber: string) => void;
};

type LabelParagraph = {
  id: string;
  paragraph: SkParagraph;
};

function canShowLabel(item: FloorObject) {
  return ['standard', 'mini', 'premium', 'auditorium'].includes(item.category);
}

function normalizeStandNumber(value: string | undefined) {
  return value?.replace(/\D/g, '').replace(/^0+/, '') ?? '';
}

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function createLabelParagraph(text: string, fontSize: number, color: string) {
  const paragraph = Skia.ParagraphBuilder.Make({
    maxLines: 1,
    textAlign: 1,
  })
    .pushStyle({
      color: Skia.Color(color),
      fontFamilies: ['System'],
      fontSize,
      fontStyle: { weight: 700 },
    })
    .addText(text)
    .build();

  return paragraph;
}

export function FloorPlanSkiaMap({
  highlightedStandNumber,
  highlightedTitle,
  highlightedSubtitle,
  onStandPress,
}: FloorPlanSkiaMapProps) {
  const { width } = useWindowDimensions();
  const plan = expoIndustrialFloorPlan;
  const viewportWidth = Math.max(320, width - Spacing.three * 2);
  const viewportHeight = Math.min(MAP_MAX_HEIGHT, Math.round(viewportWidth * 0.68));
  const contentWidth = viewportWidth;
  const contentHeight = Math.round((contentWidth / plan.hall.width) * plan.hall.height);
  const drawScale = contentWidth / plan.hall.width;
  const verticalInset = Math.max(0, (viewportHeight - contentHeight) / 2);

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
  const labelParagraphs = useMemo(() => {
    const entries = objects
      .filter((item) => item.number && canShowLabel(item))
      .map((item): LabelParagraph => {
        const fontSize = item.width < 34 ? 9 : 12;
        const paragraph = createLabelParagraph(item.number ?? '', fontSize, '#FFFFFF');
        paragraph.layout(item.width);

        return { id: item.id, paragraph };
      });

    return new Map(entries.map((entry) => [entry.id, entry.paragraph]));
  }, [objects]);

  const [selectedFromMap, setSelectedFromMap] = useState<FloorObject | null>(null);
  const selected = highlightedStand ?? selectedFromMap ?? commercialStands.find((item) => item.number === '86') ?? null;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(verticalInset);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(verticalInset);

  const maxTranslateX = (nextScale: number) => 0;
  const minTranslateX = (nextScale: number) => Math.min(0, viewportWidth - contentWidth * nextScale);
  const maxTranslateY = (nextScale: number) => verticalInset;
  const minTranslateY = (nextScale: number) => Math.min(verticalInset, viewportHeight - verticalInset - contentHeight * nextScale);

  const setSelectedStand = (standId: string) => {
    const item = objects.find((candidate) => candidate.id === standId);
    if (!item) return;

    setSelectedFromMap(item);
    if (item.number) onStandPress?.(item.number);
  };

  const hitTest = (screenX: number, screenY: number, currentScale: number, currentX: number, currentY: number) => {
    const planX = (screenX - currentX) / (drawScale * currentScale);
    const planY = (screenY - currentY) / (drawScale * currentScale);
    const hit = [...objects]
      .reverse()
      .find(
        (item) =>
          item.number &&
          planX >= item.x &&
          planX <= item.x + item.width &&
          planY >= item.y &&
          planY <= item.y + item.height
      );

    if (hit) setSelectedStand(hit.id);
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        minTranslateX(scale.value),
        maxTranslateX(scale.value)
      );
      translateY.value = clamp(
        savedTranslateY.value + event.translationY,
        minTranslateY(scale.value),
        maxTranslateY(scale.value)
      );
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextScale = clamp(savedScale.value * event.scale, MIN_ZOOM, MAX_ZOOM);
      const focalX = event.focalX;
      const focalY = event.focalY;
      const scaleDelta = nextScale / savedScale.value;
      const nextX = focalX - (focalX - savedTranslateX.value) * scaleDelta;
      const nextY = focalY - (focalY - savedTranslateY.value) * scaleDelta;

      scale.value = nextScale;
      translateX.value = clamp(nextX, minTranslateX(nextScale), maxTranslateX(nextScale));
      translateY.value = clamp(nextY, minTranslateY(nextScale), maxTranslateY(nextScale));
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(220)
    .maxDistance(8)
    .onEnd((event) => {
      runOnJS(hitTest)(event.x, event.y, scale.value, translateX.value, translateY.value);
    });

  const mapGesture = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);
  const mapTransformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const applyZoom = (direction: 1 | -1) => {
    runOnUI((nextDirection: 1 | -1, viewWidth: number, viewHeight: number, mapWidth: number, mapHeight: number, inset: number) => {
      'worklet';
      const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale.value + nextDirection * ZOOM_STEP));
      const centerX = viewWidth / 2;
      const centerY = viewHeight / 2;
      const scaleDelta = nextScale / scale.value;
      const nextX = centerX - (centerX - translateX.value) * scaleDelta;
      const nextY = centerY - (centerY - translateY.value) * scaleDelta;
      const minX = Math.min(0, viewWidth - mapWidth * nextScale);
      const minY = Math.min(inset, viewHeight - inset - mapHeight * nextScale);

      scale.value = withTiming(nextScale, { duration: 180 });
      translateX.value = withTiming(clamp(nextX, minX, 0), { duration: 180 });
      translateY.value = withTiming(clamp(nextY, minY, inset), { duration: 180 });
    })(direction, viewportWidth, viewportHeight, contentWidth, contentHeight, verticalInset);
  };

  const resetZoom = () => {
    runOnUI((inset: number) => {
      'worklet';
      scale.value = withTiming(1, { duration: 180 });
      translateX.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(inset, { duration: 180 });
    })(verticalInset);
  };

  return (
    <View style={styles.shell}>
      <View style={[styles.mapCard, { height: viewportHeight }]}>
        <View style={styles.zoomControls}>
          <Pressable accessibilityLabel="Aumentar zoom" style={styles.zoomButton} onPress={() => applyZoom(1)}>
            <Ionicons name="add" size={18} color={Brand.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable accessibilityLabel="Diminuir zoom" style={styles.zoomButton} onPress={() => applyZoom(-1)}>
            <Ionicons name="remove" size={18} color={Brand.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable accessibilityLabel="Resetar zoom" style={styles.zoomButton} onPress={resetZoom}>
            <Ionicons name="scan-outline" size={17} color={Brand.textPrimary} />
          </Pressable>
        </View>

        <GestureDetector gesture={mapGesture}>
          <Animated.View style={[styles.canvasLayer, { width: contentWidth, height: contentHeight }, mapTransformStyle]}>
            <Canvas style={styles.canvas}>
              <FitBox src={{ x: 0, y: 0, width: plan.hall.width, height: plan.hall.height }} dst={{ x: 0, y: 0, width: contentWidth, height: contentHeight }}>
                <Group>
                  <RoundedRect x={0} y={0} width={plan.hall.width} height={plan.hall.height} r={16} color="#141923" />
                  <Path
                    path="M145 100 H855 M145 575 H855 M300 100 V575 M700 100 V575 M155 100 V575 M845 100 V575"
                    color="rgba(255,255,255,0.15)"
                    style="stroke"
                    strokeWidth={10}
                    strokeCap="round"
                  />

                  {objects.map((item) => {
                    const isSelected = selected?.id === item.id;
                    const isHighlighted = highlightedStand?.id === item.id;
                    const paragraph = labelParagraphs.get(item.id);
                    const strokeColor = isHighlighted ? Brand.gold : isSelected ? Brand.cyan : 'rgba(3,5,13,0.72)';
                    const strokeWidth = isHighlighted ? 4 : isSelected ? 3 : 1.4;

                    return (
                      <Group key={item.id}>
                        <RoundedRect
                          x={item.x}
                          y={item.y}
                          width={item.width}
                          height={item.height}
                          r={item.category === 'circulation' ? 8 : 2}
                          color={PALETTE[item.category]}
                        />
                        <RoundedRect
                          x={item.x}
                          y={item.y}
                          width={item.width}
                          height={item.height}
                          r={item.category === 'circulation' ? 8 : 2}
                          color={strokeColor}
                          style="stroke"
                          strokeWidth={strokeWidth}
                        />
                        {isSelected ? (
                          <Rect
                            x={item.x - 4}
                            y={item.y - 4}
                            width={item.width + 8}
                            height={item.height + 8}
                            color="rgba(0,200,255,0.18)"
                          />
                        ) : null}
                        {paragraph ? (
                          <Paragraph
                            paragraph={paragraph}
                            x={item.x}
                            y={item.y + item.height / 2 - (item.width < 34 ? 7 : 8)}
                            width={item.width}
                          />
                        ) : null}
                      </Group>
                    );
                  })}
                </Group>
              </FitBox>
            </Canvas>
          </Animated.View>
        </GestureDetector>
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
    overflow: 'hidden',
  },
  canvasLayer: {
    left: 0,
    position: 'absolute',
    top: 0,
    transformOrigin: '0 0',
  },
  canvas: {
    flex: 1,
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
