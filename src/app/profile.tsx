import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { TAB_BAR_CLEARANCE } from '@/components/ui-kit';
import { Light, LightGradient, Radius, Spacing } from '@/constants/theme';
import { AuthForm } from '@/features/auth/auth-form';
import { useAuth } from '@/features/auth/use-auth';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import {
  BOTTLENECK_OPTIONS,
  BUDGET_OPTIONS,
  DEMO_VISITOR_PROFILE,
  EMPTY_VISITOR_PROFILE,
  MAX_BOTTLENECKS,
  MAX_INTERESTS,
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
  exportLeadsCsv,
  exportLeadVCard,
  leadMessageUrl,
  removeSavedLead,
  useSavedLeads,
} from '@/features/visitor/leads';
import { useSavedExhibitors } from '@/features/visitor/saved-exhibitors';
import { publishSymplaTicketQrLookup } from '@/features/visitor/visitor-ticket-qr';


import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const [symplaTicketCode, setSymplaTicketCode] = useState<string | null>(null);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !user || !user.email) return;
    const fetchSymplaTicket = async () => {
      try {
        const email = user.email!.toLowerCase().trim();
        const docRef = doc(firestore, 'paidEvents', 'sympla-3486582', 'attendees', email);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.ticketQrCode) {
            setSymplaTicketCode(data.ticketQrCode);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar ingresso Sympla:', err);
      }
    };
    fetchSymplaTicket();
  }, [user]);

  useEffect(() => {
    if (!symplaTicketCode || !form.name) return;
    publishSymplaTicketQrLookup(symplaTicketCode, form).catch((err) => {
      console.error('Erro ao vincular QR Sympla ao perfil:', err);
    });
  }, [symplaTicketCode, form.name, form.role, form.company, form.email, form.phone]);

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
              if (auth?.currentUser && db) {
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
    let active = true;
    queueMicrotask(() => {
      if (!active || hydrated) return;
      if (demoMode) {
        setForm(DEMO_VISITOR_PROFILE);
        setHydrated(true);
        return;
      }
      if (!loading && user) {
        setForm(profile ?? { ...EMPTY_VISITOR_PROFILE });
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, [demoMode, loading, user, profile, hydrated]);

  const set = <K extends keyof VisitorProfile>(key: K, value: VisitorProfile[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleArrayItem = <K extends 'sector' | 'objectives' | 'interests' | 'bottlenecks'>(
    key: K,
    item: string
  ) => {
    const current = (form[key] as string[]) ?? [];
    if (!current.includes(item)) {
      const limit =
        key === 'bottlenecks' ? MAX_BOTTLENECKS : key === 'interests' ? MAX_INTERESTS : undefined;
      if (limit && current.length >= limit) {
        Alert.alert(
          'Limite atingido',
          `Você pode selecionar no máximo ${limit} ${
            key === 'bottlenecks' ? 'gargalos' : 'áreas de interesse'
          }. Desmarque uma opção para trocar.`
        );
        return;
      }
    }
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
            onSuccess={() => router.replace('/')}
            showSymplaSignup
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if ((initializing || (loading && !demoMode)) && !hydrated) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={Light.gold} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.two, paddingBottom: TAB_BAR_CLEARANCE },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Pressable style={styles.settingsBtn} onPress={() => router.push('/connections')}>
            <Ionicons name="people-outline" size={20} color={Light.navyDeep} />
          </Pressable>
          {demoMode ? (
            <Pressable style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={20} color={Light.navyDeep} />
            </Pressable>
          ) : (
            <Pressable style={styles.settingsBtn} onPress={() => signOut()}>
              <Ionicons name="log-out-outline" size={20} color={Light.navyDeep} />
            </Pressable>
          )}
        </View>
      </View>

      {demoMode && (
        <View style={styles.demoBanner}>
          <Ionicons name="warning-outline" size={15} color={Light.goldTextStrong} />
          <Text style={styles.demoBannerText}>
            Modo demonstração — configure o Firebase para salvar e sincronizar.
          </Text>
        </View>
      )}

      {/* Crachá Digital (Badge Card — navy premium por design) */}
      <LinearGradient
        colors={LightGradient.header}
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
                    symplaTicketCode || `expoindustrialsul://visitor/${user?.uid || 'demo-user'}`
                  )}`,
                }}
                style={styles.qrCodeImage}
              />
            ) : (
              <>
                <Ionicons name="qr-code" size={50} color={Light.navyDeep} />
                <Text style={styles.qrCodeText}>COMPLETAR PERFIL</Text>
              </>
            )}
          </Pressable>

        </View>

        <View style={styles.badgeFooter}>
          <Ionicons name="sparkles" size={14} color={Light.gold} />
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
          <View style={styles.zoomContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.zoomTitle}>Meu Crachá Digital</Text>
            <Text style={styles.zoomSubtitle}>Apresente este código para outros participantes ou expositores</Text>

            <View style={styles.zoomQrWrapper}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                    symplaTicketCode || `expoindustrialsul://visitor/${user?.uid || 'demo-user'}`
                  )}`,
                }}
                style={styles.zoomQrImage}
              />
            </View>

            <Text style={styles.zoomName}>{form.name}</Text>
            <Text style={styles.zoomMeta}>{form.role} · {form.company}</Text>
            {symplaTicketCode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                <Ionicons name="checkmark-circle" size={14} color="#166534" />
                <Text style={{ color: '#166534', fontSize: 11, fontWeight: '700' }}>CREDENCIAL SYMPLA INTEGRADA</Text>
              </View>
            ) : null}

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
            color={activeTab === 'preferences' ? '#fff' : Light.textMuted}
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
            color={activeTab === 'leads' ? '#fff' : Light.textMuted}
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
            color={activeTab === 'saved' ? '#fff' : Light.textMuted}
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
            placeholderTextColor={Light.textMuted}
            style={styles.textInput}
          />
          <View style={styles.inlineRow}>
            <TextInput
              value={form.role}
              onChangeText={(v) => set('role', v)}
              placeholder="Cargo"
              placeholderTextColor={Light.textMuted}
              style={[styles.textInput, { flex: 1 }]}
            />
            <TextInput
              value={form.company}
              onChangeText={(v) => set('company', v)}
              placeholder="Empresa"
              placeholderTextColor={Light.textMuted}
              style={[styles.textInput, { flex: 1 }]}
            />
          </View>

          <Text style={[styles.label, { marginTop: Spacing.two }]}>Contatos e Links</Text>
          <View style={styles.inlineRow}>
            <TextInput
              value={form.phone}
              onChangeText={(v) => set('phone', v)}
              placeholder="Telefone / WhatsApp"
              placeholderTextColor={Light.textMuted}
              style={[styles.textInput, { flex: 1 }]}
              keyboardType="phone-pad"
            />
            <TextInput
              value={form.email}
              onChangeText={(v) => set('email', v)}
              placeholder="E-mail de Contato"
              placeholderTextColor={Light.textMuted}
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
              placeholderTextColor={Light.textMuted}
              style={[styles.textInput, { flex: 1 }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              value={form.website}
              onChangeText={(v) => set('website', v)}
              placeholder="Site / Portfólio (URL)"
              placeholderTextColor={Light.textMuted}
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

          <Text style={styles.label}>Gargalos Atuais da sua Fábrica (até {MAX_BOTTLENECKS})</Text>
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

          <Text style={styles.label}>Áreas de Interesse (até {MAX_INTERESTS})</Text>
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
            placeholderTextColor={Light.textMuted}
            style={styles.textInput}
          />

          <Text style={styles.label}>O que oferece?</Text>
          <TextInput
            value={form.offering}
            onChangeText={(v) => set('offering', v)}
            placeholder="Ex: Painéis elétricos customizados"
            placeholderTextColor={Light.textMuted}
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
                trackColor={{ false: Light.border, true: Light.gold }}
                thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
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
                trackColor={{ false: Light.border, true: Light.gold }}
                thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
              />
            </View>
            <Text style={styles.consentDescription}>
              Seus dados de e-mail e telefone serão compartilhados após a conexão ser aceita por ambos.
            </Text>
          </View>

          <Pressable style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
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
            <Ionicons name="document-text-outline" size={16} color={Light.textMuted} />
            <Text style={styles.legalBtnText}>Política de Privacidade & Termos de Uso</Text>
          </Pressable>

          <Text style={[styles.sectionTitle, { marginTop: Spacing.four, color: Light.danger }]}>
            Zona de Risco
          </Text>
          <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount} disabled={saving}>
            <Ionicons name="trash-outline" size={16} color={Light.danger} />
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
          {savedLeads.length > 0 ? (
            <Pressable
              style={styles.exportCsvBtn}
              onPress={() =>
                exportLeadsCsv(savedLeads, 'meus-leads').catch((err) =>
                  Alert.alert('Exportar CSV', (err as Error).message),
                )
              }>
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={styles.exportCsvText}>Exportar lista CSV</Text>
            </Pressable>
          ) : null}

          {savedLeads.length === 0 ? (
            <View style={styles.leadsEmpty}>
              <Ionicons name="qr-code-outline" size={32} color={Light.textFaint} />
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
                    {lead.role} · <Text style={styles.leadCompany}>{lead.company}</Text>
                  </Text>
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
                  <Ionicons name="trash-outline" size={16} color={Light.textMuted} />
                </Pressable>
              </View>

              <View style={styles.leadContactRow}>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={13} color={Light.textMuted} />
                  <Text style={styles.contactItemText}>{lead.email}</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={13} color={Light.textMuted} />
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
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={Light.gold} />
                  <Text style={styles.leadActionText}>Mensagem</Text>
                </Pressable>
                <Pressable
                  style={styles.leadActionBtn}
                  onPress={() =>
                    exportLeadVCard(lead).catch((err) =>
                      Alert.alert('Exportar contato', (err as Error).message),
                    )
                  }>
                  <Ionicons name="cloud-upload-outline" size={14} color={Light.gold} />
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
              <Ionicons name="bookmark-outline" size={32} color={Light.textFaint} />
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
                  {ex.industry} · <Text style={styles.leadCompany}>{ex.stand}</Text>
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                style={styles.leadDelete}
                onPress={() => toggleSaved(ex.id)}>
                <Ionicons name="bookmark" size={16} color={Light.gold} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
      </ScrollView>
    </>
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
  content: { paddingHorizontal: Spacing.four, gap: Spacing.four },
  gateContent: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  headerTitle: { color: Light.navyDeep, fontSize: 22, fontWeight: '800' },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBF6E9',
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  demoBannerText: { color: Light.goldTextStrong, fontSize: 12.5, flex: 1 },

  // Crachá Digital (navy)
  badgeCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Light.navyDeep,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 6,
  },
  badgeGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(201,162,76,0.18)',
    opacity: 0.7,
  },
  badgeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeLogo: { width: 150, height: 23 },
  badgeYear: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  badgeTypeContainer: {
    backgroundColor: Light.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  badgeTypeText: { color: Light.navyDeep, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
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
  visitorName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  visitorRole: { color: Light.goldLight, fontSize: 13, fontWeight: '700' },
  visitorCompany: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  qrCodeContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 3,
    borderColor: Light.gold,
    overflow: 'hidden',
  },
  qrCodeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  qrCodeText: {
    color: Light.navyDeep,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginTop: 6,
  },
  badgeFooterText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Light.surface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Light.border,
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
    backgroundColor: Light.navy,
  },
  tabButtonText: { color: Light.textMuted, fontSize: 13, fontWeight: '600' },
  tabButtonTextActive: { color: '#fff', fontWeight: '700' },

  // Tab Content
  tabContent: { gap: Spacing.three, marginTop: Spacing.one },
  sectionTitle: { color: Light.navyDeep, fontSize: 16.5, fontWeight: '700' },
  sectionSubtitle: { color: Light.textMuted, fontSize: 12.5, lineHeight: 18 },

  inlineRow: { flexDirection: 'row', gap: Spacing.two },
  label: {
    color: Light.goldTextStrong,
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: Spacing.two,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    color: Light.navyDeep,
    fontSize: 14.5,
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

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Light.navy,
    height: 48,
    borderRadius: 12,
    marginTop: Spacing.three,
  },
  saveBtnText: { color: '#fff', fontSize: 14.5, fontWeight: '800' },

  // Leads
  leadsEmpty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    backgroundColor: Light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Light.border,
  },
  leadsEmptyText: { color: Light.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  leadDelete: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Light.surfaceAlt,
    borderWidth: 1,
    borderColor: Light.border,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Light.border,
    padding: Spacing.three,
  },
  savedLogo: { width: 56, height: 44, backgroundColor: Light.surfaceAlt },
  leadCard: {
    backgroundColor: Light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Light.border,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  leadName: { color: Light.navyDeep, fontSize: 15.5, fontWeight: '700' },
  leadRole: { color: Light.textMuted, fontSize: 12.5, marginTop: 2 },
  leadCompany: { color: Light.gold, fontWeight: '700' },
  leadContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    backgroundColor: Light.surfaceAlt,
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Light.border,
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactItemText: { color: Light.navyDeep, fontSize: 12 },
  leadActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingTop: Spacing.three,
  },
  leadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    backgroundColor: '#FBF6E9',
    paddingVertical: 8,
    borderRadius: 12,
  },
  leadActionText: { color: Light.goldTextStrong, fontSize: 12.5, fontWeight: '700' },
  exportCsvBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Light.navy,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  exportCsvText: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
  consentCard: {
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 8,
    marginTop: Spacing.two,
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consentTitle: { color: Light.navyDeep, fontSize: 15, fontWeight: '700' },
  consentDescription: { color: Light.textMuted, fontSize: 12.5, lineHeight: 18 },

  // Zoom QR
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  zoomContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Light.border,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.three,
  },
  zoomTitle: {
    color: Light.navyDeep,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  zoomSubtitle: {
    color: Light.textMuted,
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
    borderColor: Light.gold,
  },
  zoomQrImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  zoomName: {
    color: Light.navyDeep,
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  zoomMeta: {
    color: Light.gold,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  zoomCloseBtn: {
    width: '100%',
    height: 46,
    backgroundColor: Light.navy,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  zoomCloseText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Light.danger,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: Spacing.one,
  },
  deleteBtnText: { color: Light.danger, fontSize: 14.5, fontWeight: '700' },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
  },
  legalBtnText: { color: Light.textMuted, fontSize: 13.5, fontWeight: '600' },
});
