import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { AuthForm } from '@/features/auth/auth-form';
import { useAuth } from '@/features/auth/use-auth';
import {
  BOTTLENECK_OPTIONS,
  BUDGET_OPTIONS,
  EMPTY_VISITOR_PROFILE,
  saveVisitorProfile,
  useVisitorProfile,
  type VisitorProfile,
  ROLE_TYPES,
  MARKET_ROLES,
  OBJECTIVES,
  INTERESTS,
  SECTORS,
} from '@/features/visitor/visitor-profile';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, configured, initializing } = useAuth();
  const { profile, loading } = useVisitorProfile();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<VisitorProfile>(EMPTY_VISITOR_PROFILE);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      const initialForm = profile ?? { ...EMPTY_VISITOR_PROFILE };
      if (!initialForm.email && user?.email) {
        initialForm.email = user.email;
      }
      setForm(initialForm);
      setInitialized(true);
    }
  }, [profile, loading, initialized, user]);

  const set = <K extends keyof VisitorProfile>(key: K, value: VisitorProfile[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleArrayItem = <K extends 'sector' | 'objectives' | 'interests' | 'bottlenecks'>(
    key: K,
    item: string
  ) => {
    setForm((f) => {
      const arr = (f[key] as string[]) ?? [];
      const updated = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
      return { ...f, [key]: updated };
    });
  };

  const handleNext = () => {
    if (step < 5) {
      // Validações básicas por passo
      if (step === 1 && (!form.name.trim() || !form.phone?.trim() || !form.role.trim() || !form.company.trim() || !form.roleType)) {
        Alert.alert('Campos obrigatórios', 'Por favor, preencha nome completo, whatsapp, cargo, empresa e tipo de cargo.');
        return;
      }
      if (step === 2 && ((form.sector ?? []).length === 0 || !form.marketRole)) {
        Alert.alert('Campos obrigatórios', 'Selecione pelo menos um setor de atuação e o seu papel de mercado.');
        return;
      }
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const saveProfileWithStatus = async (completed: boolean, skipped: boolean) => {
    if (!configured) {
      // Modo demo
      router.replace('/');
      return;
    }

    setSaving(true);
    try {
      // Quando salva o setor, copia também para a área (texto) para compatibilidade com o match clássico
      const mainSector = form.sector && form.sector.length > 0 ? form.sector[0] : '';
      const updatedForm: VisitorProfile = {
        ...form,
        area: mainSector || form.area,
        onboardingCompleted: completed,
        onboardingSkipped: skipped,
      };

      await saveVisitorProfile(updatedForm);
      router.replace('/');
    } catch (err) {
      Alert.alert('Erro ao salvar', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    saveProfileWithStatus(true, false);
  };

  const handleSkip = () => {
    if (!form.name.trim() || !form.phone?.trim() || !form.role.trim() || !form.company.trim() || !form.roleType) {
      Alert.alert(
        'Informações obrigatórias',
        'Para acessar o aplicativo, preencha as informações básicas do Passo 1 (Nome Completo, WhatsApp, Cargo, Empresa e Tipo de Cargo).'
      );
      return;
    }
    Alert.alert(
      'Pular Onboarding?',
      'Seu cadastro básico será salvo. Você pode completar o restante do perfil a qualquer momento para ativar o matchmaking.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Pular',
          style: 'destructive',
          onPress: () => saveProfileWithStatus(false, true),
        },
      ]
    );
  };

  if (loading && !initialized) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={Brand.gold} />
      </View>
    );
  }

  if (configured && !initializing && !user) {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.four },
          ]}
          keyboardShouldPersistTaps="handled">
          <AuthForm
            title="Cadastro do visitante"
            icon="person-add"
            subtitle={{
              login: 'Entre para continuar seu onboarding e acessar seu crachá.',
              signup: 'Crie sua conta para gerar seu crachá, matches e recomendações.',
            }}
            onSuccess={() => setInitialized(false)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.four },
        ]}
        keyboardShouldPersistTaps="handled">
        
        {/* Top Header Row with Skip button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Personalize o seu App</Text>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Pular</Text>
          </Pressable>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s === step && styles.progressDotActive,
                s < step && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Form Steps */}
        <View style={styles.stepContainer}>
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Quem é você?</Text>
              <Text style={styles.stepSubtitle}>Dados obrigatórios para acesso ao app e crachá do evento.</Text>

              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => set('name', v)}
                placeholder="Nome Completo"
                placeholderTextColor={Brand.textMuted}
                style={styles.textInput}
              />

              <Text style={styles.label}>WhatsApp / Celular</Text>
              <TextInput
                value={form.phone}
                onChangeText={(v) => set('phone', v)}
                placeholder="DDD + Número (ex: 47 99999-9999)"
                placeholderTextColor={Brand.textMuted}
                keyboardType="phone-pad"
                style={styles.textInput}
              />

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                value={form.email}
                editable={false}
                placeholder="E-mail de cadastro"
                placeholderTextColor={Brand.textMuted}
                style={[styles.textInput, { opacity: 0.6 }]}
              />

              <Text style={styles.label}>Cargo</Text>
              <TextInput
                value={form.role}
                onChangeText={(v) => set('role', v)}
                placeholder="Ex: Diretor de Operações, Comprador Pleno"
                placeholderTextColor={Brand.textMuted}
                style={styles.textInput}
              />

              <Text style={styles.label}>Empresa</Text>
              <TextInput
                value={form.company}
                onChangeText={(v) => set('company', v)}
                placeholder="Nome da sua empresa"
                placeholderTextColor={Brand.textMuted}
                style={styles.textInput}
              />

              <Text style={styles.label}>Tipo de Cargo</Text>
              <View style={styles.optionsGrid}>
                {ROLE_TYPES.map((opt) => {
                  const isSelected = form.roleType === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.optionChip, isSelected && styles.optionChipActive]}
                      onPress={() => set('roleType', opt)}>
                      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Atuação Industrial</Text>
              <Text style={styles.stepSubtitle}>
                Selecione seus setores e seu principal objetivo comercial na feira.
              </Text>

              <Text style={styles.label}>Setor(es) de Atuação</Text>
              <View style={styles.optionsGrid}>
                {SECTORS.map((opt) => {
                  const isSelected = (form.sector ?? []).includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.optionChip, isSelected && styles.optionChipActive]}
                      onPress={() => toggleArrayItem('sector', opt)}>
                      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Papel de Mercado</Text>
              <View style={styles.optionsGrid}>
                {MARKET_ROLES.map((opt) => {
                  const isSelected = form.marketRole === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.optionChip, isSelected && styles.optionChipActive]}
                      onPress={() => set('marketRole', opt)}>
                      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Objetivos e Gargalos</Text>
              <Text style={styles.stepSubtitle}>O que você quer resolver durante a feira?</Text>

              <Text style={styles.label}>Objetivos no Evento</Text>
              <View style={styles.optionsGrid}>
                {OBJECTIVES.map((opt) => {
                  const isSelected = (form.objectives ?? []).includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.optionChip, isSelected && styles.optionChipActive]}
                      onPress={() => toggleArrayItem('objectives', opt)}>
                      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Gargalos da Operação</Text>
              <View style={styles.optionsGrid}>
                {BOTTLENECK_OPTIONS.map((opt) => {
                  const isSelected = (form.bottlenecks ?? []).includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.optionChip, isSelected && styles.optionChipActive]}
                      onPress={() => toggleArrayItem('bottlenecks', opt)}>
                      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Foco de Interesse e Orçamento</Text>
              <Text style={styles.stepSubtitle}>Seus interesses de tecnologia e capacidade.</Text>

              <Text style={styles.label}>Áreas de Interesse</Text>
              <View style={styles.optionsGrid}>
                {INTERESTS.map((opt) => {
                  const isSelected = (form.interests ?? []).includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.optionChip, isSelected && styles.optionChipActive]}
                      onPress={() => toggleArrayItem('interests', opt)}>
                      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Orçamento de Investimento</Text>
              <View style={styles.optionsGrid}>
                {BUDGET_OPTIONS.map((opt) => {
                  const isSelected = form.budget === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.optionChip, isSelected && styles.optionChipActive]}
                      onPress={() => set('budget', opt)}>
                      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>O que busca na feira?</Text>
              <TextInput
                value={form.lookingFor}
                onChangeText={(v) => set('lookingFor', v)}
                placeholder="Ex: Fornecedores de CLPs Siemens, painéis elétricos..."
                placeholderTextColor={Brand.textMuted}
                style={styles.textInput}
              />

              <Text style={styles.label}>O que oferece?</Text>
              <TextInput
                value={form.offering}
                onChangeText={(v) => set('offering', v)}
                placeholder="Ex: Fabricação de estruturas metálicas, serviços de engenharia..."
                placeholderTextColor={Brand.textMuted}
                style={styles.textInput}
              />
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Privacidade e Networking</Text>
              <Text style={styles.stepSubtitle}>
                Defina como quer se relacionar com outros profissionais.
              </Text>

              <View style={styles.consentCard}>
                <View style={styles.consentHeader}>
                  <Text style={styles.consentTitle}>Aparecer no Match de Pessoas</Text>
                  <Switch
                    value={form.discoverable}
                    onValueChange={(v) => set('discoverable', v)}
                    trackColor={{ false: Brand.border, true: Brand.gold }}
                    thumbColor={Platform.OS === 'android' ? Brand.bgPrimary : undefined}
                  />
                </View>
                <Text style={styles.consentDescription}>
                  Ative esta opção para habilitar o Matchmaking B2B inteligente com outros participantes do evento.
                  Se preferir não habilitar o networking, você continuará recebendo apenas as recomendações personalizadas de estandes.
                </Text>
              </View>

              <View style={styles.consentCard}>
                <View style={styles.consentHeader}>
                  <Text style={styles.consentTitle}>Revelar Dados de Contato</Text>
                  <Switch
                    value={form.shareContact}
                    onValueChange={(v) => set('shareContact', v)}
                    trackColor={{ false: Brand.border, true: Brand.gold }}
                    thumbColor={Platform.OS === 'android' ? Brand.bgPrimary : undefined}
                  />
                </View>
                <Text style={styles.consentDescription}>
                  Permite revelar seu e-mail e telefone para os contatos que você ACEITAR a conexão
                  na feira.
                </Text>
              </View>

              <Text style={styles.termsText}>
                Ao concluir, você concorda com a nossa{' '}
                <Text
                  style={{ color: Brand.gold, textDecorationLine: 'underline' }}
                  onPress={() => Linking.openURL('https://expo-industrial-sul.vercel.app/privacy')}>
                  Política de Privacidade
                </Text>{' '}
                e os nossos{' '}
                <Text
                  style={{ color: Brand.gold, textDecorationLine: 'underline' }}
                  onPress={() => Linking.openURL('https://expo-industrial-sul.vercel.app/terms')}>
                  Termos de Uso
                </Text>.
              </Text>
            </View>
          )}
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          {step > 1 ? (
            <Pressable onPress={handlePrev} style={styles.prevBtn}>
              <Ionicons name="arrow-back" size={16} color={Brand.textPrimary} />
              <Text style={styles.prevBtnText}>Voltar</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 5 ? (
            <Pressable onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Próximo</Text>
              <Ionicons name="arrow-forward" size={16} color={Brand.bgPrimary} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFinish}
              disabled={saving}
              style={[styles.nextBtn, saving && { opacity: 0.7 }]}>
              {saving ? (
                <ActivityIndicator color={Brand.bgPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Concluir</Text>
                  <Ionicons name="checkmark" size={16} color={Brand.bgPrimary} />
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgPrimary },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.bgPrimary,
  },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  headerTitle: { color: Brand.textPrimary, fontSize: 20, fontWeight: '800' },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  skipButtonText: { color: Brand.textMuted, fontSize: 13, fontWeight: '600' },

  progressRow: { flexDirection: 'row', gap: 6, marginVertical: Spacing.one },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
  },
  progressDotActive: { backgroundColor: Brand.gold },
  progressDotCompleted: { backgroundColor: Brand.goldSoft },

  stepContainer: { minHeight: 400, marginTop: Spacing.two },
  stepContent: { gap: Spacing.three },
  stepTitle: { color: Brand.textPrimary, fontSize: 22, fontWeight: '800' },
  stepSubtitle: { color: Brand.textSecondary, fontSize: 13.5, lineHeight: 20 },

  label: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '800',
    marginTop: Spacing.two,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    height: 46,
    color: Brand.textPrimary,
    fontSize: 14.5,
  },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  optionChipActive: { backgroundColor: '#0E172F', borderColor: 'rgba(47, 107, 255, 0.6)' },
  optionChipText: { color: Brand.textSecondary, fontSize: 12.5, fontWeight: '600' },
  optionChipTextActive: { color: Brand.textPrimary, fontWeight: '700' },

  consentCard: {
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: 8,
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consentTitle: { color: Brand.textPrimary, fontSize: 15, fontWeight: '700' },
  consentDescription: { color: Brand.textSecondary, fontSize: 12.5, lineHeight: 18 },
  termsText: {
    color: Brand.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: Spacing.two,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: Radius.sm,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  prevBtnText: { color: Brand.textPrimary, fontSize: 14, fontWeight: '700' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: Radius.sm,
    backgroundColor: Brand.gold,
  },
  nextBtnText: { color: Brand.bgPrimary, fontSize: 14.5, fontWeight: '800' },
});
