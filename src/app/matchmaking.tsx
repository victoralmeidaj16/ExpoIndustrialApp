import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { ScoreRing } from '@/components/score-ring';
import { Card, HeaderIconButton, ScreenBody, ScreenHeader, TAB_BAR_CLEARANCE } from '@/components/ui-kit';
import { Light, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/use-auth';
import { useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { isProfileUsable, rankExhibitorsWithGemini, type RankedExhibitor } from '@/features/matchmaking/score';
import { DEMO_VISITOR_PROFILE, useVisitorProfile } from '@/features/visitor/visitor-profile';

/** Acima deste fit, é "Recomendado"; abaixo, "Oportunidade a explorar". */
const RECOMMENDED_THRESHOLD = 70;

function MatchCard({ ranked, highlight }: { ranked: RankedExhibitor; highlight?: boolean }) {
  const { exhibitor, fit } = ranked;
  return (
    <Card style={highlight ? styles.cardHighlight : undefined}>
      {highlight && (
        <View style={styles.topPick}>
          <Ionicons name="star" size={11} color="#fff" />
          <Text style={styles.topPickText}>MELHOR MATCH</Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <ExhibitorLogo logoUrl={exhibitor.logoUrl} logo={exhibitor.logo} style={styles.logo} textSize={11} />
        <View style={styles.cardInfo}>
          <Text style={styles.companyName}>{exhibitor.company}</Text>
          <Text style={styles.companyIndustry}>
            {exhibitor.industry} · <Text style={{ color: Light.gold, fontWeight: '700' }}>Estande {exhibitor.stand}</Text>
          </Text>
        </View>
        <ScoreRing score={fit.score} />
      </View>

      {fit.reasons.length > 0 && (
        <View style={styles.reasonBox}>
          <Ionicons name="sparkles" size={13} color={Light.gold} />
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
          <Ionicons name="open-outline" size={15} color="#fff" />
          <Text style={styles.btnPrimaryText}>Ver expositor</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary} onPress={() => router.push(`/map?stand=${exhibitor.stand}`)}>
          <Ionicons name="map-outline" size={15} color={Light.navy} />
          <Text style={styles.btnSecondaryText}>Ver no Mapa</Text>
        </Pressable>
        <Pressable style={styles.btnGhost}>
          <Ionicons name="bookmark-outline" size={16} color={Light.gold} />
        </Pressable>
      </View>
    </Card>
  );
}

export default function MatchmakingScreen() {
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
      <ScreenHeader
        title="AI Matchmaking"
        subtitle="Networking inteligente com IA"
        onBack={() => router.back()}
        right={<HeaderIconButton icon="options-outline" onPress={() => router.push('/profile')} />}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
        showsVerticalScrollIndicator={false}>
        <ScreenBody style={{ marginTop: -32 }}>
          {/* Banner IA */}
          <LinearGradient
            colors={['#FBF6E9', '#F8F1DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiBanner}>
            <View style={styles.aiBannerIcon}>
              <Ionicons name="sparkles" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBannerTitle}>
                {recommended.length} matches recomendados para você
              </Text>
              <Text style={styles.aiBannerDesc}>
                Cruzamos o perfil da sua operação com os {exhibitors.length} expositores para priorizar reuniões úteis.
              </Text>
            </View>
          </LinearGradient>

          {/* Aviso para completar o perfil */}
          {!usable && (
            <Pressable style={styles.completeCta} onPress={() => router.push('/profile')}>
              <Ionicons name="person-add-outline" size={16} color={Light.gold} />
              <Text style={styles.completeText}>
                Complete seu perfil para matches mais precisos
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Light.textMuted} />
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
              <ActivityIndicator size="large" color={Light.gold} />
              <Text style={styles.loadingText}>A Inteligência Artificial está analisando os estandes...</Text>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color={Light.textMuted} />
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
        </ScreenBody>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },

  aiBanner: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
  },
  aiBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Light.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: { color: Light.goldTextStrong, fontSize: 14.5, fontWeight: '700' },
  aiBannerDesc: { color: Light.goldText, fontSize: 12, marginTop: 2, lineHeight: 17 },

  completeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Light.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  completeText: { color: Light.goldTextStrong, fontSize: 13, flex: 1 },

  segment: {
    flexDirection: 'row',
    backgroundColor: Light.surfaceAlt,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Light.border,
    padding: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: Radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: Light.surface },
  segmentText: { color: Light.textMuted, fontSize: 13.5, fontWeight: '600' },
  segmentTextActive: { color: Light.navyDeep },

  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  emptyText: { color: Light.textMuted, fontSize: 13.5, textAlign: 'center', paddingHorizontal: Spacing.four },

  cardHighlight: { borderColor: Light.goldLight },
  topPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Light.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: 8,
  },
  topPickText: { color: '#fff', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  logo: { width: 64, height: 48 },
  cardInfo: { flex: 1, gap: 2 },
  companyName: { color: Light.textNavy, fontSize: 15.5, fontWeight: '700' },
  companyIndustry: { color: Light.textMuted, fontSize: 12.5 },

  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Light.surfaceAlt,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Light.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    marginTop: 10,
  },
  reasonText: { color: Light.navy, fontSize: 12.5, flex: 1, lineHeight: 17 },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: {
    backgroundColor: Light.surfaceAlt,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Light.border,
  },
  tagText: { color: Light.textNavy, fontSize: 11, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: 12 },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Light.gold,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Light.surfaceAlt,
    borderWidth: 1,
    borderColor: Light.border,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  btnSecondaryText: { color: Light.navy, fontSize: 14, fontWeight: '800' },
  btnGhost: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Light.surfaceAlt,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Light.border,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.three,
  },
  loadingText: {
    color: Light.textMuted,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
