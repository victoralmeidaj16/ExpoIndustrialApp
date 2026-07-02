/**
 * Kit de UI do design CLARO (novo visual do app).
 *
 * Componentes reutilizáveis extraídos da tela de referência `home-v2`, para
 * migrar as demais telas mantendo consistência (header navy, cards brancos,
 * seções, busca, pílula dourada) sem espalhar cores/medidas em cada arquivo.
 * Usa os tokens de `Light` / `LightGradient` em `constants/theme`.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Light, LightGradient } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Botão circular translúcido usado no header navy (voltar, sino, etc.). */
export function HeaderIconButton({
  icon,
  onPress,
  dot = false,
}: {
  icon: IconName;
  onPress?: () => void;
  dot?: boolean;
}) {
  return (
    <Pressable style={kit.iconButton} onPress={onPress} hitSlop={8}>
      <Ionicons name={icon} size={17} color="#fff" />
      {dot && <View style={kit.notifDot} />}
    </Pressable>
  );
}

/**
 * Cabeçalho navy com gradiente, círculos decorativos (blueprint) e uma linha de
 * ações opcional (voltar à esquerda, `right` à direita). O conteúdo do corpo da
 * tela costuma sobrepor a base do header (use `ScreenBody` com margem negativa).
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const hasTopRow = Boolean(onBack) || Boolean(right);

  return (
    <LinearGradient
      colors={LightGradient.header}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[kit.header, { paddingTop: insets.top + 14 }, style]}>
      <View style={[kit.decoCircle, { width: 180, height: 180 }]} />
      <View style={[kit.decoCircle, { width: 120, height: 120 }]} />

      {hasTopRow && (
        <View style={kit.headerTopRow}>
          {onBack ? <HeaderIconButton icon="chevron-back" onPress={onBack} /> : <View />}
          {right ?? <View />}
        </View>
      )}

      <Text style={kit.headerTitle}>{title}</Text>
      {subtitle ? <Text style={kit.headerSubtitle}>{subtitle}</Text> : null}
      {children}
    </LinearGradient>
  );
}

/** Corpo claro que sobrepõe a base do header (margem negativa) e agrupa cards. */
export function ScreenBody({
  children,
  overlap = true,
  style,
}: {
  children: ReactNode;
  overlap?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[kit.body, overlap && kit.bodyOverlap, style]}>{children}</View>;
}

/** Card branco padrão (fundo, borda, raio). */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[kit.card, style]}>{children}</View>;
}

/** Título de seção com link opcional à direita (ex.: "Ver todos"). */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={kit.sectionHeader}>
      <Text style={kit.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={kit.sectionLink}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Barra de busca clara (controlada). */
export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View style={kit.search}>
      <Ionicons name="search" size={18} color={Light.textMuted} />
      <TextInput
        style={kit.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Light.textMuted}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={Light.textFaint} />
        </Pressable>
      )}
    </View>
  );
}

/** Pílula dourada de destaque (ex.: "Match IA: …"). */
export function GoldInsight({ label, children }: { label: string; children: ReactNode }) {
  return (
    <LinearGradient
      colors={LightGradient.goldPill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={kit.insightPill}>
      <View style={kit.insightIcon}>
        <Ionicons name="bulb-outline" size={15} color={Light.gold} />
      </View>
      <Text style={kit.insightText}>
        <Text style={kit.insightLabel}>{label} </Text>
        {children}
      </Text>
    </LinearGradient>
  );
}

/** Espaço no fim do scroll para não colidir com a tab bar flutuante. */
export const TAB_BAR_CLEARANCE = 96;

const kit = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingBottom: 58, overflow: 'hidden' },
  decoCircle: {
    position: 'absolute',
    right: -50,
    bottom: -70,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,162,76,0.25)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: Light.danger,
    borderWidth: 1.5,
    borderColor: Light.navy,
  },
  headerTitle: { fontSize: 25, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.66)', marginTop: 4 },

  body: { paddingHorizontal: 16, gap: 14 },
  bodyOverlap: { marginTop: -42 },

  card: {
    backgroundColor: Light.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Light.border,
    padding: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: Light.navyDeep },
  sectionLink: { fontSize: 12, fontWeight: '700', color: Light.gold },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, color: Light.text, fontSize: 14, padding: 0 },

  insightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: { flex: 1, fontSize: 12, color: Light.goldText, lineHeight: 16.5 },
  insightLabel: { fontWeight: '700', color: Light.goldTextStrong },
});
