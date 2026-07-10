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
import { exportLeadsCsv, useSavedLeads } from '@/features/visitor/leads';

type ArrayFieldKey = 'segments' | 'targetAudience' | 'lookingFor' | 'keywords';

const PUBLISHING_CHECKS = [
  { key: 'company', label: 'Nome da empresa' },
  { key: 'industry', label: 'Setor / indústria' },
  { key: 'about', label: 'Descrição institucional' },
  { key: 'contactEmail', label: 'E-mail comercial' },
  { key: 'contactPhone', label: 'Telefone / WhatsApp' },
] as const;

const PAGE_BG = '#fbfbfa';
const SURFACE = '#ffffff';
const SURFACE_MUTED = '#f4f4f5';
const BORDER = '#e4e4e7';
const TEXT_DARK = '#09090b';
const TEXT_MUTED = '#52525b';
const TEXT_FAINT = '#a1a1aa';
const GOLD = '#b39369';
const GOLD_SOFT = 'rgba(179, 147, 105, 0.10)';
const GOLD_BORDER = 'rgba(179, 147, 105, 0.24)';

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

function formatLeadDate(value?: number) {
  if (!value) return 'Data não informada';
  return new Date(value).toLocaleString('pt-BR');
}

export default function ExhibitorWebForm() {
  const insets = useSafeAreaInsets();
  const { user, initializing, signOut } = useAuth();
  const { exhibitor, loading } = useMyExhibitor();
  const { leads, loading: leadsLoading } = useSavedLeads();

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
              onSuccess={() => router.replace('/')}
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
          <View style={styles.sidebarPanel}>
            <View style={styles.sidebarHeader}>
              <View style={styles.brandRow}>
                <Image
                  source={require('@/assets/images/logo-apice.png')}
                  style={styles.apiceLogo}
                  resizeMode="contain"
                />
                <View style={styles.brandDivider} />
                <Image
                  source={require('@/assets/images/logo-expoindustrial.png')}
                  style={styles.expoLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.sidebarBadge}>Portal do Expositor</Text>
            </View>

            <View style={styles.menuList}>
              <SidebarItem icon="grid-outline" label="Prévia pública" active />
              <SidebarItem icon="business-outline" label="Identidade" />
              <SidebarItem icon="call-outline" label="Contato" />
              <SidebarItem icon="sparkles-outline" label="Matchmaking" />
            </View>

            <View style={styles.sidebarSummary}>
              <Text style={styles.sidebarSummaryLabel}>Status</Text>
              <Text style={styles.sidebarSummaryTitle}>{completion}% completo</Text>
              <Text style={styles.sidebarSummaryText}>
                {published
                  ? 'Seu perfil já está publicado no app.'
                  : 'O organizador publica após revisar estande e posição no mapa.'}
              </Text>
            </View>
          </View>

          <View style={styles.mainPanel}>
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
                    router.replace('/', { relativeToDirectory: true } as any);
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

          <View style={styles.leadsPanel}>
            <View style={styles.leadsHeader}>
              <View>
                <Text style={styles.panelKicker}>Leads em tempo real</Text>
                <Text style={styles.leadsTitle}>{leads.length} contato(s) captado(s)</Text>
                <Text style={styles.leadsSubtitle}>
                  Lista dos visitantes escaneados pela equipe do estande com este acesso.
                </Text>
              </View>
              {leads.length > 0 ? (
                <Pressable
                  style={styles.exportButton}
                  onPress={() =>
                    exportLeadsCsv(leads, 'leads-expositor').catch((err) =>
                      setError((err as Error).message),
                    )
                  }>
                  <Ionicons name="download-outline" size={16} color="#0A1021" />
                  <Text style={styles.exportButtonText}>Exportar CSV</Text>
                </Pressable>
              ) : null}
            </View>

            {leadsLoading ? (
              <ActivityIndicator color={GOLD} />
            ) : leads.length === 0 ? (
              <View style={styles.emptyLeads}>
                <Ionicons name="qr-code-outline" size={24} color={TEXT_FAINT} />
                <Text style={styles.emptyLeadsText}>
                  Nenhum lead captado ainda. Use o perfil do expositor no app para escanear o QR Code
                  do crachá do visitante.
                </Text>
              </View>
            ) : (
              <View style={styles.leadsList}>
                {leads.map((lead) => (
                  <View key={lead.id} style={styles.leadCard}>
                    <View style={styles.leadTop}>
                      <View style={styles.leadAvatar}>
                        <Text style={styles.leadAvatarText}>
                          {(lead.name || 'LD').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.leadCopy}>
                        <Text style={styles.leadName}>{lead.name || 'Contato sem nome'}</Text>
                        <Text style={styles.leadMeta}>
                          {lead.role || 'Cargo não informado'} · {lead.company || 'Empresa não informada'}
                        </Text>
                      </View>
                      <Text style={styles.leadDate}>{formatLeadDate(lead.createdAt)}</Text>
                    </View>
                    <View style={styles.leadDetails}>
                      <Text style={styles.leadDetailText}>{lead.email || 'Sem e-mail'}</Text>
                      <Text style={styles.leadDetailText}>{lead.phone || 'Sem telefone'}</Text>
                      <Text style={styles.leadDetailText}>{lead.source || 'Origem não informada'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
                placeholder="Descreva a empresa, diferenciais e atuação no mercado."
                placeholderTextColor={Brand.textMuted}
                multiline
              />
            </Field>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SidebarItem({
  icon,
  label,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
}) {
  return (
    <View style={[styles.sidebarItem, active && styles.sidebarItemActive]}>
      <Ionicons name={icon} size={18} color={active ? GOLD : TEXT_DARK} />
      <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>{label}</Text>
    </View>
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
    backgroundColor: PAGE_BG,
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PAGE_BG,
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
    color: GOLD,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  authTitle: {
    color: TEXT_DARK,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
  },
  authLead: {
    color: TEXT_MUTED,
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
    color: TEXT_MUTED,
    fontSize: 14.5,
    lineHeight: 20,
    flex: 1,
  },
  authCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 360,
    maxWidth: 430,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: Spacing.four,
  },
  formContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  formShell: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  sidebarPanel: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 260,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sidebarHeader: {
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    padding: Spacing.three,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  apiceLogo: {
    height: 30,
    width: 82,
  },
  brandDivider: {
    backgroundColor: BORDER,
    height: 24,
    width: 1,
  },
  expoLogo: {
    height: 28,
    width: 112,
  },
  sidebarBadge: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    borderRadius: 4,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
    paddingHorizontal: 7,
    paddingVertical: 3,
    textTransform: 'uppercase',
  },
  menuList: {
    gap: 4,
    padding: Spacing.two,
  },
  sidebarItem: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 11,
  },
  sidebarItemActive: {
    backgroundColor: GOLD_SOFT,
  },
  sidebarItemText: {
    color: TEXT_MUTED,
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarItemTextActive: {
    color: GOLD,
  },
  sidebarSummary: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 4,
    padding: Spacing.three,
  },
  sidebarSummaryLabel: {
    color: TEXT_FAINT,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sidebarSummaryTitle: {
    color: TEXT_DARK,
    fontSize: 18,
    fontWeight: '900',
  },
  sidebarSummaryText: {
    color: TEXT_MUTED,
    fontSize: 12.5,
    lineHeight: 18,
  },
  mainPanel: {
    flex: 1,
    gap: Spacing.three,
    minWidth: 0,
  },
  formHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: Spacing.four,
  },
  headerCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 420,
    gap: Spacing.two,
  },
  formTitle: {
    color: TEXT_DARK,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  formSubtitle: {
    color: TEXT_MUTED,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 640,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  userEmail: {
    color: TEXT_FAINT,
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
    borderRadius: 8,
    backgroundColor: GOLD,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  secondaryButtonText: {
    color: TEXT_MUTED,
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
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  completionPanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 330,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  panelKicker: {
    color: TEXT_FAINT,
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
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLogoText: {
    color: GOLD,
    fontSize: 28,
    fontWeight: '900',
  },
  previewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  previewCompany: {
    color: TEXT_DARK,
    fontSize: 22,
    fontWeight: '900',
  },
  previewMeta: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '700',
  },
  previewAbout: {
    color: TEXT_MUTED,
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
    color: TEXT_MUTED,
    fontSize: 13,
  },
  completionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  completionHint: {
    color: TEXT_MUTED,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 4,
  },
  completionScore: {
    color: GOLD,
    fontSize: 30,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: SURFACE_MUTED,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: GOLD,
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
    color: TEXT_FAINT,
    fontSize: 12.5,
    flex: 1,
  },
  checkTextDone: {
    color: TEXT_MUTED,
  },
  leadsPanel: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  leadsHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  leadsTitle: {
    color: TEXT_DARK,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  leadsSubtitle: {
    color: TEXT_MUTED,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 11,
  },
  exportButtonText: {
    color: '#0A1021',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyLeads: {
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: SURFACE_MUTED,
    padding: Spacing.four,
  },
  emptyLeadsText: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  leadsList: {
    gap: Spacing.two,
  },
  leadCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: SURFACE,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  leadTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  leadAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '900',
  },
  leadCopy: {
    flex: 1,
    minWidth: 180,
  },
  leadName: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: '900',
  },
  leadMeta: {
    color: TEXT_MUTED,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  leadDate: {
    color: TEXT_FAINT,
    fontSize: 11.5,
    fontWeight: '700',
  },
  leadDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  leadDetailText: {
    color: TEXT_MUTED,
    fontSize: 12.5,
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
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: TEXT_DARK,
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: TEXT_MUTED,
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
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    color: TEXT_FAINT,
    fontSize: 12.5,
    lineHeight: 18,
  },
  input: {
    minHeight: 46,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    color: TEXT_DARK,
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
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: SURFACE,
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
    backgroundColor: SURFACE_MUTED,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoActions: {
    flex: 1,
    gap: Spacing.two,
  },
  uploadButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    backgroundColor: GOLD_SOFT,
    paddingHorizontal: Spacing.three,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  uploadButtonText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '800',
  },
  removeLogoButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  removeLogoButtonText: {
    color: TEXT_FAINT,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 8,
    padding: Spacing.four,
  },
  bottomTitle: {
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: '900',
  },
  bottomText: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  bottomSave: {
    minWidth: 172,
  },
});
