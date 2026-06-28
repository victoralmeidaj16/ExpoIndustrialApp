import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Brand } from '@/constants/theme';

export function scoreColor(score: number) {
  if (score >= 90) return Brand.success;
  if (score >= 83) return Brand.gold;
  return Brand.techBlue;
}

/** Anel circular de progresso (0–100) com arco colorido por faixa de score. */
export function ScoreRing({
  score,
  size = 58,
  stroke = 5,
  label = 'fit',
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const color = scoreColor(score);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(score, 0), 100) / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Brand.bgElevated}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color }]}>{score}%</Text>
        {!!label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 14, fontWeight: '800' },
  label: { color: Brand.textMuted, fontSize: 8.5, marginTop: -2 },
});
