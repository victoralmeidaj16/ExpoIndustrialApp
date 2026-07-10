import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

import { Light, Radius, Spacing } from '@/constants/theme';
import { useAdminRole } from '@/features/admin/use-admin';
import { authErrorMessage, useAuth } from '@/features/auth/use-auth';
import {
  EMPTY_FORM,
  saveMyExhibitor,
  toFormData,
  useMyExhibitor,
  uploadExhibitorLogo,
  type ExhibitorFormData,
} from '@/features/exhibitors/my-exhibitor';

type ArrayFieldKey = 'segments' | 'targetAudience' | 'lookingFor' | 'keywords';

const PUBLISHING_CHECKS = [
  { key: 'company', label: 'Nome da empresa' },
  { key: 'industry', label: 'Setor / indústria' },
  { key: 'about', label: 'Descrição institucional' },
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
    segments: cleanList(data.segments),
    targetAudience: cleanList(data.targetAudience),
    lookingFor: cleanList(data.lookingFor),
    keywords: cleanList(data.keywords),
  };
}

function getFilledChecks(data: ExhibitorFormData) {
  return PUBLISHING_CHECKS.filter((check) => {
    const value = data[check.key];
    return Array.isArray(value) ? cleanList(value).length > 0 : Boolean(value.trim());
  });
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

export default function PortalEmpresa() {
  const insets = useSafeAreaInsets();
  const { user, initializing, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { exhibitor, loading } = useMyExhibitor();

  const [form, setForm] = useState<ExhibitorFormData>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [logoUriToUpload, setLogoUriToUpload] = useState<string | null>(null);
  const portalUrl = useMemo(() => Linking.createURL('/portal'), []);

  useEffect(() => {
    if (!hydrated && !loading) {
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
  }, [hydrated, loading, exhibitor]);

  if (!initializing && !user) return <Redirect href="/portal/login" />;

  function set<K extends keyof ExhibitorFormData>(key: K, value: ExhibitorFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function setArrayItem(key: ArrayFieldKey, index: number, value: string) {
    setForm((f) => {
      const items = [...f[key]];
      items[index] = value;
      return { ...f, [key]: items };
    });
    setSaved(false);
  }

  function addArrayItem(key: ArrayFieldKey, value: string) {
    if (!value.trim()) return;
    setForm((f) => ({ ...f, [key]: [...f[key], value] }));
    setSaved(false);
  }

  function removeArrayItem(key: ArrayFieldKey, index: number) {
    setForm((f) => ({
      ...f,
      [key]: f[key].filter((_, idx) => idx !== index),
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
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
      if (logoUriToUpload) {
        finalLogoUrl = await uploadExhibitorLogo(logoUriToUpload);
      }
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

  if (initializing || (loading && !hydrated)) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={Light.gold} />
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
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: 160 },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable style={styles.back} onPress={() => router.replace('/')}>
            <Ionicons name="chevron-back" size={20} color={Light.textMuted} />
            <Text style={styles.backText}>App</Text>
          </Pressable>
          <View style={styles.topActions}>
            {isAdmin && (
              <Pressable style={styles.adminLink} onPress={() => router.replace('/portal/admin')}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Light.gold} />
                <Text style={styles.adminLinkText}>Controle</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.signOut}
              onPress={async () => {
                await signOut();
                router.replace('/portal/login');
              }}>
              <Text style={styles.signOutText}>Sair</Text>
              <Ionicons name="log-out-outline" size={18} color={Light.textMuted} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.title}>Dados da empresa</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.intro}>
          Preencha as informações institucionais usadas no app da feira, busca e matchmaking.
          Estande, área, categoria e posição no mapa são validados pelo organizador.
        </Text>

        <View style={styles.portalCard}>
          <View style={styles.portalIcon}>
            <Ionicons name="link-outline" size={20} color={Light.gold} />
          </View>
          <View style={styles.portalCopy}>
            <Text style={styles.portalTitle}>Link para expositores</Text>
            <Text style={styles.portalText}>
              Envie este endereço para a equipe que vai preencher ou revisar o cadastro.
            </Text>
            <Text selectable style={styles.portalUrl}>
              {portalUrl}
            </Text>
          </View>
        </View>

        <View style={[styles.statusPill, published ? styles.statusPub : styles.statusDraft]}>
          <View
            style={[styles.statusDot, { backgroundColor: published ? Light.success : Light.warning }]}
          />
          <Text style={styles.statusText}>
            {published
              ? 'Publicado - visível no app'
              : 'Em análise - será publicado após aprovação do organizador'}
          </Text>
        </View>

        <View style={styles.completionCard}>
          <View style={styles.completionTop}>
            <View>
              <Text style={styles.completionLabel}>Pronto para publicação</Text>
              <Text style={styles.completionHint}>
                {missingChecks.length
                  ? `Faltam ${missingChecks.length} informações importantes.`
                  : 'Cadastro público bem preenchido para busca e matchmaking.'}
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
                    color={done ? Light.success : Light.textMuted}
                  />
                  <Text style={[styles.checkText, done && styles.checkTextDone]}>{check.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewKicker}>Prévia no app</Text>
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
                {form.industry || 'Setor'} · {exhibitor?.stand || 'Estande a confirmar'}
              </Text>
              <Text style={styles.previewAbout} numberOfLines={2}>
                {form.about || 'Resumo que visitantes verão ao abrir o perfil do expositor.'}
              </Text>
            </View>
          </View>
        </View>

        <SectionTitle title="Perfil público" />

        <Field label="Nome da empresa *">
          <TextInput
            style={styles.input}
            value={form.company}
            onChangeText={(v) => set('company', v)}
            placeholder="Ex.: Siemens Digital Industries"
            placeholderTextColor={Light.textMuted}
          />
        </Field>

        <Field label="Logo (sigla/texto)" hint="Usado para identificações textuais simples do estande.">
          <TextInput
            style={styles.input}
            value={form.logo}
            onChangeText={(v) => set('logo', v)}
            placeholder="Ex.: SIEMENS"
            placeholderTextColor={Light.textMuted}
            autoCapitalize="characters"
          />
        </Field>

        <Field label="Logo (imagem)">
          <View style={styles.imageUploadContainer}>
            {form.logoUrl ? (
              <Image source={{ uri: form.logoUrl }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={32} color={Light.textMuted} />
              </View>
            )}
            <View style={styles.imageUploadButtons}>
              <Pressable style={styles.uploadBtn} onPress={onPickImage}>
                <Text style={styles.uploadBtnText}>
                  {form.logoUrl ? 'Alterar imagem' : 'Selecionar imagem'}
                </Text>
              </Pressable>
              {form.logoUrl && (
                <Pressable
                  style={styles.removeImageBtn}
                  onPress={() => {
                    set('logoUrl', '');
                    setLogoUriToUpload(null);
                  }}>
                  <Text style={styles.removeImageBtnText}>Remover</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Field>

        <Field label="Setor / indústria">
          <TextInput
            style={styles.input}
            value={form.industry}
            onChangeText={(v) => set('industry', v)}
            placeholder="Ex.: Automação & Robótica"
            placeholderTextColor={Light.textMuted}
          />
        </Field>

        <Field label="Sobre a empresa">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.about}
            onChangeText={(v) => set('about', v)}
            placeholder="Descreva a empresa, diferenciais e atuação no mercado."
            placeholderTextColor={Light.textMuted}
            multiline
          />
        </Field>

        <SectionTitle title="Matchmaking" />

        <ArrayField
          label="Segmentos atendidos"
          hint="Ex.: metal-mecânica, alimentos, automotivo, plástico."
          items={form.segments}
          placeholder="Adicionar segmento"
          onAdd={(value) => addArrayItem('segments', value)}
          onChange={(index, value) => setArrayItem('segments', index, value)}
          onRemove={(index) => removeArrayItem('segments', index)}
        />

        <ArrayField
          label="Público-alvo"
          hint="Ajuda o app a recomendar sua empresa para visitantes certos."
          items={form.targetAudience}
          placeholder="Adicionar público"
          onAdd={(value) => addArrayItem('targetAudience', value)}
          onChange={(index, value) => setArrayItem('targetAudience', index, value)}
          onRemove={(index) => removeArrayItem('targetAudience', index)}
        />

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

        <SectionTitle title="Contato comercial" />

        <Field label="Nome do contato">
          <TextInput
            style={styles.input}
            value={form.contactName}
            onChangeText={(v) => set('contactName', v)}
            placeholder="Nome e sobrenome"
            placeholderTextColor={Light.textMuted}
          />
        </Field>

        <Field label="Cargo">
          <TextInput
            style={styles.input}
            value={form.contactRole}
            onChangeText={(v) => set('contactRole', v)}
            placeholder="Ex.: Gerente Comercial"
            placeholderTextColor={Light.textMuted}
          />
        </Field>

        <View style={styles.row}>
          <Field label="E-mail comercial" style={styles.rowField}>
            <TextInput
              style={styles.input}
              value={form.contactEmail}
              onChangeText={(v) => set('contactEmail', v)}
              placeholder="comercial@empresa.com"
              placeholderTextColor={Light.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Field>
          <Field label="Telefone / WhatsApp" style={styles.rowField}>
            <TextInput
              style={styles.input}
              value={form.contactPhone}
              onChangeText={(v) => set('contactPhone', v)}
              placeholder="(47) 99999-9999"
              placeholderTextColor={Light.textMuted}
              keyboardType="phone-pad"
            />
          </Field>
        </View>

        <Field label="Site">
          <TextInput
            style={styles.input}
            value={form.website}
            onChangeText={(v) => set('website', v)}
            placeholder="https://www.empresa.com.br"
            placeholderTextColor={Light.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </Field>

        <View style={styles.row}>
          <Field label="Instagram" style={styles.rowField}>
            <TextInput
              style={styles.input}
              value={form.instagram}
              onChangeText={(v) => set('instagram', v)}
              placeholder="@empresa"
              placeholderTextColor={Light.textMuted}
              autoCapitalize="none"
            />
          </Field>
          <Field label="LinkedIn" style={styles.rowField}>
            <TextInput
              style={styles.input}
              value={form.linkedin}
              onChangeText={(v) => set('linkedin', v)}
              placeholder="linkedin.com/company/empresa"
              placeholderTextColor={Light.textMuted}
              autoCapitalize="none"
            />
          </Field>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {saved && (
          <View style={styles.savedBox}>
            <Ionicons name="checkmark-circle" size={18} color={Light.success} />
            <Text style={styles.savedText}>Cadastro salvo com sucesso.</Text>
          </View>
        )}

        <Pressable style={[styles.save, busy && styles.saveDisabled]} onPress={onSave} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveText}>Salvar cadastro</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Field({
  label,
  hint,
  children,
  style,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
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
  return (
    <Field label={label} hint={hint}>
      <View style={styles.arrayList}>
        {[...items, ''].map((item, i) => (
          <View key={i} style={styles.productRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={item}
              onChangeText={(v) => {
                if (i === items.length) onAdd(v);
                else onChange(i, v);
              }}
              placeholder={i === items.length ? placeholder : label}
              placeholderTextColor={Light.textMuted}
            />
            {i < items.length && (
              <Pressable style={styles.removeBtn} onPress={() => onRemove(i)}>
                <Ionicons name="close" size={18} color={Light.textMuted} />
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </Field>
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
  content: { paddingHorizontal: Spacing.four, gap: Spacing.three },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { color: Light.textMuted, fontSize: 14 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#FBF6E9',
  },
  adminLinkText: { color: Light.gold, fontSize: 12.5, fontWeight: '800' },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  signOutText: { color: Light.textMuted, fontSize: 14 },

  title: { color: Light.textNavy, fontSize: 24, fontWeight: '800' },
  userEmail: { color: Light.textMuted, fontSize: 13, marginTop: -8 },
  intro: { color: Light.text, fontSize: 13.5, lineHeight: 20 },

  portalCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  portalIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF6E9',
  },
  portalCopy: { flex: 1, gap: 4 },
  portalTitle: { color: Light.textNavy, fontSize: 14, fontWeight: '800' },
  portalText: { color: Light.text, fontSize: 12.5, lineHeight: 18 },
  portalUrl: { color: Light.gold, fontSize: 12.5, fontWeight: '700' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  statusDraft: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  statusPub: { backgroundColor: 'rgba(34, 197, 94, 0.12)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: Light.textNavy, fontSize: 12.5, flex: 1 },

  completionCard: {
    gap: Spacing.three,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  completionTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.three },
  completionLabel: { color: Light.textNavy, fontSize: 15, fontWeight: '800' },
  completionHint: { color: Light.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  completionScore: { color: Light.gold, fontSize: 22, fontWeight: '900' },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: Light.surfaceAlt,
  },
  progressFill: { height: '100%', borderRadius: Radius.pill, backgroundColor: Light.gold },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 150, flex: 1 },
  checkText: { color: Light.textMuted, fontSize: 12.5 },
  checkTextDone: { color: Light.text },

  previewCard: {
    gap: Spacing.two,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  previewKicker: {
    color: Light.textMuted,
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  previewLogo: {
    width: 58,
    height: 58,
    borderRadius: Radius.sm,
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  previewLogoFallback: {
    width: 58,
    height: 58,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF6E9',
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
  },
  previewLogoText: { color: Light.gold, fontSize: 18, fontWeight: '900' },
  previewCopy: { flex: 1, gap: 3 },
  previewCompany: { color: Light.textNavy, fontSize: 16, fontWeight: '800' },
  previewMeta: { color: Light.gold, fontSize: 12.5, fontWeight: '700' },
  previewAbout: { color: Light.textMuted, fontSize: 12.5, lineHeight: 18 },

  sectionTitle: {
    color: Light.textNavy,
    fontSize: 16,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  field: { gap: 6 },
  label: { color: Light.textNavy, fontSize: 13, fontWeight: '600' },
  hint: { color: Light.textMuted, fontSize: 11.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  rowField: { flex: 1, minWidth: 220 },
  input: {
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 13,
    color: Light.text,
    fontSize: 15,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },

  arrayList: { gap: Spacing.two },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
  },

  error: { color: Light.danger, fontSize: 13.5 },
  savedBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savedText: { color: Light.success, fontSize: 14, fontWeight: '600' },

  save: {
    backgroundColor: Light.gold,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  logoPreview: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    backgroundColor: Light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Light.border,
  },
  imageUploadButtons: {
    flex: 1,
    gap: Spacing.one,
  },
  uploadBtn: {
    backgroundColor: Light.surfaceAlt,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: Radius.pill,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: Light.textNavy,
    fontSize: 13,
    fontWeight: '700',
  },
  removeImageBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  removeImageBtnText: {
    color: Light.danger,
    fontSize: 12,
    fontWeight: '600',
  },
});
