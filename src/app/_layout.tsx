import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Light } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/use-auth';
import { usePushRegistration } from '@/features/notifications/use-push-registration';

type IconName = keyof typeof Ionicons.glyphMap;

/** Registra o device para push (dentro do AuthProvider). Não renderiza nada. */
function PushGate() {
  usePushRegistration();
  return null;
}

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  map: { active: 'map', inactive: 'map-outline' },
  agenda: { active: 'calendar', inactive: 'calendar-outline' },
  exhibitors: { active: 'business', inactive: 'business-outline' },
  connections: { active: 'people', inactive: 'people-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  if (activeRoute === 'preencher' || activeRoute === 'expositor') return null;

  return (
    <View style={[styles.tabBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const icons = TAB_ICONS[route.name];
          // Rotas sem ícone definido (ex.: matchmaking) ficam fora da barra,
          // mas continuam acessíveis por navegação.
          if (!icons) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Ionicons
                  name={isFocused ? icons.active : icons.inactive}
                  size={22}
                  color={isFocused ? Light.navy : Light.textMuted}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <PushGate />
        <StatusBar style="light" />
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Light.bg } }}>
          <Tabs.Screen name="index" options={{ title: 'Início' }} />
          <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
          <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
          <Tabs.Screen name="exhibitors" options={{ title: 'Expositores' }} />
          <Tabs.Screen name="connections" options={{ title: 'Networking' }} />
          <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
          {/* Rotas acessíveis por navegação, mas fora da barra de abas */}
        <Tabs.Screen name="matchmaking" options={{ href: null }} />
        <Tabs.Screen name="home-v2" options={{ href: null }} />
        <Tabs.Screen name="company-profile-v2" options={{ href: null }} />
        <Tabs.Screen name="map-skia" options={{ href: null }} />
        <Tabs.Screen name="map-3d" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="terms" options={{ href: null }} />
        <Tabs.Screen name="exhibitor" options={{ href: null }} />
        <Tabs.Screen name="visitor" options={{ href: null }} />
        <Tabs.Screen name="assistant" options={{ href: null }} />
        <Tabs.Screen name="portal" options={{ href: null }} />
        <Tabs.Screen name="expositor" options={{ href: null }} />
        <Tabs.Screen name="preencher" options={{ href: null }} />
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        </Tabs>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    height: 64,
    backgroundColor: Light.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Light.border,
    alignItems: 'center',
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: Light.navyDeep,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 46,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#FBF6E9',
  },
});
