import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { addSavedLead, removeSavedLead, useSavedLeads } from '@/features/visitor/leads';
import {
  DEMO_VISITOR_PROFILE,
  getVisitorProfileByUid,
  type VisitorProfile,
} from '@/features/visitor/visitor-profile';

export default function VisitorProfileDetailScreen() {
  const insets = useSafeAreaInsets();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingLead, setSavingLead] = useState(false);

  const { leads: savedLeads } = useSavedLeads();

  useEffect(() => {
    async function loadProfile() {
      if (!uid) return;
      try {
        if (uid === 'demo-user') {
          setProfile(DEMO_VISITOR_PROFILE);
        } else {
          const res = await getVisitorProfileByUid(uid);
          setProfile(res);
        }
      } catch (err) {
        console.error('Erro ao carregar visitante:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [uid]);

  const isLeadSaved =
    profile && savedLeads.some((l) => l.email === profile.email || l.id === uid);
  const matchedLead =
    profile && savedLeads.find((l) => l.email === profile.email || l.id === uid);

  const handleToggleLead = async () => {
    if (!profile) return;
    setSavingLead(true);
    try {
      if (isLeadSaved && matchedLead) {
        await removeSavedLead(matchedLead.id);
        Alert.alert('Sucesso', 'Contato removido dos seus leads.');
      } else {
        await addSavedLead({
          name: profile.name,
          role: profile.role || 'Visitante',
          company: profile.company || 'Empresa',
          email: profile.email || '',
          phone: profile.phone || '',
          source: 'Conexão por QR Code',
        });
        Alert.alert('Sucesso', 'Contato adicionado aos seus leads!');
      }
    } catch (err) {
      Alert.alert('Erro', (err as Error).message);
    } finally {
      setSavingLead(false);
    }
  };

  const handleOpenLink = (url: string) => {
    if (!url) return;
    let targetUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      targetUrl = `https://${url}`;
    }
    Linking.openURL(targetUrl).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o link.');
    });
  };

  const handleOpenWhatsApp = () => {
    if (!profile?.phone) return;
    const digits = profile.phone.replace(/\D/g, '');
    const intl = digits.startsWith('55') ? digits : `55${digits}`;
    Linking.openURL(`https://wa.me/${intl}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  };

  const handleOpenMail = () => {
    if (!profile?.email) return;
    Linking.openURL(`mailto:${profile.email}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o e-mail.');
    });
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={Brand.gold} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, styles.centerScreen, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Brand.textMuted} />
        <Text style={styles.errorText}>Perfil do visitante não encontrado.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const initials = profile.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'VI';

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.one }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Brand.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Credencial Digital</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Cartão de Visita Principal */}
        <LinearGradient
          colors={[Brand.bgSecondary, Brand.bgCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}>
          <View style={styles.badgeGlow} />

          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>VISITANTE</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.nameText}>{profile.name}</Text>
            <Text style={styles.roleText}>{profile.role}</Text>
            <Text style={styles.companyText}>{profile.company}</Text>
          </View>
        </LinearGradient>

        {/* Botão de Salvar Lead */}
        <Pressable
          style={[styles.actionBtn, isLeadSaved && styles.actionBtnSaved]}
          onPress={handleToggleLead}
          disabled={savingLead}>
          {savingLead ? (
            <ActivityIndicator color={Brand.bgPrimary} />
          ) : (
            <>
              <Ionicons
                name={isLeadSaved ? 'checkmark-circle' : 'person-add-outline'}
                size={18}
                color={isLeadSaved ? Brand.textPrimary : Brand.bgPrimary}
              />
              <Text style={[styles.actionBtnText, isLeadSaved && styles.actionBtnTextSaved]}>
                {isLeadSaved ? 'Contato Salvo nos Leads' : 'Salvar nos Meus Leads'}
              </Text>
            </>
          )}
        </Pressable>

        {/* Redes e Canais de Contato */}
        <Text style={styles.sectionTitle}>Contatos e Conexões</Text>
        <View style={styles.linksGrid}>
          {/* WhatsApp */}
          <Pressable
            style={[styles.linkCard, !profile.phone && styles.linkCardDisabled]}
            onPress={handleOpenWhatsApp}
            disabled={!profile.phone}>
            <View style={[styles.linkIconContainer, { backgroundColor: '#25D36622' }]}>
              <Ionicons
                name="logo-whatsapp"
                size={22}
                color={profile.phone ? '#25D366' : Brand.textMuted}
              />
            </View>
            <Text style={[styles.linkName, !profile.phone && styles.linkTextDisabled]}>
              WhatsApp
            </Text>
            <Text style={styles.linkVal} numberOfLines={1}>
              {profile.phone || 'Não preenchido'}
            </Text>
          </Pressable>

          {/* LinkedIn */}
          <Pressable
            style={[styles.linkCard, !profile.linkedin && styles.linkCardDisabled]}
            onPress={() => profile.linkedin && handleOpenLink(profile.linkedin)}
            disabled={!profile.linkedin}>
            <View style={[styles.linkIconContainer, { backgroundColor: '#0A66C222' }]}>
              <Ionicons
                name="logo-linkedin"
                size={22}
                color={profile.linkedin ? '#0A66C2' : Brand.textMuted}
              />
            </View>
            <Text style={[styles.linkName, !profile.linkedin && styles.linkTextDisabled]}>
              LinkedIn
            </Text>
            <Text style={styles.linkVal} numberOfLines={1}>
              {profile.linkedin ? 'Conectar' : 'Não preenchido'}
            </Text>
          </Pressable>

          {/* E-mail */}
          <Pressable
            style={[styles.linkCard, !profile.email && styles.linkCardDisabled]}
            onPress={handleOpenMail}
            disabled={!profile.email}>
            <View style={[styles.linkIconContainer, { backgroundColor: `${Brand.gold}22` }]}>
              <Ionicons
                name="mail-outline"
                size={22}
                color={profile.email ? Brand.gold : Brand.textMuted}
              />
            </View>
            <Text style={[styles.linkName, !profile.email && styles.linkTextDisabled]}>
              E-mail
            </Text>
            <Text style={styles.linkVal} numberOfLines={1}>
              {profile.email || 'Não preenchido'}
            </Text>
          </Pressable>

          {/* Website */}
          <Pressable
            style={[styles.linkCard, !profile.website && styles.linkCardDisabled]}
            onPress={() => profile.website && handleOpenLink(profile.website)}
            disabled={!profile.website}>
            <View style={[styles.linkIconContainer, { backgroundColor: '#00B4D822' }]}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={profile.website ? '#00B4D8' : Brand.textMuted}
              />
            </View>
            <Text style={[styles.linkName, !profile.website && styles.linkTextDisabled]}>
              Site
            </Text>
            <Text style={styles.linkVal} numberOfLines={1}>
              {profile.website ? 'Visitar site' : 'Não preenchido'}
            </Text>
          </Pressable>
        </View>

        {/* Perfil Operacional */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.four }]}>
          Perfil da Operação
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Área de Atuação</Text>
            <Text style={styles.detailValue}>{profile.area || 'Não informada'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Budget Estimado</Text>
            <Text style={styles.detailValue}>{profile.budget || 'Não informado'}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Gargalos Tecnológicos</Text>
            {profile.bottlenecks && profile.bottlenecks.length > 0 ? (
              <View style={styles.chipsContainer}>
                {profile.bottlenecks.map((bot) => (
                  <View key={bot} style={styles.chip}>
                    <Text style={styles.chipText}>{bot}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.detailValue}>Nenhum gargalo listado</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bgPrimary,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Brand.textSecondary,
    fontSize: 16,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  backBtn: {
    backgroundColor: Brand.gold,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
  },
  backBtnText: {
    color: Brand.bgPrimary,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    backgroundColor: Brand.bgPrimary,
  },
  headerTitle: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.bgCard,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 60,
  },
  profileCard: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.border,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  badgeGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Brand.gold,
    opacity: 0.08,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Brand.gold,
  },
  avatarText: {
    color: Brand.gold,
    fontSize: 20,
    fontWeight: 'bold',
  },
  tagBadge: {
    backgroundColor: Brand.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  tagBadgeText: {
    color: Brand.bgPrimary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardBody: {
    gap: 4,
  },
  nameText: {
    color: Brand.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  roleText: {
    color: Brand.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  companyText: {
    color: Brand.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.gold,
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: 8,
    marginBottom: Spacing.four,
  },
  actionBtnSaved: {
    backgroundColor: Brand.goldSoft,
    borderWidth: 1,
    borderColor: Brand.gold,
  },
  actionBtnText: {
    color: Brand.bgPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionBtnTextSaved: {
    color: Brand.textPrimary,
  },
  sectionTitle: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  linkCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    gap: 4,
  },
  linkCardDisabled: {
    opacity: 0.5,
  },
  linkIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  linkName: {
    color: Brand.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  linkTextDisabled: {
    color: Brand.textMuted,
  },
  linkVal: {
    color: Brand.textSecondary,
    fontSize: 12,
    maxWidth: '90%',
  },
  detailsContainer: {
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  detailRow: {
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    gap: 4,
  },
  detailLabel: {
    color: Brand.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    color: Brand.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    backgroundColor: Brand.bgPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  chipText: {
    color: Brand.textSecondary,
    fontSize: 12,
  },
});
