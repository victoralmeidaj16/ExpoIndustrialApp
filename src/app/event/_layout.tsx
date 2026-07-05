import { Stack } from 'expo-router';

import { Light } from '@/constants/theme';

export default function EventLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Light.bg },
      }}
    />
  );
}
