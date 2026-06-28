import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={40} color={Brand.gold} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.pill}>
          <Ionicons name="construct-outline" size={14} color={Brand.cyan} />
          <Text style={styles.pillText}>Em construção</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgPrimary, paddingHorizontal: Spacing.four },
  header: { paddingBottom: Spacing.three },
  headerTitle: { color: Brand.textPrimary, fontSize: 22, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingBottom: 80 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.lg,
    backgroundColor: Brand.goldSoft,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Brand.textPrimary, fontSize: 20, fontWeight: '700' },
  description: {
    color: Brand.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.blueSoft,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    marginTop: Spacing.two,
  },
  pillText: { color: Brand.cyan, fontSize: 12.5, fontWeight: '600' },
});
