import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';
import { AuthForm } from '@/features/auth/auth-form';
import { useAuth } from '@/features/auth/use-auth';

export default function PortalLogin() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Já autenticado → vai direto ao formulário da empresa.
  if (user) return <Redirect href="/portal/empresa" />;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.five }]}
        keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.replace('/')}>
          <Ionicons name="chevron-back" size={20} color={Brand.textSecondary} />
          <Text style={styles.backText}>Voltar ao app</Text>
        </Pressable>

        <AuthForm
          title="Portal do Expositor"
          icon="briefcase"
          subtitle={{
            login: 'Acesse para gerenciar os dados da sua empresa.',
            signup: 'Crie sua conta para cadastrar sua empresa no evento.',
          }}
          onSuccess={() => router.replace('/portal/empresa')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgPrimary },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.two },
  backText: { color: Brand.textSecondary, fontSize: 14 },
});
