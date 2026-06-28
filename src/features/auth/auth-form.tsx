/**
 * Formulário reutilizável de login/cadastro por email/senha.
 * Usado tanto pelo portal do expositor quanto pelo gate do perfil do visitante.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { authErrorMessage, useAuth } from '@/features/auth/use-auth';

type Mode = 'login' | 'signup';

type Props = {
  title: string;
  subtitle?: { login: string; signup: string };
  icon?: keyof typeof Ionicons.glyphMap;
  onSuccess: () => void;
};

export function AuthForm({ title, subtitle, icon = 'person-circle', onSuccess }: Props) {
  const { configured, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(email, password);
      onSuccess();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Ionicons name={icon} size={24} color={Brand.gold} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle[mode]}</Text>}

      {!configured && (
        <View style={styles.warn}>
          <Ionicons name="warning-outline" size={16} color={Brand.warning} />
          <Text style={styles.warnText}>
            Firebase ainda não configurado. Preencha o .env e reinicie o app.
          </Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="voce@empresa.com"
          placeholderTextColor={Brand.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!busy}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={Brand.textMuted}
          secureTextEntry
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          editable={!busy}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.submit, (busy || !configured) && styles.submitDisabled]}
        onPress={onSubmit}
        disabled={busy || !configured}>
        {busy ? (
          <ActivityIndicator color="#0A1021" />
        ) : (
          <Text style={styles.submitText}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.switch}
        onPress={() => {
          setError(null);
          setMode((m) => (m === 'login' ? 'signup' : 'login'));
        }}>
        <Text style={styles.switchText}>
          {mode === 'login' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
          <Text style={styles.switchLink}>{mode === 'login' ? 'Cadastre-se' : 'Entrar'}</Text>
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>REALIZAÇÃO</Text>
        <Image
          source={require('@/assets/images/logo-apice.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  badge: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Brand.goldSoft,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Brand.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Brand.textSecondary, fontSize: 14.5, lineHeight: 20, marginTop: -6 },

  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  warnText: { color: Brand.warning, fontSize: 12.5, flex: 1 },

  field: { gap: 6 },
  label: { color: Brand.textSecondary, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    color: Brand.textPrimary,
    fontSize: 15,
  },
  error: { color: Brand.danger, fontSize: 13.5 },

  submit: {
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#0A1021', fontSize: 16, fontWeight: '800' },

  switch: { alignItems: 'center', paddingVertical: Spacing.two },
  switchText: { color: Brand.textSecondary, fontSize: 14 },
  switchLink: { color: Brand.gold, fontWeight: '700' },

  footer: { alignItems: 'center', gap: 6, marginTop: Spacing.three, opacity: 0.7 },
  footerLabel: { color: Brand.textMuted, fontSize: 9.5, fontWeight: '700', letterSpacing: 2 },
  footerLogo: { width: 84, height: 34 },
});

