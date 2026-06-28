import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { ScoreRing } from '@/components/score-ring';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/use-auth';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { isProfileUsable, rankExhibitorsWithGemini, type RankedExhibitor } from '@/features/matchmaking/score';
import { DEMO_VISITOR_PROFILE, useVisitorProfile } from '@/features/visitor/visitor-profile';

/** Acima deste fit, é "Recomendado"; abaixo, "Oportunidade a explorar". */
const RECOMMENDED_THRESHOLD = 70;

function MatchCard({ ranked, highlight }: { ranked: RankedExhibitor; highlight?: boolean }) {
  const { exhibitor, fit } = ranked;
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      {highlight && (
        <View style={styles.topPick}>
          <Ionicons name="star" size={11} color={Brand.bgPrimary} />
          <Text style={styles.topPickText}>MELHOR MATCH</Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <ExhibitorLogo logoUrl={exhibitor.logoUrl} logo={exhibitor.logo} style={styles.logo} textSize={11} />
        <View style={styles.cardInfo}>
          <Text style={styles.companyName}>{exhibitor.company}</Text>
          <Text style={styles.companyIndustry}>{exhibitor.industry}</Text>
        </View>
        <ScoreRing score={fit.score} />
      </View>

      {fit.reasons.length > 0 && (
        <View style={styles.reasonBox}>
          <Ionicons name="sparkles" size={13} color={Brand.gold} />
          <Text style={styles.reasonText}>{fit.reasons.join(' · ')}</Text>
        </View>
      )}

      <View style={styles.tagsWrap}>
        {fit.tags.map((t) => (
          <View key={t} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.btnPrimary} onPress={() => router.push(`/exhibitor/${exhibitor.id}`)}>
          <Ionicons name="open-outline" size={15} color={Brand.bgPrimary} />
          <Text style={styles.btnPrimaryText}>Ver expositor</Text>
        </Pressable>
        <Pressable style={styles.btnGhost}>
          <Ionicons name="bookmark-outline" size={16} color={Brand.gold} />
        </Pressable>
      </View>
    </View>
  );
}

export default function MatchmakingScreen() {
  const insets = useSafeAreaInsets();
  const { configured } = useAuth();
  const { exhibitors } = useExhibitors();
  const { profile } = useVisitorProfile();

  const [tab, setTab] = useState<'recomendados' | 'oportunidades'>('recomendados');
  const [ranked, setRanked] = useState<RankedExhibitor[]>([]);
  const [loading, setLoading] = useState(false);

  // Sem Firebase → usa perfil de demonstração para o ranking não ficar vazio.
  const activeProfile = configured ? profile : DEMO_VISITOR_PROFILE;

  const usable = isProfileUsable(activeProfile);

  useEffect(() => {
    let active = true;
    async function loadMatches() {
      if (!exhibitors || exhibitors.length === 0) return;
      setLoading(true);
      try {
        const data = await rankExhibitorsWithGemini(activeProfile, exhibitors);
        if (active) {
          setRanked(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadMatches();
    return () => {
      active = false;
    };
  }, [activeProfile, exhibitors]);

  const recommended = ranked.filter((r) => r.fit.score >= RECOMMENDED_THRESHOLD);
  const opportunities = ranked.filter((r) => r.fit.score < RECOMMENDED_THRESHOLD);
  const data = tab === 'recomendados' ? recommended : opportunities;


  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.two, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Brand.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>AI Matchmaking</Text>
          <Pressable style={styles.backBtn} onPress={() => router.push('/profile')}>
            <Ionicons name="options-outline" size={20} color={Brand.textPrimary} />
          </Pressable>
        </View>

        {/* Banner IA */}
        <LinearGradient
          colors={[Brand.goldSoft, 'rgba(47,107,255,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiBanner}>
          <View style={styles.aiBannerIcon}>
            <Ionicons name="sparkles" size={18} color={Brand.bgPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBannerTitle}>
              {recommended.length} matches recomendados para você
            </Text>
            <Text style={styles.aiBannerDesc}>
              Cruzamos o perfil da sua operação com os {exhibitors.length} expositores para priorizar
              reuniões úteis.
            </Text>
          </View>
        </LinearGradient>

        {/* Aviso para completar o perfil */}
        {!usable && (
          <Pressable style={styles.completeCta} onPress={() => router.push('/profile')}>
            <Ionicons name="person-add-outline" size={16} color={Brand.gold} />
            <Text style={styles.completeText}>
              Complete seu perfil para matches mais precisos
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Brand.textMuted} />
          </Pressable>
        )}

        {/* Segmented */}
        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentItem, tab === 'recomendados' && styles.segmentActive]}
            onPress={() => setTab('recomendados')}>
            <Text style={[styles.segmentText, tab === 'recomendados' && styles.segmentTextActive]}>
              Recomendados ({recommended.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentItem, tab === 'oportunidades' && styles.segmentActive]}
            onPress={() => setTab('oportunidades')}>
            <Text style={[styles.segmentText, tab === 'oportunidades' && styles.segmentTextActive]}>
              Oportunidades ({opportunities.length})
            </Text>
          </Pressable>
        </View>

        {/* Lista */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Brand.gold} />
            <Text style={styles.loadingText}>A Inteligência Artificial está analisando os estandes...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={32} color={Brand.textMuted} />
            <Text style={styles.emptyText}>
              {tab === 'recomendados'
                ? 'Nenhum match forte ainda. Ajuste seu perfil para refinar.'
                : 'Todos os expositores já estão entre os recomendados.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.three }}>
            {data.map((r, i) => (
              <MatchCard
                key={r.exhibitor.id}
                ranked={r}
                highlight={tab === 'recomendados' && i === 0}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgPrimary },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.four },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: Brand.textPrimary, fontSize: 18, fontWeight: '800' },

  aiBanner: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.borderGold,
  },
  aiBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: { color: Brand.textPrimary, fontSize: 14.5, fontWeight: '700' },
  aiBannerDesc: { color: Brand.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 },

  completeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.borderGold,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  completeText: { color: Brand.textSecondary, fontSize: 13, flex: 1 },

  segment: {
    flexDirection: 'row',
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: Radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: Brand.goldSoft },
  segmentText: { color: Brand.textSecondary, fontSize: 13.5, fontWeight: '600' },
  segmentTextActive: { color: Brand.gold },

  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  emptyText: { color: Brand.textMuted, fontSize: 13.5, textAlign: 'center', paddingHorizontal: Spacing.four },

  card: {
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardHighlight: { borderColor: Brand.borderGold },
  topPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Brand.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  topPickText: { color: Brand.bgPrimary, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  logo: { width: 64, height: 48 },
  cardInfo: { flex: 1, gap: 2 },
  companyName: { color: Brand.textPrimary, fontSize: 15.5, fontWeight: '700' },
  companyIndustry: { color: Brand.textSecondary, fontSize: 12.5 },

  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Brand.bgPrimary,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  reasonText: { color: Brand.textSecondary, fontSize: 12.5, flex: 1, lineHeight: 17 },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: Brand.bgElevated,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  tagText: { color: Brand.textSecondary, fontSize: 11, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: Spacing.two },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Brand.gold,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  btnPrimaryText: { color: Brand.bgPrimary, fontSize: 14, fontWeight: '800' },
  btnGhost: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.goldSoft,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.borderGold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.three,
  },
  loadingText: {
    color: Brand.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});

