import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';

export default function PortalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Brand.bgPrimary },
        animation: 'slide_from_right',
      }}
    />
  );
}
