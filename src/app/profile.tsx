import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { AuthForm } from '@/features/auth/auth-form';
import { useAuth } from '@/features/auth/use-auth';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import {
  BOTTLENECK_OPTIONS,
  BUDGET_OPTIONS,
  DEMO_VISITOR_PROFILE,
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

import {
  exportLeadVCard,
  leadMessageUrl,
  removeSavedLead,
  useSavedLeads,
} from '@/features/visitor/leads';
import { useSavedExhibitors } from '@/features/visitor/saved-exhibitors';


const BADGE_TYPE = 'VISITANTE';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, initializing, configured, signOut } = useAuth();
  const { profile, loading } = useVisitorProfile();

  const demoMode = !configured;

  const [activeTab, setActiveTab] = useState<'preferences' | 'leads' | 'saved'>('preferences');
  const [zoomVisible, setZoomVisible] = useState(false);
  const [form, setForm] = useState<VisitorProfile>(EMPTY_VISITOR_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleDeleteAccount() {
    if (!configured) {
      Alert.alert('Modo de Demonstração', 'A exclusão de conta não está disponível no modo offline de demonstração.');
      return;
    }

    Alert.alert(
      'Excluir Conta Permanentemente?',
      'Esta ação é irreversível. Todos os seus dados de crachá, preferências de matchmaking e conexões serão excluídos permanentemente de nossos servidores.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Permanentemente',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const { deleteDoc, doc } = await import('firebase/firestore');
              const { db, auth } = await import('@/lib/firebase');
              if (auth?.currentUser) {
                const uid = auth.currentUser.uid;
                await deleteDoc(doc(db, 'visitors', uid));
                await auth.currentUser.delete();
                Alert.alert('Conta excluída', 'Sua conta e dados foram completamente removidos de nossa base.');
              }
            } catch (err) {
              const errorMsg = (err as any).code === 'auth/requires-recent-login'
                ? 'Para excluir sua conta, você precisa fazer login novamente para reautenticar sua sessão.'
                : (err as Error).message;
              Alert.alert('Erro ao excluir', errorMsg);
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  }
  const { leads: savedLeads } = useSavedLeads();
  const { savedIds, toggle: toggleSaved } = useSavedExhibitors();
  const { exhibitors } = useExhibitors();
  const savedExhibitors = exhibitors.filter((e) => savedIds.includes(e.id));


  // Preenche o formulário uma vez: demo, perfil salvo, ou vazio.
  useEffect(() => {
    if (hydrated) return;
    if (demoMode) {
      setForm(DEMO_VISITOR_PROFILE);
      setHydrated(true);
      return;
    }
    if (!loading && user) {
      setForm(profile ?? { ...EMPTY_VISITOR_PROFILE });
      setHydrated(true);
    }
  }, [demoMode, loading, user, profile, hydrated]);

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

  const toggleBottleneck = (option: string) => toggleArrayItem('bottlenecks', option);

  async function handleSave() {
    if (demoMode) {
      Alert.alert(
        'Modo demonstração',
        'Configure o Firebase (.env) para salvar seu perfil e sincronizar entre aparelhos.',
      );
      return;
    }
    setSaving(true);
    try {
      const mainSector = form.sector && form.sector.length > 0 ? form.sector[0] : '';
      const formToSave = {
        ...form,
        area: mainSector || form.area,
      };
      await saveVisitorProfile(formToSave);
      Alert.alert(
        'Preferências salvas!',
        'O matchmaking foi atualizado com base no seu perfil.',
        [{ text: 'Ver Matches', onPress: () => router.push('/matchmaking') }],
      );
    } catch (err) {
      Alert.alert('Erro', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Gate de autenticação (quando o Firebase está ativo e ninguém logado).
  if (configured && !initializing && !user) {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.gateContent, { paddingTop: insets.top + Spacing.five }]}
          keyboardShouldPersistTaps="handled">
          <AuthForm
            title="Sua credencial digital"
            icon="qr-code"
            subtitle={{
              login: 'Acesse para ver seu crachá, matches e contatos.',
              signup: 'Crie sua conta de visitante para participar do evento.',
            }}
            onSuccess={() => router.replace('/onboarding')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if ((initializing || (loading && !demoMode)) && !hydrated) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={Brand.gold} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.two, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Pressable style={styles.settingsBtn} onPress={() => router.push('/connections')}>
            <Ionicons name="people-outline" size={20} color={Brand.textPrimary} />
          </Pressable>
          {demoMode ? (
            <Pressable style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={20} color={Brand.textPrimary} />
            </Pressable>
          ) : (
            <Pressable style={styles.settingsBtn} onPress={() => signOut()}>
              <Ionicons name="log-out-outline" size={20} color={Brand.textPrimary} />
            </Pressable>
          )}
        </View>
      </View>

      {demoMode && (
        <View style={styles.demoBanner}>
          <Ionicons name="warning-outline" size={15} color={Brand.warning} />
          <Text style={styles.demoBannerText}>
            Modo demonstração — configure o Firebase para salvar e sincronizar.
          </Text>
        </View>
      )}

      {/* Crachá Digital (Badge Card) */}
      <LinearGradient
        colors={[Brand.bgSecondary, Brand.bgCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badgeCard}>
        <View style={styles.badgeGlow} />

        <View style={styles.badgeTop}>
          <View>
            <Image
              source={require('@/assets/images/logo-expoindustrial.png')}
              style={styles.badgeLogo}
              resizeMode="contain"
            />
            <Text style={styles.badgeYear}>EDIÇÃO 2026</Text>
          </View>
          <View style={styles.badgeTypeContainer}>
            <Text style={styles.badgeTypeText}>{BADGE_TYPE}</Text>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        <View style={styles.badgeBody}>
          <View style={styles.badgeInfo}>
            <Text style={styles.visitorName}>{form.name || 'Seu nome'}</Text>
            <Text style={styles.visitorRole}>{form.role || 'Seu cargo'}</Text>
            <Text style={styles.visitorCompany}>{form.company || 'Sua empresa'}</Text>
          </View>

          <Pressable style={styles.qrCodeContainer} onPress={() => form.name && setZoomVisible(true)}>
            {form.name ? (
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `expoindustrialsul://visitor/${user?.uid || 'demo-user'}`
                  )}`,
                }}
                style={styles.qrCodeImage}
              />
            ) : (
              <>
                <Ionicons name="qr-code" size={50} color={Brand.bgPrimary} />
                <Text style={styles.qrCodeText}>COMPLETAR PERFIL</Text>
              </>
            )}
          </Pressable>

        </View>

        <View style={styles.badgeFooter}>
          <Ionicons name="sparkles" size={14} color={Brand.gold} />
          <Text style={styles.badgeFooterText}>Clique para ampliar · Aproxime nos estandes</Text>
        </View>
      </LinearGradient>

      {/* Modal de Zoom do QR Code */}
      <Modal
        visible={zoomVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomVisible(false)}>
        <Pressable style={styles.zoomOverlay} onPress={() => setZoomVisible(false)}>
          <View style={styles.zoomContent} onStartShouldSetResponder={() => true} ResponderEventPlugin={() => {}}>
            <Text style={styles.zoomTitle}>Meu Crachá Digital</Text>
            <Text style={styles.zoomSubtitle}>Apresente este código para outros participantes ou expositores</Text>
            
            <View style={styles.zoomQrWrapper}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                    `expoindustrialsul://visitor/${user?.uid || 'demo-user'}`
                  )}`,
                }}
                style={styles.zoomQrImage}
              />
            </View>

            <Text style={styles.zoomName}>{form.name}</Text>
            <Text style={styles.zoomMeta}>{form.role} · {form.company}</Text>

            <Pressable style={styles.zoomCloseBtn} onPress={() => setZoomVisible(false)}>
              <Text style={styles.zoomCloseText}>Fechar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'preferences' && styles.tabButtonActive]}
          onPress={() => setActiveTab('preferences')}>
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={activeTab === 'preferences' ? Brand.gold : Brand.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'preferences' && styles.tabButtonTextActive]}>
            Preferências
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'leads' && styles.tabButtonActive]}
          onPress={() => setActiveTab('leads')}>
          <Ionicons
            name="people-outline"
            size={16}
            color={activeTab === 'leads' ? Brand.gold : Brand.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'leads' && styles.tabButtonTextActive]}>
            Leads ({savedLeads.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'saved' && styles.tabButtonActive]}
          onPress={() => setActiveTab('saved')}>
          <Ionicons
            name="bookmark-outline"
            size={16}
            color={activeTab === 'saved' ? Brand.gold : Brand.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'saved' && styles.tabButtonTextActive]}>
            Salvos ({savedExhibitors.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === 'preferences' ? (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Seus dados (crachá)</Text>
          <TextInput
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="Nome completo"
            placeholderTextColor={Brand.textMuted}
            style={styles.textInput}
          />
          <View style={styles.inlineRow}>
            <TextInput
              value={form.role}
              onChangeText={(v) => set('role', v)}
              placeholder="Cargo"
              placeholderTextColor={Brand.textMuted}
              style={[styles.textInput, { flex: 1 }]}
            />
            <TextInput
              value={form.company}
              onChangeText={(v) => set('company', v)}
              placeholder="Empresa"
              placeholderTextColor={Brand.textMuted}
              style={[styles.textInput, { flex: 1 }]}
            />
          </View>

          <Text style={[styles.label, { marginTop: Spacing.two }]}>Contatos e Links</Text>
          <View style={styles.inlineRow}>
            <TextInput
              value={form.phone}
              onChangeText={(v) => set('phone', v)}
              placeholder="Telefone / WhatsApp"
              placeholderTextColor={Brand.textMuted}
              style={[styles.textInput, { flex: 1 }]}
              keyboardType="phone-pad"
            />
            <TextInput
              value={form.email}
              onChangeText={(v) => set('email', v)}
              placeholder="E-mail de Contato"
              placeholderTextColor={Brand.textMuted}
              style={[styles.textInput, { flex: 1 }]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inlineRow}>
            <TextInput
              value={form.linkedin}
              onChangeText={(v) => set('linkedin', v)}
              placeholder="LinkedIn (URL)"
              placeholderTextColor={Brand.textMuted}
              style={[styles.textInput, { flex: 1 }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              value={form.website}
              onChangeText={(v) => set('website', v)}
              placeholder="Site / Portfólio (URL)"
              placeholderTextColor={Brand.textMuted}
              style={[styles.textInput, { flex: 1 }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: Spacing.three }]}>
            Ajustar Perfil da Operação
          </Text>
          <Text style={styles.sectionSubtitle}>
            Essas informações refinam o score de compatibilidade com expositores e outros profissionais.
          </Text>

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

          <Text style={styles.label}>Gargalos Atuais da sua Fábrica</Text>
          <View style={styles.optionsGrid}>
            {BOTTLENECK_OPTIONS.map((opt) => {
              const isSelected = (form.bottlenecks ?? []).includes(opt);
              return (
                <Pressable
                  key={opt}
                  style={[styles.optionChip, isSelected && styles.optionChipActive]}
                  onPress={() => toggleBottleneck(opt)}>
                  <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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

          <Text style={styles.label}>Budget para Investimento em Tecnologia</Text>
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
            placeholder="Ex: Fornecedores de sensores IoT"
            placeholderTextColor={Brand.textMuted}
            style={styles.textInput}
          />

          <Text style={styles.label}>O que oferece?</Text>
          <TextInput
            value={form.offering}
            onChangeText={(v) => set('offering', v)}
            placeholder="Ex: Painéis elétricos customizados"
            placeholderTextColor={Brand.textMuted}
            style={styles.textInput}
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.three }]}>
            Configurações de Privacidade
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
              Se ativado, seu perfil poderá receber solicitações de conexões de outros participantes.
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
              Seus dados de e-mail e telefone serão compartilhados após a conexão ser aceita por ambos.
            </Text>
          </View>

          <Pressable style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Brand.bgPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={Brand.bgPrimary} />
                <Text style={styles.saveBtnText}>Salvar e Atualizar Matchmaking</Text>
              </>
            )}
          </Pressable>

          <Text style={[styles.sectionTitle, { marginTop: Spacing.four }]}>
            Documentos Legais
          </Text>
          <Pressable
            style={styles.legalBtn}
            onPress={() => Linking.openURL('https://expo-industrial-sul.vercel.app/privacy')}>
            <Ionicons name="document-text-outline" size={16} color={Brand.textSecondary} />
            <Text style={styles.legalBtnText}>Política de Privacidade & Termos de Uso</Text>
          </Pressable>

          <Text style={[styles.sectionTitle, { marginTop: Spacing.four, color: Brand.danger }]}>
            Zona de Risco
          </Text>
          <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount} disabled={saving}>
            <Ionicons name="trash-outline" size={16} color={Brand.danger} />
            <Text style={styles.deleteBtnText}>Excluir Minha Conta</Text>
          </Pressable>
        </View>
      ) : activeTab === 'leads' ? (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Contatos e Leads Coletados</Text>
          <Text style={styles.sectionSubtitle}>
            Contatos comerciais escaneados por QR Code nos estandes ou adicionados durante as rodadas
            de PPCP e S&OP.
          </Text>

          {savedLeads.length === 0 ? (
            <View style={styles.leadsEmpty}>
              <Ionicons name="qr-code-outline" size={32} color={Brand.textMuted} />
              <Text style={styles.leadsEmptyText}>
                Nenhum contato captado ainda. Use “Captar lead” no perfil de um expositor para
                escanear o QR Code do crachá.
              </Text>
            </View>
          ) : null}

          {savedLeads.map((lead) => (
            <View key={lead.id} style={styles.leadCard}>
              <View style={styles.leadHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leadName}>{lead.name}</Text>
                  <Text style={styles.leadRole}>
                    {lead.role} · <Text style={{ color: Brand.gold }}>{lead.company}</Text>
                  </Text>
                </View>
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceBadgeText}>{lead.source}</Text>
                </View>
                <Pressable
                  hitSlop={8}
                  style={styles.leadDelete}
                  onPress={() =>
                    Alert.alert('Remover contato', `Remover ${lead.name} dos seus leads?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Remover',
                        style: 'destructive',
                        onPress: () => removeSavedLead(lead.id),
                      },
                    ])
                  }>
                  <Ionicons name="trash-outline" size={16} color={Brand.textMuted} />
                </Pressable>
              </View>

              <View style={styles.leadContactRow}>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={13} color={Brand.textSecondary} />
                  <Text style={styles.contactItemText}>{lead.email}</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={13} color={Brand.textSecondary} />
                  <Text style={styles.contactItemText}>{lead.phone}</Text>
                </View>
              </View>

              <View style={styles.leadActions}>
                <Pressable
                  style={styles.leadActionBtn}
                  onPress={() =>
                    Linking.openURL(leadMessageUrl(lead)).catch(() =>
                      Alert.alert('Não foi possível abrir', 'Verifique o app de mensagens/e-mail.'),
                    )
                  }>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={Brand.gold} />
                  <Text style={styles.leadActionText}>Mensagem</Text>
                </Pressable>
                <Pressable
                  style={styles.leadActionBtn}
                  onPress={() =>
                    exportLeadVCard(lead).catch((err) =>
                      Alert.alert('Exportar contato', (err as Error).message),
                    )
                  }>
                  <Ionicons name="cloud-upload-outline" size={14} color={Brand.gold} />
                  <Text style={styles.leadActionText}>Exportar .vcf</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Empresas Salvas</Text>
          <Text style={styles.sectionSubtitle}>
            Expositores que você marcou com “Salvar empresa”. Toque para abrir o perfil.
          </Text>

          {savedExhibitors.length === 0 ? (
            <View style={styles.leadsEmpty}>
              <Ionicons name="bookmark-outline" size={32} color={Brand.textMuted} />
              <Text style={styles.leadsEmptyText}>
                Nenhuma empresa salva ainda. Abra um expositor e toque em “Salvar empresa”.
              </Text>
            </View>
          ) : null}

          {savedExhibitors.map((ex) => (
            <Pressable
              key={ex.id}
              style={styles.savedCard}
              onPress={() => router.push(`/exhibitor/${ex.id}`)}>
              <ExhibitorLogo logoUrl={ex.logoUrl} logo={ex.logo} style={styles.savedLogo} textSize={11} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.leadName}>{ex.company}</Text>
                <Text style={styles.leadRole}>
                  {ex.industry} · <Text style={{ color: Brand.gold }}>{ex.stand}</Text>
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                style={styles.leadDelete}
                onPress={() => toggleSaved(ex.id)}>
                <Ionicons name="bookmark" size={16} color={Brand.gold} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
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
  content: { paddingHorizontal: Spacing.four, gap: Spacing.four },
  gateContent: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  headerTitle: { color: Brand.textPrimary, fontSize: 22, fontWeight: '800' },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  demoBannerText: { color: Brand.warning, fontSize: 12.5, flex: 1 },

  // Crachá Digital
  badgeCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
    position: 'relative',
  },
  badgeGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Brand.goldSoft,
    opacity: 0.5,
  },
  badgeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeLogo: { width: 150, height: 23 },
  badgeYear: {
    color: Brand.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  badgeTypeContainer: {
    backgroundColor: Brand.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  badgeTypeText: { color: Brand.bgPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    marginVertical: Spacing.two,
  },

  badgeBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  badgeInfo: { flex: 1, gap: 4 },
  visitorName: { color: Brand.textPrimary, fontSize: 20, fontWeight: '800' },
  visitorRole: { color: Brand.gold, fontSize: 13, fontWeight: '700' },
  visitorCompany: { color: Brand.textSecondary, fontSize: 13, fontWeight: '600' },
  qrCodeContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 3,
    borderColor: Brand.gold,
    overflow: 'hidden',
  },
  qrCodeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  qrCodeText: {
    color: Brand.bgPrimary,
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 3,
    textAlign: 'center',
  },


  badgeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginTop: 6,
  },
  badgeFooterText: { color: Brand.textSecondary, fontSize: 11, fontWeight: '500' },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 4,
    marginTop: Spacing.two,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  tabButtonActive: {
    backgroundColor: '#0E172F',
    borderWidth: 1,
    borderColor: 'rgba(47, 107, 255, 0.4)',
  },
  tabButtonText: { color: Brand.textSecondary, fontSize: 13, fontWeight: '600' },
  tabButtonTextActive: { color: Brand.textPrimary, fontWeight: '700' },

  // Tab Content
  tabContent: { gap: Spacing.three, marginTop: Spacing.one },
  sectionTitle: { color: Brand.textPrimary, fontSize: 16.5, fontWeight: '700' },
  sectionSubtitle: { color: Brand.textSecondary, fontSize: 12.5, lineHeight: 18 },

  inlineRow: { flexDirection: 'row', gap: Spacing.two },
  label: {
    color: Brand.gold,
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: Spacing.two,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.gold,
    height: 48,
    borderRadius: Radius.sm,
    marginTop: Spacing.three,
  },
  saveBtnText: { color: Brand.bgPrimary, fontSize: 14.5, fontWeight: '800' },

  // Leads
  leadsEmpty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  leadsEmptyText: { color: Brand.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  leadDelete: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  savedLogo: { width: 56, height: 44 },
  leadCard: {
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  leadName: { color: Brand.textPrimary, fontSize: 15.5, fontWeight: '700' },
  leadRole: { color: Brand.textSecondary, fontSize: 12.5, marginTop: 2 },
  sourceBadge: {
    backgroundColor: 'rgba(47, 107, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  sourceBadgeText: { color: Brand.techBlue, fontSize: 9.5, fontWeight: '700' },
  leadContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    backgroundColor: Brand.bgPrimary,
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactItemText: { color: Brand.textSecondary, fontSize: 12 },
  leadActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: Spacing.three,
  },
  leadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.bgPrimary,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  leadActionText: { color: Brand.textPrimary, fontSize: 12.5, fontWeight: '700' },
  consentCard: {
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: 8,
    marginTop: Spacing.two,
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consentTitle: { color: Brand.textPrimary, fontSize: 15, fontWeight: '700' },
  consentDescription: { color: Brand.textSecondary, fontSize: 12.5, lineHeight: 18 },

  // Zoom QR
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  zoomContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.three,
  },
  zoomTitle: {
    color: Brand.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  zoomSubtitle: {
    color: Brand.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.one,
  },
  zoomQrWrapper: {
    width: 240,
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 4,
    borderColor: Brand.gold,
  },
  zoomQrImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  zoomName: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  zoomMeta: {
    color: Brand.gold,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  zoomCloseBtn: {
    width: '100%',
    height: 46,
    backgroundColor: Brand.gold,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  zoomCloseText: {
    color: Brand.bgPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Brand.danger,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    marginTop: Spacing.one,
  },
  deleteBtnText: { color: Brand.danger, fontSize: 14.5, fontWeight: '700' },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
  },
  legalBtnText: { color: Brand.textSecondary, fontSize: 13.5, fontWeight: '600' },
});
