import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { AuthForm } from '@/features/auth/auth-form';
import { authErrorMessage, useAuth } from '@/features/auth/use-auth';
import {
  EMPTY_FORM,
  saveMyExhibitor,
  toFormData,
  useMyExhibitor,
  uploadExhibitorLogo,
  type ExhibitorFormData,
} from '@/features/exhibitors/my-exhibitor';

type ArrayFieldKey = 'products' | 'segments' | 'targetAudience' | 'lookingFor' | 'keywords';

const PUBLISHING_CHECKS = [
  { key: 'company', label: 'Nome da empresa' },
  { key: 'industry', label: 'Setor / indústria' },
  { key: 'about', label: 'Descrição institucional' },
  { key: 'products', label: 'Produtos ou soluções' },
  { key: 'contactEmail', label: 'E-mail comercial' },
  { key: 'contactPhone', label: 'Telefone / WhatsApp' },
] as const;

function cleanList(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeInstagram(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function normalizeForm(data: ExhibitorFormData): ExhibitorFormData {
  return {
    ...data,
    company: data.company.trim(),
    logo: data.logo.trim().toUpperCase(),
    logoUrl: data.logoUrl?.trim() || '',
    industry: data.industry.trim(),
    about: data.about.trim(),
    contactName: data.contactName.trim(),
    contactRole: data.contactRole.trim(),
    contactEmail: data.contactEmail.trim().toLowerCase(),
    contactPhone: data.contactPhone.trim(),
    website: normalizeWebsite(data.website),
    instagram: normalizeInstagram(data.instagram),
    linkedin: data.linkedin.trim(),
    products: cleanList(data.products),
    segments: cleanList(data.segments),
    targetAudience: cleanList(data.targetAudience),
    lookingFor: cleanList(data.lookingFor),
    keywords: cleanList(data.keywords),
  };
}

function getFormError(data: ExhibitorFormData) {
  if (!data.company.trim()) return 'Informe ao menos o nome da empresa.';
  if (data.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail.trim())) {
    return 'Informe um e-mail comercial válido.';
  }
  if (data.website.trim() && !/^https?:\/\/[^.\s]+\.[^\s]+/i.test(normalizeWebsite(data.website))) {
    return 'Informe um site válido, como empresa.com.br.';
  }
  return null;
}

function getFilledChecks(data: ExhibitorFormData) {
  return PUBLISHING_CHECKS.filter((check) => {
    const value = data[check.key];
    return Array.isArray(value) ? cleanList(value).length > 0 : Boolean(value.trim());
  });
}

export default function ExhibitorWebForm() {
  const insets = useSafeAreaInsets();
  const { user, initializing, signOut } = useAuth();
  const { exhibitor, loading } = useMyExhibitor();

  const [form, setForm] = useState<ExhibitorFormData>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [logoUriToUpload, setLogoUriToUpload] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setForm(EMPTY_FORM);
        setHydrated(false);
        setLogoUriToUpload(null);
        setSaved(false);
      });
      return () => {
        active = false;
      };
    }
  }, [user]);

  useEffect(() => {
    if (user && !hydrated && !loading) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        if (exhibitor) setForm(toFormData(exhibitor));
        setHydrated(true);
      });
      return () => {
        active = false;
      };
    }
  }, [user, hydrated, loading, exhibitor]);

  function set<K extends keyof ExhibitorFormData>(key: K, value: ExhibitorFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function setArrayItem(key: ArrayFieldKey, index: number, value: string) {
    setForm((current) => {
      const items = [...current[key]];
      items[index] = value;
      return { ...current, [key]: items };
    });
    setSaved(false);
  }

  function addArrayItem(key: ArrayFieldKey, value: string) {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    setForm((current) => ({ ...current, [key]: [...current[key], cleanValue] }));
    setSaved(false);
  }

  function removeArrayItem(key: ArrayFieldKey, index: number) {
    setForm((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
    setSaved(false);
  }

  async function onPickImage() {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Permissão de acesso à galeria de fotos é necessária.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.86,
      });

      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        setLogoUriToUpload(uri);
        set('logoUrl', uri);
      }
    } catch (err) {
      setError('Erro ao selecionar imagem.');
      console.error(err);
    }
  }

  async function onSave() {
    setError(null);
    const normalized = normalizeForm(form);
    const formError = getFormError(normalized);
    if (formError) {
      setError(formError);
      return;
    }

    setBusy(true);
    try {
      let finalLogoUrl = normalized.logoUrl;
      if (logoUriToUpload) finalLogoUrl = await uploadExhibitorLogo(logoUriToUpload);
      await saveMyExhibitor({ ...normalized, logoUrl: finalLogoUrl });
      setForm({ ...normalized, logoUrl: finalLogoUrl });
      setLogoUriToUpload(null);
      setSaved(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (initializing) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={Brand.gold} />
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.authContent,
          { paddingTop: Math.max(insets.top, Spacing.five), paddingBottom: Spacing.five },
        ]}>
        <View style={styles.authShell}>
          <View style={styles.authIntro}>
            <Text style={styles.brandLabel}>Expoindustrial Sul</Text>
            <Text style={styles.authTitle}>Cadastro do expositor</Text>
            <Text style={styles.authLead}>
              Atualize as informações que aparecem na busca, no perfil da empresa e nas recomendações
              do app do evento.
            </Text>
            <View style={styles.authHighlights}>
              <Highlight icon="business-outline" text="Dados institucionais e contato comercial" />
              <Highlight icon="image-outline" text="Upload da logo para o perfil público" />
              <Highlight icon="search-outline" text="Palavras-chave para busca e matchmaking" />
            </View>
          </View>

          <View style={styles.authCard}>
            <AuthForm
              title="Acessar cadastro"
              icon="briefcase"
              subtitle={{
                login: 'Entre com o e-mail da empresa para revisar o cadastro.',
                signup: 'Crie o acesso da empresa para preencher o perfil público.',
              }}
              onSuccess={() => router.replace('/preencher')}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (loading && !hydrated) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={Brand.gold} />
      </View>
    );
  }

  const published = exhibitor?.status === 'published';
  const filledChecks = getFilledChecks(form);
  const completion = Math.round((filledChecks.length / PUBLISHING_CHECKS.length) * 100);
  const missingChecks = PUBLISHING_CHECKS.filter(
    (check) => !filledChecks.some((filled) => filled.key === check.key),
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.formContent,
          { paddingTop: Math.max(insets.top + Spacing.three, Spacing.four) },
        ]}>
        <View style={styles.formShell}>
          <View style={styles.formHeader}>
            <View style={styles.headerCopy}>
              <Text style={styles.brandLabel}>Expoindustrial Sul</Text>
              <Text style={styles.formTitle}>Informações do expositor</Text>
              <Text style={styles.formSubtitle}>
                Este formulário é otimizado para preenchimento via web. Os campos são usados no app
                do evento, busca, perfil público e matchmaking.
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Text selectable style={styles.userEmail}>
                {user.email}
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={async () => {
                    await signOut();
                    router.replace('/preencher');
                  }}
                  disabled={busy}>
                  <Ionicons name="log-out-outline" size={16} color={Brand.textSecondary} />
                  <Text style={styles.secondaryButtonText}>Sair</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, busy && styles.buttonDisabled]}
                  onPress={onSave}
                  disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color="#0A1021" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={17} color="#0A1021" />
                      <Text style={styles.primaryButtonText}>Salvar</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.dashboardGrid}>
            <View style={styles.previewPanel}>
              <Text style={styles.panelKicker}>Prévia pública</Text>
              <View style={styles.previewRow}>
                {form.logoUrl ? (
                  <Image source={{ uri: form.logoUrl }} style={styles.previewLogo} />
                ) : (
                  <View style={styles.previewLogoFallback}>
                    <Text style={styles.previewLogoText}>
                      {(form.logo || form.company || 'EX').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.previewCopy}>
                  <Text style={styles.previewCompany} numberOfLines={1}>
                    {form.company || 'Nome da empresa'}
                  </Text>
                  <Text style={styles.previewMeta} numberOfLines={1}>
                    {form.industry || 'Setor / indústria'} · {exhibitor?.stand || 'Estande a definir'}
                  </Text>
                  <Text style={styles.previewAbout} numberOfLines={3}>
                    {form.about || 'Resumo que visitantes verão ao abrir o perfil do expositor.'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, published ? styles.statusPublished : styles.statusDraft]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: published ? Brand.success : Brand.warning },
                  ]}
                />
                <Text style={styles.statusText}>
                  {published
                    ? 'Publicado no app'
                    : 'Em análise para publicação pelo organizador'}
                </Text>
              </View>
            </View>

            <View style={styles.completionPanel}>
              <View style={styles.completionTop}>
                <View>
                  <Text style={styles.panelKicker}>Checklist</Text>
                  <Text style={styles.completionHint}>
                    {missingChecks.length
                      ? `Faltam ${missingChecks.length} informações importantes.`
                      : 'Cadastro bem preenchido para busca e matchmaking.'}
                  </Text>
                </View>
                <Text style={styles.completionScore}>{completion}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completion}%` }]} />
              </View>
              <View style={styles.checkGrid}>
                {PUBLISHING_CHECKS.map((check) => {
                  const done = filledChecks.some((filled) => filled.key === check.key);
                  return (
                    <View key={check.key} style={styles.checkItem}>
                      <Ionicons
                        name={done ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={done ? Brand.success : Brand.textMuted}
                      />
                      <Text style={[styles.checkText, done && styles.checkTextDone]}>
                        {check.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {error && (
            <View style={styles.feedbackError}>
              <Ionicons name="alert-circle-outline" size={18} color={Brand.danger} />
              <Text style={styles.feedbackErrorText}>{error}</Text>
            </View>
          )}
          {saved && (
            <View style={styles.feedbackSuccess}>
              <Ionicons name="checkmark-circle" size={18} color={Brand.success} />
              <Text style={styles.feedbackSuccessText}>Cadastro salvo com sucesso.</Text>
            </View>
          )}

          <Section
            title="Identidade pública"
            subtitle="Informações principais exibidas no perfil da empresa.">
            <View style={styles.twoColumn}>
              <Field label="Nome da empresa *">
                <TextInput
                  style={styles.input}
                  value={form.company}
                  onChangeText={(value) => set('company', value)}
                  placeholder="Ex.: Siemens Digital Industries"
                  placeholderTextColor={Brand.textMuted}
                />
              </Field>

              <Field label="Setor / indústria">
                <TextInput
                  style={styles.input}
                  value={form.industry}
                  onChangeText={(value) => set('industry', value)}
                  placeholder="Ex.: Automação & Robótica"
                  placeholderTextColor={Brand.textMuted}
                />
              </Field>
            </View>

            <View style={styles.twoColumn}>
              <Field label="Logo (imagem)">
                <View style={styles.logoUpload}>
                  {form.logoUrl ? (
                    <Image source={{ uri: form.logoUrl }} style={styles.logoPreview} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Ionicons name="image-outline" size={28} color={Brand.textMuted} />
                    </View>
                  )}
                  <View style={styles.logoActions}>
                    <Pressable style={styles.uploadButton} onPress={onPickImage} disabled={busy}>
                      <Ionicons name="cloud-upload-outline" size={17} color={Brand.gold} />
                      <Text style={styles.uploadButtonText}>
                        {form.logoUrl ? 'Alterar imagem' : 'Selecionar imagem'}
                      </Text>
                    </Pressable>
                    {form.logoUrl && (
                      <Pressable
                        style={styles.removeLogoButton}
                        onPress={() => {
                          set('logoUrl', '');
                          setLogoUriToUpload(null);
                        }}
                        disabled={busy}>
                        <Text style={styles.removeLogoButtonText}>Remover</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Field>

              <Field label="Logo (sigla/texto)" hint="Usado quando a imagem não estiver disponível.">
                <TextInput
                  style={styles.input}
                  value={form.logo}
                  onChangeText={(value) => set('logo', value)}
                  placeholder="Ex.: SIEMENS"
                  placeholderTextColor={Brand.textMuted}
                  autoCapitalize="characters"
                />
              </Field>
            </View>

            <Field label="Sobre a empresa">
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.about}
                onChangeText={(value) => set('about', value)}
                placeholder="Descreva soluções, diferenciais e o que será apresentado no evento."
                placeholderTextColor={Brand.textMuted}
                multiline
              />
            </Field>

            <ArrayField
              label="Produtos / soluções"
              items={form.products}
              placeholder="Adicionar produto ou solução"
              onAdd={(value) => addArrayItem('products', value)}
              onChange={(index, value) => setArrayItem('products', index, value)}
              onRemove={(index) => removeArrayItem('products', index)}
            />
          </Section>

          <Section
            title="Contato comercial"
            subtitle="Canais usados por visitantes interessados em falar com a empresa.">
            <View style={styles.twoColumn}>
              <Field label="Nome do contato">
                <TextInput
                  style={styles.input}
                  value={form.contactName}
                  onChangeText={(value) => set('contactName', value)}
                  placeholder="Nome e sobrenome"
                  placeholderTextColor={Brand.textMuted}
                />
              </Field>
              <Field label="Cargo">
                <TextInput
                  style={styles.input}
                  value={form.contactRole}
                  onChangeText={(value) => set('contactRole', value)}
                  placeholder="Ex.: Gerente Comercial"
                  placeholderTextColor={Brand.textMuted}
                />
              </Field>
            </View>

            <View style={styles.twoColumn}>
              <Field label="E-mail comercial">
                <TextInput
                  style={styles.input}
                  value={form.contactEmail}
                  onChangeText={(value) => set('contactEmail', value)}
                  placeholder="comercial@empresa.com"
                  placeholderTextColor={Brand.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </Field>
              <Field label="Telefone / WhatsApp">
                <TextInput
                  style={styles.input}
                  value={form.contactPhone}
                  onChangeText={(value) => set('contactPhone', value)}
                  placeholder="(47) 99999-9999"
                  placeholderTextColor={Brand.textMuted}
                  keyboardType="phone-pad"
                />
              </Field>
            </View>

            <Field label="Site">
              <TextInput
                style={styles.input}
                value={form.website}
                onChangeText={(value) => set('website', value)}
                placeholder="https://www.empresa.com.br"
                placeholderTextColor={Brand.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </Field>

            <View style={styles.twoColumn}>
              <Field label="Instagram">
                <TextInput
                  style={styles.input}
                  value={form.instagram}
                  onChangeText={(value) => set('instagram', value)}
                  placeholder="@empresa"
                  placeholderTextColor={Brand.textMuted}
                  autoCapitalize="none"
                />
              </Field>
              <Field label="LinkedIn">
                <TextInput
                  style={styles.input}
                  value={form.linkedin}
                  onChangeText={(value) => set('linkedin', value)}
                  placeholder="linkedin.com/company/empresa"
                  placeholderTextColor={Brand.textMuted}
                  autoCapitalize="none"
                />
              </Field>
            </View>
          </Section>

          <Section
            title="Busca e matchmaking"
            subtitle="Termos que ajudam visitantes certos a encontrarem sua empresa.">
            <View style={styles.twoColumn}>
              <ArrayField
                label="Segmentos atendidos"
                hint="Ex.: metal-mecânica, alimentos, automotivo."
                items={form.segments}
                placeholder="Adicionar segmento"
                onAdd={(value) => addArrayItem('segments', value)}
                onChange={(index, value) => setArrayItem('segments', index, value)}
                onRemove={(index) => removeArrayItem('segments', index)}
              />
              <ArrayField
                label="Público-alvo"
                hint="Perfis de visitantes ou empresas ideais."
                items={form.targetAudience}
                placeholder="Adicionar público"
                onAdd={(value) => addArrayItem('targetAudience', value)}
                onChange={(index, value) => setArrayItem('targetAudience', index, value)}
                onRemove={(index) => removeArrayItem('targetAudience', index)}
              />
            </View>

            <View style={styles.twoColumn}>
              <ArrayField
                label="O que sua empresa busca na feira"
                items={form.lookingFor}
                placeholder="Ex.: distribuidores, compradores, integradores"
                onAdd={(value) => addArrayItem('lookingFor', value)}
                onChange={(index, value) => setArrayItem('lookingFor', index, value)}
                onRemove={(index) => removeArrayItem('lookingFor', index)}
              />
              <ArrayField
                label="Palavras-chave"
                hint="Termos curtos para busca e assistente."
                items={form.keywords}
                placeholder="Ex.: CLP, manutenção, energia"
                onAdd={(value) => addArrayItem('keywords', value)}
                onChange={(index, value) => setArrayItem('keywords', index, value)}
                onRemove={(index) => removeArrayItem('keywords', index)}
              />
            </View>
          </Section>

          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.bottomTitle}>Revisão final</Text>
              <Text style={styles.bottomText}>
                O organizador valida estande, posição no mapa e publicação.
              </Text>
            </View>
            <Pressable
              style={[styles.primaryButton, styles.bottomSave, busy && styles.buttonDisabled]}
              onPress={onSave}
              disabled={busy}>
              {busy ? (
                <ActivityIndicator color="#0A1021" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={17} color="#0A1021" />
                  <Text style={styles.primaryButtonText}>Salvar cadastro</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Highlight({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.highlight}>
      <Ionicons name={icon} size={18} color={Brand.gold} />
      <Text style={styles.highlightText}>{text}</Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function ArrayField({
  label,
  hint,
  items,
  placeholder,
  onAdd,
  onChange,
  onRemove,
}: {
  label: string;
  hint?: string;
  items: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState('');

  function addDraft() {
    const cleanValue = draft.trim();
    if (!cleanValue) return;
    onAdd(cleanValue);
    setDraft('');
  }

  return (
    <Field label={label} hint={hint}>
      <View style={styles.arrayList}>
        {items.map((item, index) => (
          <View key={`${label}-${index}`} style={styles.arrayRow}>
            <TextInput
              style={[styles.input, styles.arrayInput]}
              value={item}
              onChangeText={(value) => onChange(index, value)}
              placeholder={label}
              placeholderTextColor={Brand.textMuted}
            />
            <Pressable style={styles.iconButton} onPress={() => onRemove(index)}>
              <Ionicons name="close" size={18} color={Brand.textMuted} />
            </Pressable>
          </View>
        ))}

        <View style={styles.arrayRow}>
          <TextInput
            style={[styles.input, styles.arrayInput]}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addDraft}
            placeholder={placeholder}
            placeholderTextColor={Brand.textMuted}
          />
          <Pressable style={styles.addButton} onPress={addDraft}>
            <Ionicons name="add" size={18} color="#0A1021" />
          </Pressable>
        </View>
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bgPrimary,
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.bgPrimary,
  },
  authContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  authShell: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authIntro: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 420,
    maxWidth: 560,
    gap: Spacing.three,
  },
  brandLabel: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  authTitle: {
    color: Brand.textPrimary,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
  },
  authLead: {
    color: Brand.textSecondary,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 520,
  },
  authHighlights: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  highlightText: {
    color: Brand.textSecondary,
    fontSize: 14.5,
    lineHeight: 20,
    flex: 1,
  },
  authCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 360,
    maxWidth: 430,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  formContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  formShell: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  formHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  headerCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 420,
    gap: Spacing.two,
  },
  formTitle: {
    color: Brand.textPrimary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  formSubtitle: {
    color: Brand.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 640,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  userEmail: {
    color: Brand.textMuted,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: Radius.sm,
    backgroundColor: Brand.gold,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryButtonText: {
    color: '#0A1021',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  secondaryButtonText: {
    color: Brand.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  previewPanel: {
    flexGrow: 2,
    flexShrink: 1,
    flexBasis: 520,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  completionPanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 330,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  panelKicker: {
    color: Brand.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  previewLogo: {
    width: 104,
    height: 104,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
  },
  previewLogoFallback: {
    width: 104,
    height: 104,
    borderRadius: Radius.sm,
    backgroundColor: Brand.goldSoft,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLogoText: {
    color: Brand.gold,
    fontSize: 28,
    fontWeight: '900',
  },
  previewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  previewCompany: {
    color: Brand.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  previewMeta: {
    color: Brand.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  previewAbout: {
    color: Brand.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  statusPublished: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  statusDraft: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: Brand.textSecondary,
    fontSize: 13,
  },
  completionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  completionHint: {
    color: Brand.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 4,
  },
  completionScore: {
    color: Brand.gold,
    fontSize: 30,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Brand.gold,
  },
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  checkItem: {
    minWidth: 148,
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    color: Brand.textMuted,
    fontSize: 12.5,
    flex: 1,
  },
  checkTextDone: {
    color: Brand.textSecondary,
  },
  feedbackError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  feedbackErrorText: {
    color: Brand.danger,
    fontSize: 13.5,
    flex: 1,
  },
  feedbackSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.22)',
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  feedbackSuccessText: {
    color: Brand.success,
    fontSize: 13.5,
    flex: 1,
  },
  section: {
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: Brand.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: Brand.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionBody: {
    gap: Spacing.three,
  },
  twoColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  field: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 280,
    gap: 7,
  },
  label: {
    color: Brand.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    color: Brand.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  input: {
    minHeight: 46,
    backgroundColor: Brand.bgPrimary,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    color: Brand.textPrimary,
    fontSize: 15,
  },
  textarea: {
    minHeight: 126,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  logoUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    backgroundColor: Brand.bgPrimary,
    padding: Spacing.three,
  },
  logoPreview: {
    width: 78,
    height: 78,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
  },
  logoPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: Radius.sm,
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoActions: {
    flex: 1,
    gap: Spacing.two,
  },
  uploadButton: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    backgroundColor: Brand.goldSoft,
    paddingHorizontal: Spacing.three,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  uploadButtonText: {
    color: Brand.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  removeLogoButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  removeLogoButtonText: {
    color: Brand.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
  },
  arrayList: {
    gap: Spacing.two,
  },
  arrayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  arrayInput: {
    flex: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  bottomTitle: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  bottomText: {
    color: Brand.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  bottomSave: {
    minWidth: 172,
  },
});
