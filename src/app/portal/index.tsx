import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAdminRole } from '@/features/admin/use-admin';
import { useAuth } from '@/features/auth/use-auth';

/** Porta de entrada do portal: decide entre login e cadastro pelo estado de auth. */
export default function PortalEntry() {
  const { user, initializing } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();

  if (initializing || (user && adminLoading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Brand.gold} />
      </View>
    );
  }

  if (!user) return <Redirect href="/portal/login" />;
  return <Redirect href={isAdmin ? '/portal/admin' : '/portal/empresa'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.bgPrimary },
});
