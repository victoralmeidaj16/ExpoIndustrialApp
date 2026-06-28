import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';

export default function VisitorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Brand.bgPrimary },
      }}
    />
  );
}
