/**
 * Tema da marca ExpoIndustrialSul.
 * Paleta industrial dark com acentos em dourado executivo e azul tecnológico,
 * extraída do board de design do app.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Paleta principal da marca (usada nas telas customizadas). */
export const Brand = {
  // Fundos
  bgPrimary: '#050816',
  bgSecondary: '#071A33',
  bgCard: '#0A1021',
  bgElevated: '#111827',

  // Acentos
  gold: '#C9A24C',
  goldSoft: 'rgba(201, 162, 76, 0.14)',
  techBlue: '#2F6BFF',
  blueSoft: 'rgba(47, 107, 255, 0.14)',
  cyan: '#00C8FF',

  // Texto
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B4BA',
  textMuted: '#6B7280',

  // Bordas / linhas
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.18)',
  borderGold: 'rgba(201, 162, 76, 0.4)',

  // Estados
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

/**
 * Paleta CLARA "showcase" — novo design do app (fundo claro, header navy, cards
 * brancos arredondados, acentos em dourado). Extraída do board de design e da
 * tela de referência `home-v2`. Migração das telas: usar estes tokens + o kit
 * em `components/ui-kit`.
 */
export const Light = {
  // Fundos
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F7FB',
  iconSoftBg: '#F4F7FB',

  // Marca (navy + dourado)
  navy: '#0C2345',
  navyDeep: '#071A33',
  gold: '#C9A24C',
  goldLight: '#D8B25A',

  // Pílula dourada (AI Insight)
  goldPillBorder: '#F0E4C4',
  goldText: '#7A6320',
  goldTextStrong: '#8A6D15',

  // Texto
  text: '#071A33',
  textNavy: '#0C2345',
  textMuted: '#94A3B8',
  textFaint: '#C4CDDA',

  // Bordas / linhas
  border: '#EEF1F6',

  // Estados
  success: '#159A5B',
  danger: '#EF4444',
  warning: '#C9A24C',
} as const;

/** Pares de cor para `LinearGradient` no design claro. */
export const LightGradient = {
  header: [Light.navy, Light.navyDeep] as const,
  goldPill: ['#FBF6E9', '#F8F1DF'] as const,
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: Brand.textPrimary,
    background: Brand.bgPrimary,
    backgroundElement: Brand.bgCard,
    backgroundSelected: Brand.bgElevated,
    textSecondary: Brand.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
