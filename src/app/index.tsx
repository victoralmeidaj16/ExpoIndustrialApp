import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/use-auth';
import { useEventConfig } from '@/features/event/use-event-config';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { useMaterials } from '@/features/materials/use-materials';
import { type SponsorTier } from '@/features/sponsors/sponsor';
import { useSponsors } from '@/features/sponsors/use-sponsors';
import { useVisitorProfile } from '@/features/visitor/visitor-profile';

type IconName = keyof typeof Ionicons.glyphMap;

const KPIS: { icon: IconName; value: string; label: string }[] = [
  { icon: 'people-outline', value: '10.000+', label: 'Visitantes' },
  { icon: 'business-outline', value: '200+', label: 'Expositores' },
  { icon: 'time-outline', value: '8', label: 'Eventos\nsimultâneos' },
];

const QUICK_ACTIONS: { icon: IconName; label: string; route?: string }[] = [
  { icon: 'qr-code-outline', label: 'Meu Crachá', route: '/profile' },
  { icon: 'map-outline', label: 'Mapa Smart', route: '/map' },
  { icon: 'sparkles-outline', label: 'Matchmaking', route: '/matchmaking' },
  { icon: 'calendar-outline', label: 'Agenda', route: '/agenda' },
];

const RECOMMENDATIONS = [
  {
    tag: 'Palestra',
    title: 'Indústria 4.0 & ESG na prática',
    meta: '14:00 · Auditório Central',
    accent: Brand.techBlue,
  },
  {
    tag: 'Match IA',
    title: 'Siemens tem 95% de fit com sua operação',
    meta: 'Automação & Robótica',
    accent: Brand.gold,
  },
  {
    tag: 'Networking',
    title: 'Rodada de compradores — PPCP',
    meta: '16:30 · Sala Executiva',
    accent: Brand.cyan,
  },
];

const TIER_COLOR: Record<SponsorTier, string> = {
  DIAMOND: Brand.gold,
  GOLD: Brand.techBlue,
  SILVER: Brand.textSecondary,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { exhibitors } = useExhibitors();
  const featured = exhibitors.slice(0, 8);
  const { sponsors } = useSponsors();
  const { event } = useEventConfig();
  const { materials } = useMaterials();
  const { user, configured } = useAuth();
  const { profile, loading: profileLoading } = useVisitorProfile();

  useEffect(() => {
    if (configured && user && !profileLoading && profile) {
      if (!profile.onboardingCompleted && !profile.onboardingSkipped) {
        router.replace('/onboarding');
      }
    }
  }, [user, configured, profile, profileLoading]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image
              source={require('@/assets/images/logo-expoindustrial.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerActions}>
            <HeaderIcon icon="search-outline" />
            <HeaderIcon icon="notifications-outline" badge />
          </View>
        </View>

        {/* Hero do evento (foto + overlay) */}
        <ImageBackground
          source={require('@/assets/images/expo-hero.png')}
          style={styles.hero}
          imageStyle={styles.heroImage}>
          <LinearGradient
            colors={['rgba(5,8,22,0.15)', 'rgba(5,8,22,0.55)', 'rgba(5,8,22,0.95)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTopRow}>
            <View style={styles.liveBadge}>
              <Ionicons name="calendar" size={13} color="#FECACA" />
              <Text style={styles.liveText}>{event.dateLabel}</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroEyebrow}>{event.name}</Text>
            <Text style={styles.heroTitle}>{event.tagline}</Text>
            <Text style={styles.heroSubtitle}>
              {[event.venueName, event.venueAddress].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </ImageBackground>

        {/* Banner de Onboarding Incompleto */}
        {profile && profile.onboardingSkipped && !profile.onboardingCompleted && (
          <Pressable
            style={styles.onboardingBanner}
            onPress={() => router.push('/onboarding')}>
            <LinearGradient
              colors={['#0F172A', '#1E1B4B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.onboardingBannerGradient}>
              <View style={styles.onboardingBannerLeft}>
                <View style={styles.onboardingBannerIcon}>
                  <Ionicons name="sparkles" size={16} color={Brand.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.onboardingBannerTitle}>Complete seu perfil</Text>
                  <Text style={styles.onboardingBannerSub}>
                    Ative recomendações de estandes e o match de pessoas.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Brand.gold} />
            </LinearGradient>
          </Pressable>
        )}

        {/* KPIs */}
        <View style={styles.kpiRow}>
          {KPIS.map((kpi) => (
            <View key={kpi.label} style={styles.kpiCard}>
              <View style={styles.kpiIcon}>
                <Ionicons name={kpi.icon} size={16} color={Brand.gold} />
              </View>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* Assistente IA */}
        <Pressable style={styles.aiBar} onPress={() => router.push('/assistant')}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={16} color={Brand.gold} />
          </View>
          <Text style={styles.aiText}>Qual estande devo visitar agora?</Text>
          <View style={styles.micButton}>
            <Ionicons name="mic" size={18} color={Brand.textPrimary} />
          </View>
        </Pressable>

        {/* Ações rápidas */}
        <SectionHeader title="Ações rápidas" />
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={styles.quickItem}
              onPress={() => action.route && router.push(action.route as never)}>
              <View style={styles.quickIcon}>
                <Ionicons name={action.icon} size={29} color={Brand.textPrimary} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Expositores em destaque */}
        <SectionHeader
          title="Expositores em destaque"
          actionLabel="Ver todos"
          onAction={() => router.push('/exhibitors')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredRow}>
          {featured.map((exhibitor) => (
            <Pressable
              key={exhibitor.id}
              style={styles.featuredCard}
              onPress={() => router.push(`/exhibitor/${exhibitor.id}`)}>
              <ExhibitorLogo
                logoUrl={exhibitor.logoUrl}
                logo={exhibitor.logo || exhibitor.company}
                style={styles.featuredLogo}
                textSize={15}
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Recomendações de hoje */}
        <SectionHeader title="Recomendado para hoje" actionLabel="Ver mais" />
        <View style={styles.recoList}>
          {RECOMMENDATIONS.map((item) => (
            <Pressable key={item.title} style={styles.recoCard}>
              <View style={[styles.recoAccent, { backgroundColor: item.accent }]} />
              <View style={styles.recoBody}>
                <Text style={[styles.recoTag, { color: item.accent }]}>{item.tag.toUpperCase()}</Text>
                <Text style={styles.recoTitle}>{item.title}</Text>
                <Text style={styles.recoMeta}>{item.meta}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Brand.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Patrocinadores */}
        <SectionHeader title="Patrocinadores" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sponsorsRow}>
          {sponsors.map((sponsor) => (
            <View
              key={sponsor.id}
              style={[
                styles.sponsorCard,
                sponsor.tier === 'DIAMOND' && styles.sponsorCardDiamond,
                sponsor.tier === 'GOLD' && styles.sponsorCardGold,
              ]}>
              <View style={styles.sponsorTierBadge}>
                <Text style={[styles.sponsorTierText, { color: TIER_COLOR[sponsor.tier] }]}>
                  {sponsor.tier}
                </Text>
              </View>
              <Text style={styles.sponsorName}>{sponsor.logoText}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Materiais para download (geridos no painel do organizador) */}
        {materials.length > 0 && (
          <>
            <SectionHeader title="Materiais para download" />
            <View style={styles.materialsList}>
              {materials.map((material) => (
                <Pressable
                  key={material.id}
                  style={styles.materialCard}
                  onPress={() => Linking.openURL(material.fileUrl)}>
                  <View style={styles.materialIcon}>
                    <Ionicons name="document-text-outline" size={20} color={Brand.gold} />
                  </View>
                  <View style={styles.materialBody}>
                    <Text style={styles.materialTitle} numberOfLines={1}>
                      {material.title}
                    </Text>
                    {material.description ? (
                      <Text style={styles.materialMeta} numberOfLines={1}>
                        {material.description}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="download-outline" size={20} color={Brand.textMuted} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Realização / co-branding */}
        <View style={styles.realization}>
          <Text style={styles.realizationLabel}>REALIZAÇÃO</Text>
          <Image
            source={require('@/assets/images/logo-realizacao.png')}
            style={styles.realizationLogo}
            resizeMode="contain"
          />
          <Pressable style={styles.portalLink} onPress={() => router.push('/portal')}>
            <Ionicons name="briefcase-outline" size={15} color={Brand.gold} />
            <Text style={styles.portalLinkText}>Portal do expositor</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function HeaderIcon({ icon, badge }: { icon: IconName; badge?: boolean }) {
  return (
    <View style={styles.headerIcon}>
      <Ionicons name={icon} size={20} color={Brand.textPrimary} />
      {badge && <View style={styles.headerBadge} />}
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgPrimary },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.four },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLogo: { width: 212, height: 36 },

  // Realização (co-branding)
  realization: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  realizationLabel: {
    color: Brand.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
  },
  realizationLogo: { width: 240, height: 64, opacity: 0.95 },
  portalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Brand.goldSoft,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    marginTop: Spacing.one,
  },
  portalLinkText: { color: Brand.gold, fontSize: 12.5, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: Spacing.two },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Brand.danger,
    borderWidth: 1.5,
    borderColor: Brand.bgCard,
  },

  // Hero
  hero: {
    height: 210,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.borderGold,
    justifyContent: 'space-between',
  },
  heroImage: { borderRadius: Radius.lg },
  heroTopRow: { flexDirection: 'row', justifyContent: 'flex-start', padding: Spacing.three },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
  },
  liveText: { color: '#FECACA', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroBottom: { padding: Spacing.three, gap: 4 },
  heroEyebrow: { color: Brand.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: Brand.textPrimary, fontSize: 23, fontWeight: '800' },
  heroSubtitle: { color: '#D7DCE3', fontSize: 12.5, lineHeight: 18 },

  // KPIs
  kpiRow: { flexDirection: 'row', gap: Spacing.two },
  kpiCard: {
    flex: 1,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: 4,
  },
  kpiIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kpiValue: { color: Brand.gold, fontSize: 19, fontWeight: '800' },
  kpiLabel: { color: Brand.textSecondary, fontSize: 11, textAlign: 'center' },

  // AI bar
  aiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 8,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: { flex: 1, color: Brand.textSecondary, fontSize: 14 },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  sectionTitle: { color: Brand.textPrimary, fontSize: 17, fontWeight: '700' },
  sectionAction: { color: Brand.gold, fontSize: 13, fontWeight: '600' },

  // Quick actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 8, width: 72 },
  quickIcon: {
    width: 83,
    height: 83,
    borderRadius: Radius.md,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { color: Brand.textSecondary, fontSize: 11.5, textAlign: 'center' },

  // Featured (cards brancos com logo)
  featuredRow: { gap: Spacing.two, paddingRight: Spacing.four },
  featuredCard: {
    width: 120,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  featuredLogo: { width: '100%', height: '100%', backgroundColor: 'transparent' },

  // Recommendations
  recoList: { gap: Spacing.two },
  recoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    paddingRight: Spacing.three,
    overflow: 'hidden',
  },
  recoAccent: { width: 4, alignSelf: 'stretch' },
  recoBody: { flex: 1, padding: Spacing.three, gap: 3 },
  recoTag: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 },
  recoTitle: { color: Brand.textPrimary, fontSize: 14.5, fontWeight: '600' },
  recoMeta: { color: Brand.textSecondary, fontSize: 12 },

  // Materiais para download
  materialsList: { gap: Spacing.two },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Brand.bgElevated,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialBody: { flex: 1, gap: 2 },
  materialTitle: { color: Brand.textPrimary, fontSize: 14, fontWeight: '700' },
  materialMeta: { color: Brand.textSecondary, fontSize: 12 },

  // Sponsors
  sponsorsRow: { gap: Spacing.two, paddingRight: Spacing.four },
  sponsorCard: {
    width: 130,
    height: 76,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    position: 'relative',
  },
  sponsorCardDiamond: {
    borderColor: Brand.gold,
    backgroundColor: 'rgba(201, 162, 76, 0.05)',
  },
  sponsorCardGold: {
    borderColor: Brand.techBlue,
    backgroundColor: 'rgba(47, 107, 255, 0.05)',
  },
  sponsorTierBadge: {
    position: 'absolute',
    top: 6,
    left: 10,
  },
  sponsorTierText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sponsorName: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  onboardingBanner: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.borderGold,
  },
  onboardingBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  onboardingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  onboardingBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(201, 162, 76, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingBannerTitle: {
    color: Brand.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  onboardingBannerSub: {
    color: Brand.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
  },
});
