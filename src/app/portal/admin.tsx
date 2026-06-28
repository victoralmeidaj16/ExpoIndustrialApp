import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useAdminExhibitors, useAdminRole, setExhibitorStatus, useAdminVisitors } from '@/features/admin/use-admin';
import { useAuth } from '@/features/auth/use-auth';
import { type Exhibitor } from '@/features/exhibitors/exhibitor';
import { type VisitorProfile } from '@/features/visitor/visitor-profile';
import { useSessions } from '@/features/agenda/use-sessions';
import { useSponsors } from '@/features/sponsors/use-sponsors';

type StatusFilter = 'review' | 'published' | 'all';
type QualityFilter = 'all' | 'missingStand' | 'missingLogo' | 'missingContact';

const APPROVAL_ITEMS = [
  { key: 'logo', label: 'Logo' },
  { key: 'about', label: 'Descrição' },
  { key: 'industry', label: 'Setor' },
  { key: 'contact', label: 'Contato' },
  { key: 'products', label: 'Produtos' },
  { key: 'stand', label: 'Estande' },
  { key: 'status', label: 'Status' },
] as const;

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getApprovalChecklist(item: Exhibitor) {
  return APPROVAL_ITEMS.map((approvalItem) => {
    let done = false;
    switch (approvalItem.key) {
      case 'logo':
        done = Boolean(item.logoUrl || item.logo);
        break;
      case 'about':
        done = Boolean(item.about?.trim());
        break;
      case 'industry':
        done = Boolean(item.industry?.trim());
        break;
      case 'contact':
        done = Boolean(item.contactEmail?.trim() || item.contactPhone?.trim() || item.contactName?.trim());
        break;
      case 'products':
        done = item.products.some((product) => product.trim().length > 0);
        break;
      case 'stand':
        done = Boolean(item.stand?.trim());
        break;
      case 'status':
        done = item.status === 'published';
        break;
    }
    return { ...approvalItem, done };
  });
}

function isReadyForPublication(item: Exhibitor) {
  return getApprovalChecklist(item)
    .filter((approvalItem) => approvalItem.key !== 'status')
    .every((approvalItem) => approvalItem.done);
}

export default function PortalAdmin() {
  const insets = useSafeAreaInsets();
  const { user, initializing, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const { exhibitors, loading: exhibitorsLoading } = useAdminExhibitors(isAdmin);
  const { visitors, loading: visitorsLoading } = useAdminVisitors(isAdmin);
  const { sessions } = useSessions();
  const { sponsors } = useSponsors();
  const [adminTab, setAdminTab] = useState<'exhibitors' | 'visitors'>('exhibitors');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('review');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const portalUrl = useMemo(() => Linking.createURL('/portal'), []);
  const adminUrl = useMemo(() => Linking.createURL('/portal/admin'), []);

  if (!initializing && !user) return <Redirect href="/portal/login" />;

  if (initializing || roleLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={Brand.gold} />
      </View>
    );
  }

  if (!user) return <Redirect href="/portal/login" />;

  if (!isAdmin) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.five }]}>
        <Pressable style={styles.back} onPress={() => router.replace('/portal')}>
          <Ionicons name="chevron-back" size={20} color={Brand.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <View style={styles.lockedCard}>
          <Ionicons name="lock-closed-outline" size={28} color={Brand.warning} />
          <Text style={styles.title}>Acesso da equipe</Text>
          <Text style={styles.bodyText}>
            Este painel é restrito ao dono e equipe autorizada da feira. Para liberar acesso,
            crie um documento em admins/{user.uid} no Firestore.
          </Text>
          <Text selectable style={styles.uidText}>
            UID atual: {user.uid}
          </Text>
        </View>
      </ScrollView>
    );
  }

  const draftCount = exhibitors.filter((item) => item.status !== 'published').length;
  const publishedCount = exhibitors.filter((item) => item.status === 'published').length;
  const missingStandCount = exhibitors.filter((item) => !item.stand).length;
  const missingLogoCount = exhibitors.filter((item) => !item.logoUrl && !item.logo).length;
  const missingContactCount = exhibitors.filter(
    (item) => !item.contactEmail && !item.contactPhone && !item.contactName,
  ).length;
  const completedOnboardingCount = visitors.filter((v) => v.profile.onboardingCompleted).length;
  const normalizedSearch = normalizeSearch(search);
  const filtered = exhibitors.filter((item) => {
    if (statusFilter === 'review' && item.status === 'published') return false;
    if (statusFilter === 'published' && item.status !== 'published') return false;
    if (qualityFilter === 'missingStand' && item.stand) return false;
    if (qualityFilter === 'missingLogo' && (item.logoUrl || item.logo)) return false;
    if (qualityFilter === 'missingContact' && (item.contactEmail || item.contactPhone || item.contactName)) {
      return false;
    }
    if (!normalizedSearch) return true;
    const haystack = normalizeSearch(
      [
        item.company,
        item.industry,
        item.stand,
        item.status === 'published' ? 'publicado' : 'analise rascunho pendente',
        item.contactEmail,
        item.contactPhone,
        item.ownerUid,
      ]
        .filter(Boolean)
        .join(' '),
    );
    return haystack.includes(normalizedSearch);
  });

  const filteredVisitors = useMemo(() => {
    if (!normalizedSearch) return visitors;
    return visitors.filter((item) => {
      const haystack = normalizeSearch(
        [
          item.profile.name,
          item.profile.role,
          item.profile.company,
          item.profile.marketRole,
          item.profile.area,
          ...(item.profile.sector ?? []),
          ...(item.profile.objectives ?? []),
          ...(item.profile.interests ?? []),
          item.profile.email,
          item.profile.phone,
        ]
          .filter(Boolean)
          .join(' '),
      );
      return haystack.includes(normalizedSearch);
    });
  }, [visitors, normalizedSearch]);

  async function changeStatus(item: Exhibitor, nextStatus: 'draft' | 'published') {
    if (nextStatus === 'published' && !isReadyForPublication(item)) {
      Alert.alert(
        'Cadastro incompleto',
        'Revise o checklist antes de publicar. Logo, descrição, setor, contato, produtos e estande precisam estar preenchidos.',
      );
      return;
    }
    setBusyId(item.id);
    try {
      await setExhibitorStatus(item.id, nextStatus);
    } catch (err) {
      Alert.alert('Erro', (err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three, paddingBottom: 140 }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <Pressable style={styles.back} onPress={() => router.replace('/')}>
          <Ionicons name="chevron-back" size={20} color={Brand.textSecondary} />
          <Text style={styles.backText}>App</Text>
        </Pressable>
        <Pressable
          style={styles.signOut}
          onPress={async () => {
            await signOut();
            router.replace('/portal/login');
          }}>
          <Text style={styles.signOutText}>Sair</Text>
          <Ionicons name="log-out-outline" size={18} color={Brand.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.heading}>
        <Text style={styles.kicker}>Controle da feira</Text>
        <Text style={styles.title}>Painel do organizador</Text>
        <Text style={styles.bodyText}>
          Acompanhe cadastros, publique expositores e use os links oficiais para a equipe e
          para os expositores.
        </Text>
      </View>

      <View style={styles.linkGrid}>
        <LinkCard icon="briefcase-outline" title="Link do expositor" value={portalUrl} />
        <LinkCard icon="shield-checkmark-outline" title="Link da equipe" value={adminUrl} />
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Em análise" value={draftCount} tone="warning" />
        <Metric label="Publicados" value={publishedCount} tone="success" />
        <Metric label="Total Visitantes" value={visitors.length} />
        <Metric label="Onboarding OK" value={completedOnboardingCount} tone="success" />
      </View>

      {/* Selector de Abas do Administrador */}
      <View style={styles.adminTabs}>
        <Pressable
          style={[styles.adminTabBtn, adminTab === 'exhibitors' && styles.adminTabBtnActive]}
          onPress={() => {
            setAdminTab('exhibitors');
            setSearch('');
          }}>
          <Ionicons
            name="business-outline"
            size={16}
            color={adminTab === 'exhibitors' ? Brand.gold : Brand.textMuted}
          />
          <Text style={[styles.adminTabBtnText, adminTab === 'exhibitors' && styles.adminTabBtnTextActive]}>
            Expositores ({exhibitors.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.adminTabBtn, adminTab === 'visitors' && styles.adminTabBtnActive]}
          onPress={() => {
            setAdminTab('visitors');
            setSearch('');
          }}>
          <Ionicons
            name="people-outline"
            size={16}
            color={adminTab === 'visitors' ? Brand.gold : Brand.textMuted}
          />
          <Text style={[styles.adminTabBtnText, adminTab === 'visitors' && styles.adminTabBtnTextActive]}>
            Visitantes ({visitors.length})
          </Text>
        </Pressable>
      </View>

      {adminTab === 'exhibitors' && missingStandCount > 0 && (
        <View style={styles.warnBox}>
          <Ionicons name="alert-circle-outline" size={18} color={Brand.warning} />
          <Text style={styles.warnText}>
            {missingStandCount} expositor(es) ainda sem estande definido pelo organizador.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {adminTab === 'exhibitors' ? 'Cadastros de expositores' : 'Cadastros de visitantes'}
          </Text>
          <Text style={styles.sectionMeta}>
            {adminTab === 'exhibitors'
              ? `${filtered.length} de ${exhibitors.length} cadastros · ${sessions.length} sessões · ${sponsors.length} patrocinadores`
              : `${filteredVisitors.length} de ${visitors.length} visitantes cadastrados`}
          </Text>
        </View>
        {(exhibitorsLoading || visitorsLoading) && <ActivityIndicator color={Brand.gold} />}
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Brand.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={adminTab === 'exhibitors' ? "Buscar por empresa, setor, status, contato ou estande" : "Buscar por nome, cargo, empresa, setor..."}
          placeholderTextColor={Brand.textMuted}
          autoCapitalize="none"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Brand.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {adminTab === 'exhibitors' && (
        <>
          <View style={styles.filters}>
            <FilterButton label="Análise" active={statusFilter === 'review'} onPress={() => setStatusFilter('review')} />
            <FilterButton label="Publicados" active={statusFilter === 'published'} onPress={() => setStatusFilter('published')} />
            <FilterButton label="Todos" active={statusFilter === 'all'} onPress={() => setStatusFilter('all')} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qualityFilters}>
            <ChipFilter label="Todos" active={qualityFilter === 'all'} onPress={() => setQualityFilter('all')} />
            <ChipFilter
              label={`Estande pendente (${missingStandCount})`}
              active={qualityFilter === 'missingStand'}
              onPress={() => setQualityFilter('missingStand')}
            />
            <ChipFilter
              label={`Sem logo (${missingLogoCount})`}
              active={qualityFilter === 'missingLogo'}
              onPress={() => setQualityFilter('missingLogo')}
            />
            <ChipFilter
              label={`Sem contato (${missingContactCount})`}
              active={qualityFilter === 'missingContact'}
              onPress={() => setQualityFilter('missingContact')}
            />
          </ScrollView>
        </>
      )}

      <View style={styles.list}>
        {adminTab === 'exhibitors' ? (
          filtered.map((item) => {
            const checklist = getApprovalChecklist(item);
            const ready = isReadyForPublication(item);
            const completed = checklist.filter((approvalItem) => approvalItem.done).length;

            return (
              <View key={item.id} style={styles.exhibitorCard}>
                <View style={styles.cardTop}>
                  <View style={styles.companyBlock}>
                    <Text style={styles.companyName}>{item.company || 'Empresa sem nome'}</Text>
                    <Text style={styles.companyMeta}>
                      {item.industry || 'Setor não informado'} · {item.stand || 'Estande pendente'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'published' ? styles.statusPub : styles.statusDraft]}>
                    <Text style={styles.statusText}>{item.status === 'published' ? 'Publicado' : 'Análise'}</Text>
                  </View>
                </View>

                <Text style={styles.aboutText} numberOfLines={3}>
                  {item.about || 'Sem descrição institucional.'}
                </Text>

                <View style={styles.approvalBox}>
                  <View style={styles.approvalHeader}>
                    <Text style={styles.approvalTitle}>Checklist de aprovação</Text>
                    <Text style={[styles.approvalScore, ready ? styles.approvalScoreReady : styles.approvalScorePending]}>
                      {completed}/{checklist.length}
                    </Text>
                  </View>
                  <View style={styles.checklistGrid}>
                    {checklist.map((approvalItem) => (
                      <View key={approvalItem.key} style={styles.checklistItem}>
                        <Ionicons
                          name={approvalItem.done ? 'checkmark-circle' : 'alert-circle-outline'}
                          size={15}
                          color={approvalItem.done ? Brand.success : Brand.warning}
                        />
                        <Text style={[styles.checklistText, approvalItem.done && styles.checklistTextDone]}>
                          {approvalItem.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.ownerText} numberOfLines={1}>
                    {item.contactEmail || item.contactPhone || item.ownerUid || 'Sem contato'}
                  </Text>
                  {item.status === 'published' ? (
                    <Pressable
                      style={[styles.secondaryAction, busyId === item.id && styles.actionDisabled]}
                      disabled={busyId === item.id}
                      onPress={() => changeStatus(item, 'draft')}>
                      <Text style={styles.secondaryActionText}>Voltar para análise</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.primaryAction, (!ready || busyId === item.id) && styles.actionDisabled]}
                      disabled={busyId === item.id}
                      onPress={() => changeStatus(item, 'published')}>
                      <Text style={styles.primaryActionText}>{ready ? 'Publicar' : 'Revisar checklist'}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          filteredVisitors.map((item) => (
            <View key={item.uid} style={styles.exhibitorCard}>
              <View style={styles.cardTop}>
                <View style={styles.companyBlock}>
                  <Text style={styles.companyName}>{item.profile.name || 'Visitante sem nome'}</Text>
                  <Text style={styles.companyMeta}>
                    {item.profile.role || 'Cargo não informado'} · <Text style={{ color: Brand.gold }}>{item.profile.company || 'Empresa não informada'}</Text>
                  </Text>
                </View>
                <View style={[styles.statusBadge, item.profile.onboardingCompleted ? styles.statusPub : styles.statusDraft]}>
                  <Text style={styles.statusText}>{item.profile.onboardingCompleted ? 'Completo' : 'Incompleto'}</Text>
                </View>
              </View>

              <View style={styles.visitorDetails}>
                <Text style={styles.visitorDetailsTitle}>Perfil do Visitante</Text>
                <View style={styles.visitorDetailsGrid}>
                  <View style={styles.visitorDetailItem}>
                    <Text style={styles.visitorDetailLabel}>Papel de Mercado: </Text>
                    <Text style={styles.visitorDetailValue}>{item.profile.marketRole || 'Não informado'}</Text>
                  </View>
                  <View style={styles.visitorDetailItem}>
                    <Text style={styles.visitorDetailLabel}>Tipo de Cargo: </Text>
                    <Text style={styles.visitorDetailValue}>{item.profile.roleType || 'Não informado'}</Text>
                  </View>
                  <View style={styles.visitorDetailItem}>
                    <Text style={styles.visitorDetailLabel}>Budget Investimento: </Text>
                    <Text style={styles.visitorDetailValue}>{item.profile.budget || 'Não informado'}</Text>
                  </View>
                </View>

                {item.profile.sector && item.profile.sector.length > 0 && (
                  <View style={styles.visitorDetailChips}>
                    <Text style={styles.visitorDetailLabel}>Setores: </Text>
                    <View style={styles.tagsContainer}>
                      {item.profile.sector.map((s) => (
                        <View key={s} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {item.profile.objectives && item.profile.objectives.length > 0 && (
                  <View style={styles.visitorDetailChips}>
                    <Text style={styles.visitorDetailLabel}>Objetivos: </Text>
                    <View style={styles.tagsContainer}>
                      {item.profile.objectives.map((o) => (
                        <View key={o} style={[styles.tagChip, { borderColor: Brand.goldSoft }]}>
                          <Text style={[styles.tagChipText, { color: Brand.gold }]}>{o}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {item.profile.interests && item.profile.interests.length > 0 && (
                  <View style={styles.visitorDetailChips}>
                    <Text style={styles.visitorDetailLabel}>Interesses: </Text>
                    <View style={styles.tagsContainer}>
                      {item.profile.interests.map((i) => (
                        <View key={i} style={[styles.tagChip, { borderColor: Brand.borderGold }]}>
                          <Text style={[styles.tagChipText, { color: Brand.gold }]}>{i}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {item.profile.lookingFor ? (
                  <Text style={styles.visitorText}>
                    <Text style={styles.visitorTextLabel}>Busca: </Text>
                    {item.profile.lookingFor}
                  </Text>
                ) : null}

                {item.profile.offering ? (
                  <Text style={styles.visitorText}>
                    <Text style={styles.visitorTextLabel}>Oferece: </Text>
                    {item.profile.offering}
                  </Text>
                ) : null}

                {item.profile.bottlenecks && item.profile.bottlenecks.length > 0 && (
                  <View style={styles.visitorDetailChips}>
                    <Text style={styles.visitorDetailLabel}>Gargalos: </Text>
                    <View style={styles.tagsContainer}>
                      {item.profile.bottlenecks.map((b) => (
                        <View key={b} style={[styles.tagChip, { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                          <Text style={[styles.tagChipText, { color: '#FECACA' }]}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.ownerText} numberOfLines={1}>
                  {item.profile.email || item.profile.phone || item.uid || 'Sem contato'}
                </Text>
                <View style={styles.discoverableBadge}>
                  <Ionicons
                    name={item.profile.discoverable ? 'eye-outline' : 'eye-off-outline'}
                    size={13}
                    color={item.profile.discoverable ? Brand.gold : Brand.textMuted}
                  />
                  <Text style={[styles.discoverableText, { color: item.profile.discoverable ? Brand.gold : Brand.textMuted }]}>
                    {item.profile.discoverable ? 'Público (Match)' : 'Privado'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {adminTab === 'exhibitors' && !exhibitorsLoading && filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-circle-outline" size={24} color={Brand.success} />
            <Text style={styles.emptyText}>Nenhum expositor cadastrado ou correspondente ao filtro.</Text>
          </View>
        )}

        {adminTab === 'visitors' && !visitorsLoading && filteredVisitors.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-circle-outline" size={24} color={Brand.success} />
            <Text style={styles.emptyText}>Nenhum visitante cadastrado ou correspondente à busca.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ChipFilter({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chipFilter, active && styles.chipFilterActive]} onPress={onPress}>
      <Text style={[styles.chipFilterText, active && styles.chipFilterTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' }) {
  const color = tone === 'success' ? Brand.success : tone === 'warning' ? Brand.warning : Brand.gold;
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LinkCard({ icon, title, value }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string }) {
  return (
    <View style={styles.linkCard}>
      <Ionicons name={icon} size={19} color={Brand.gold} />
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text selectable style={styles.linkValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.filterButton, active && styles.filterButtonActive]} onPress={onPress}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { color: Brand.textSecondary, fontSize: 14 },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  signOutText: { color: Brand.textSecondary, fontSize: 14 },
  heading: { gap: Spacing.one },
  kicker: { color: Brand.gold, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Brand.textPrimary, fontSize: 25, fontWeight: '900' },
  bodyText: { color: Brand.textSecondary, fontSize: 13.5, lineHeight: 20 },
  linkGrid: { gap: Spacing.two },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  linkCopy: { flex: 1, gap: 3 },
  linkTitle: { color: Brand.textPrimary, fontSize: 13.5, fontWeight: '800' },
  linkValue: { color: Brand.gold, fontSize: 12.5, fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metricCard: {
    minWidth: 135,
    flex: 1,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  metricValue: { fontSize: 28, fontWeight: '900' },
  metricLabel: { color: Brand.textSecondary, fontSize: 12.5, fontWeight: '700' },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  warnText: { color: Brand.warning, fontSize: 12.5, flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: Brand.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionMeta: { color: Brand.textMuted, fontSize: 12, marginTop: 3 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: Brand.textPrimary,
    fontSize: 14,
    paddingVertical: 12,
  },
  filters: { flexDirection: 'row', gap: Spacing.two },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 10,
    backgroundColor: Brand.bgCard,
  },
  filterButtonActive: { backgroundColor: Brand.goldSoft, borderColor: Brand.borderGold },
  filterText: { color: Brand.textMuted, fontSize: 12.5, fontWeight: '800' },
  filterTextActive: { color: Brand.gold },
  qualityFilters: { gap: Spacing.two, paddingRight: Spacing.four },
  chipFilter: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    backgroundColor: Brand.bgCard,
  },
  chipFilterActive: { backgroundColor: Brand.blueSoft, borderColor: Brand.techBlue },
  chipFilterText: { color: Brand.textSecondary, fontSize: 12.5, fontWeight: '800' },
  chipFilterTextActive: { color: Brand.textPrimary },
  list: { gap: Spacing.two },
  exhibitorCard: {
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  companyBlock: { flex: 1, gap: 3 },
  companyName: { color: Brand.textPrimary, fontSize: 16, fontWeight: '900' },
  companyMeta: { color: Brand.textSecondary, fontSize: 12.5 },
  statusBadge: { borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  statusDraft: { backgroundColor: 'rgba(245, 158, 11, 0.14)' },
  statusPub: { backgroundColor: 'rgba(34, 197, 94, 0.14)' },
  statusText: { color: Brand.textPrimary, fontSize: 11, fontWeight: '800' },
  aboutText: { color: Brand.textSecondary, fontSize: 12.5, lineHeight: 18 },
  approvalBox: {
    gap: Spacing.two,
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
  approvalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  approvalTitle: { color: Brand.textPrimary, fontSize: 13, fontWeight: '900' },
  approvalScore: { fontSize: 12.5, fontWeight: '900' },
  approvalScoreReady: { color: Brand.success },
  approvalScorePending: { color: Brand.warning },
  checklistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 108 },
  checklistText: { color: Brand.warning, fontSize: 12 },
  checklistTextDone: { color: Brand.textSecondary },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  ownerText: { color: Brand.textMuted, fontSize: 12, flex: 1 },
  primaryAction: {
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  primaryActionText: { color: '#0A1021', fontSize: 12.5, fontWeight: '900' },
  secondaryAction: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  secondaryActionText: { color: Brand.textSecondary, fontSize: 12.5, fontWeight: '800' },
  actionDisabled: { opacity: 0.5 },
  emptyBox: {
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    padding: Spacing.four,
  },
  emptyText: { color: Brand.textSecondary, fontSize: 13.5, fontWeight: '700' },
  lockedCard: {
    gap: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    padding: Spacing.four,
  },
  uidText: { color: Brand.gold, fontSize: 12.5, fontWeight: '700' },
  adminTabs: {
    flexDirection: 'row',
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 4,
    marginTop: Spacing.two,
  },
  adminTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  adminTabBtnActive: {
    backgroundColor: '#0E172F',
    borderWidth: 1,
    borderColor: 'rgba(47, 107, 255, 0.4)',
  },
  adminTabBtnText: { color: Brand.textSecondary, fontSize: 13, fontWeight: '600' },
  adminTabBtnTextActive: { color: Brand.textPrimary, fontWeight: '700' },
  visitorDetails: {
    backgroundColor: Brand.bgPrimary,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.sm,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  visitorDetailsTitle: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  visitorDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  visitorDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitorDetailLabel: {
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  visitorDetailValue: {
    color: Brand.textPrimary,
    fontSize: 12,
  },
  visitorDetailChips: {
    gap: 6,
  },
  visitorText: {
    color: Brand.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  visitorTextLabel: {
    color: Brand.gold,
    fontWeight: '700',
  },
  discoverableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Brand.bgPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  discoverableText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  tagChipText: {
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
