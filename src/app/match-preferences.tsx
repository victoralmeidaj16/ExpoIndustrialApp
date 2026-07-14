import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card, ScreenBody, ScreenHeader, TAB_BAR_CLEARANCE } from '@/components/ui-kit';
import { Light, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/use-auth';
import {
  BOTTLENECK_OPTIONS,
  BUDGET_OPTIONS,
  EMPTY_VISITOR_PROFILE,
  INTERESTS,
  MARKET_ROLES,
  MAX_BOTTLENECKS,
  MAX_INTERESTS,
  OBJECTIVES,
  saveVisitorProfile,
  SECTORS,
  useVisitorProfile,
  type VisitorProfile,
} from '@/features/visitor/visitor-profile';

type MultiKey = 'sector' | 'objectives' | 'interests' | 'bottlenecks';

export default function MatchPreferencesScreen() {
  const { configured, user } = useAuth();
  const { profile, loading } = useVisitorProfile();
  const [form, setForm] = useState<VisitorProfile>(EMPTY_VISITOR_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated || loading) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const initialForm = { ...EMPTY_VISITOR_PROFILE, ...(profile ?? {}) };
      if (!initialForm.email && user?.email) {
        initialForm.email = user.email;
      }
      setForm(initialForm);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [hydrated, loading, profile, user]);

  const set = <K extends keyof VisitorProfile>(key: K, value: VisitorProfile[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleArrayItem = (key: MultiKey, item: string) => {
    const current = (form[key] as string[]) ?? [];
    if (!current.includes(item)) {
      const limit =
        key === 'bottlenecks' ? MAX_BOTTLENECKS : key === 'interests' ? MAX_INTERESTS : undefined;
      if (limit && current.length >= limit) {
        Alert.alert(
          'Limite atingido',
          `Você pode selecionar no máximo ${limit} ${
            key === 'bottlenecks' ? 'gargalos' : 'áreas de interesse'
          }. Desmarque uma opção para trocar.`,
        );
        return;
      }
    }
    setForm((prev) => {
      const values = (prev[key] as string[]) ?? [];
      const updated = values.includes(item)
        ? values.filter((value) => value !== item)
        : [...values, item];
      return { ...prev, [key]: updated };
    });
  };

  async function handleSave() {
    if (!configured) {
      Alert.alert('Firebase não configurado', 'Configure o Firebase para salvar suas preferências.');
      return;
    }

    if (!form.sector?.length || !form.marketRole) {
      Alert.alert('Campos obrigatórios', 'Selecione pelo menos um setor de atuação e o seu papel de mercado.');
      return;
    }

    const hasMatchSignal =
      form.bottlenecks.length > 0 ||
      (form.interests?.length ?? 0) > 0 ||
      Boolean(form.lookingFor?.trim());

    if (!hasMatchSignal) {
      Alert.alert(
        'Complete as preferências',
        'Informe pelo menos um gargalo, interesse ou o que você busca na feira.',
      );
      return;
    }

    setSaving(true);
    try {
      const mainSector = form.sector[0] ?? '';
      await saveVisitorProfile({
        ...form,
        area: mainSector || form.area,
        onboardingCompleted: true,
        onboardingSkipped: false,
      });
      Alert.alert('Preferências salvas', 'Seu matchmaking foi atualizado.', [
        { text: 'Ver matches', onPress: () => router.replace('/matchmaking') },
      ]);
    } catch (err) {
      Alert.alert('Erro ao salvar', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !hydrated) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={Light.gold} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title="Preferências de Match"
        subtitle="Complete os dados usados nas recomendações e no networking"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenBody>
          <Card style={styles.card}>
            <View style={styles.notice}>
              <Ionicons name="sparkles-outline" size={18} color={Light.gold} />
              <Text style={styles.noticeText}>
                Estes campos alimentam o score de compatibilidade com expositores e outros participantes.
              </Text>
            </View>

            <FieldGroup title="Atuação industrial">
              <Text style={styles.label}>Setor(es) de atuação</Text>
              <ChipGrid
                options={SECTORS}
                selected={form.sector ?? []}
                onToggle={(item) => toggleArrayItem('sector', item)}
              />

              <Text style={styles.label}>Papel de mercado</Text>
              <ChipGrid
                options={MARKET_ROLES}
                selected={form.marketRole ? [form.marketRole] : []}
                onToggle={(item) => set('marketRole', form.marketRole === item ? '' : item)}
              />
            </FieldGroup>

            <FieldGroup title="Objetivos e dores">
              <Text style={styles.label}>Objetivos no evento</Text>
              <ChipGrid
                options={OBJECTIVES}
                selected={form.objectives ?? []}
                onToggle={(item) => toggleArrayItem('objectives', item)}
              />

              <Text style={styles.label}>Gargalos da operação (até {MAX_BOTTLENECKS})</Text>
              <ChipGrid
                options={BOTTLENECK_OPTIONS}
                selected={form.bottlenecks ?? []}
                onToggle={(item) => toggleArrayItem('bottlenecks', item)}
              />
            </FieldGroup>

            <FieldGroup title="Interesses e orçamento">
              <Text style={styles.label}>Áreas de interesse (até {MAX_INTERESTS})</Text>
              <ChipGrid
                options={INTERESTS}
                selected={form.interests ?? []}
                onToggle={(item) => toggleArrayItem('interests', item)}
              />

              <Text style={styles.label}>Orçamento de investimento</Text>
              <ChipGrid
                options={BUDGET_OPTIONS}
                selected={form.budget ? [form.budget] : []}
                onToggle={(item) => set('budget', form.budget === item ? '' : item)}
              />

              <Text style={styles.label}>O que busca na feira?</Text>
              <TextInput
                value={form.lookingFor}
                onChangeText={(value) => set('lookingFor', value)}
                placeholder="Ex: fornecedores de automação, sensores, integração MES..."
                placeholderTextColor={Light.textMuted}
                style={styles.textInput}
              />

              <Text style={styles.label}>O que oferece?</Text>
              <TextInput
                value={form.offering}
                onChangeText={(value) => set('offering', value)}
                placeholder="Ex: serviços de engenharia, manutenção, usinagem..."
                placeholderTextColor={Light.textMuted}
                style={styles.textInput}
              />
            </FieldGroup>

            <FieldGroup title="Networking">
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Aparecer no Match de Pessoas</Text>
                  <Text style={styles.switchDescription}>
                    Permite que outros visitantes encontrem seu perfil nas sugestões.
                  </Text>
                </View>
                <Switch
                  value={form.discoverable ?? false}
                  onValueChange={(value) => set('discoverable', value)}
                  trackColor={{ false: Light.border, true: Light.gold }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Revelar dados de contato</Text>
                  <Text style={styles.switchDescription}>
                    Compartilha e-mail e telefone apenas com conexões aceitas.
                  </Text>
                </View>
                <Switch
                  value={form.shareContact ?? false}
                  onValueChange={(value) => set('shareContact', value)}
                  trackColor={{ false: Light.border, true: Light.gold }}
                  thumbColor="#fff"
                />
              </View>
            </FieldGroup>

            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Salvar preferências</Text>
                  <Ionicons name="checkmark" size={17} color="#fff" />
                </>
              )}
            </Pressable>
          </Card>
        </ScreenBody>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChipGrid<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: readonly T[];
  selected: string[];
  onToggle: (item: T) => void;
}) {
  return (
    <View style={styles.optionsGrid}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Pressable
            key={option}
            style={[styles.optionChip, isSelected && styles.optionChipActive]}
            onPress={() => onToggle(option)}>
            <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Light.bg,
  },
  card: { gap: Spacing.four },
  notice: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: Radius.sm,
    backgroundColor: '#FBF6E9',
    borderWidth: 1,
    borderColor: '#EFE0B9',
  },
  noticeText: { flex: 1, color: Light.textNavy, fontSize: 13, lineHeight: 19 },
  fieldGroup: { gap: Spacing.two },
  sectionTitle: { color: Light.navyDeep, fontSize: 16, fontWeight: '800' },
  label: {
    color: Light.goldTextStrong,
    fontSize: 12,
    fontWeight: '800',
    marginTop: Spacing.one,
    textTransform: 'uppercase',
  },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
  },
  optionChipActive: { backgroundColor: Light.navy, borderColor: Light.navy },
  optionChipText: { color: Light.textMuted, fontSize: 12.5, fontWeight: '600' },
  optionChipTextActive: { color: '#fff', fontWeight: '700' },
  textInput: {
    minHeight: 46,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Light.text,
    fontSize: 14.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Light.border,
    backgroundColor: '#FCFCFD',
  },
  switchTitle: { color: Light.textNavy, fontSize: 14, fontWeight: '800' },
  switchDescription: { color: Light.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  saveButton: {
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Light.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontSize: 14.5, fontWeight: '800' },
});
