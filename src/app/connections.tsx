import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { ScoreRing } from '@/components/score-ring';
import { HeaderIconButton, ScreenHeader, TAB_BAR_CLEARANCE } from '@/components/ui-kit';
import { Light, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/use-auth';
import {
  useConnections,
  useDiscoverableVisitors,
} from '@/features/connections/use-connections';
import { rankPeople } from '@/features/matchmaking/people-score';
import { exportLeadVCard, leadMessageUrl } from '@/features/visitor/leads';
import { useVisitorProfile, type VisitorProfile, getVisitorProfileByUid } from '@/features/visitor/visitor-profile';

type TabType = 'suggestions' | 'requests' | 'connected';

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const { profile } = useVisitorProfile();
  const { visitors, loading: loadingVisitors } = useDiscoverableVisitors();
  const {
    connections,
    pendingReceived,
    pendingSent,
    accepted,
    loading: loadingConnections,
    requestConnection,
    acceptConnection,
    declineConnection,
  } = useConnections();

  const [activeTab, setActiveTab] = useState<TabType>('suggestions');

  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  const startScanning = async () => {
    if (!hasPermission || !hasPermission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Câmera necessária', 'Permissão para usar a câmera é necessária para escanear.');
        return;
      }
    }
    setScanned(false);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setScannerVisible(false);
    try {
      let visitorUid = '';
      let isDeepLink = false;

      // Suporta esquemas expoindustrialsul://, expoindustrial://, ou URLs web
      if (data.startsWith('expoindustrialsul://visitor/') || data.startsWith('expoindustrial://visitor/')) {
        visitorUid = data.split('/').pop() || '';
        isDeepLink = true;
      } else if (data.includes('/visitor/')) {
        visitorUid = data.split('/visitor/')[1]?.split('?')[0] || '';
        isDeepLink = true;
      }

      if (isDeepLink && visitorUid) {
        if (visitorUid === user?.uid) {
          Alert.alert('Atenção', 'Você escaneou o seu próprio QR Code.');
          return;
        }

        const visitorInfo = await getVisitorProfileByUid(visitorUid);

        if (visitorInfo) {
          // Verifica se há alguma solicitação pendente recebida deste usuário
          const pendingReq = pendingReceived.find((r) => r.fromUid === visitorUid);
          if (pendingReq) {
            await acceptConnection(pendingReq.id);
            Alert.alert('Conectados! 🤝', `${visitorInfo.name} já tinha enviado um pedido. Agora vocês estão conectados e compartilham contatos!`);
          } else {
            const myName = profile?.name || user?.email || 'Visitante';
            await requestConnection(visitorUid, visitorInfo.name, myName);
            Alert.alert('Solicitação Enviada! ✉️', `Você solicitou conexão com ${visitorInfo.name}.`);
          }
        } else {
          Alert.alert('Erro', 'Perfil do visitante não encontrado.');
        }
      } else {
        Alert.alert('QR Code Inválido', 'Os dados do QR Code não estão no formato esperado.');
      }
    } catch (err) {
      Alert.alert('Erro ao escanear', 'Não foi possível ler os dados do QR Code.');
    }
  };

  const loading = loadingVisitors || loadingConnections;

  // Mapear visitantes para acesso rápido
  const visitorsMap = React.useMemo(() => {
    const map = new Map<string, any>();
    visitors.forEach((v) => map.set(v.uid, v.profile));
    return map;
  }, [visitors]);

  // Filtrar e ranquear sugestões
  const suggestions = React.useMemo(() => {
    if (!profile) return [];

    // Filtra pessoas que já têm conexão (pendente, aceita ou recusada)
    const activeConnectionUids = new Set<string>();
    connections.forEach((c) => {
      activeConnectionUids.add(c.fromUid);
      activeConnectionUids.add(c.toUid);
    });

    const filtered = visitors.filter((v) => !activeConnectionUids.has(v.uid));
    return rankPeople(profile, filtered);
  }, [profile, visitors, connections]);

  const handleRequestConnection = async (toUid: string, toName: string) => {
    try {
      const myName = profile?.name || user?.email || 'Visitante';
      await requestConnection(toUid, toName, myName);
      Alert.alert('Sucesso', `Solicitação de conexão enviada para ${toName}.`);
    } catch (err) {
      Alert.alert('Erro', (err as Error).message);
    }
  };

  const handleAccept = async (id: string, name: string) => {
    try {
      await acceptConnection(id);
      Alert.alert('Conectados!', `Agora você e ${name} estão conectados e compartilham contatos.`);
    } catch (err) {
      Alert.alert('Erro', (err as Error).message);
    }
  };

  const handleDecline = async (id: string, name: string) => {
    Alert.alert('Recusar solicitação', `Recusar conexão com ${name}?`, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Recusar',
        style: 'destructive',
        onPress: async () => {
          try {
            await declineConnection(id);
          } catch (err) {
            Alert.alert('Erro', (err as Error).message);
          }
        },
      },
    ]);
  };

  const handleContactMessage = (name: string, email: string, phone?: string) => {
    const url = leadMessageUrl({
      id: 'conn',
      name,
      email,
      phone,
      company: '',
      role: '',
      source: '',
    });
    Linking.openURL(url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o canal de mensagens.')
    );
  };

  const handleExportVCard = async (name: string, company: string, role: string, email: string, phone?: string) => {
    try {
      await exportLeadVCard({
        id: 'conn',
        name,
        company,
        role,
        email,
        phone,
        source: 'Conexões do Evento',
      });
    } catch (err) {
      Alert.alert('Exportar contato', (err as Error).message);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Networking"
        subtitle="Conecte-se com quem faz sentido para você"
        onBack={() => router.back()}
        right={<HeaderIconButton icon="qr-code-outline" onPress={startScanning} />}
      />

      {/* Modal do Scanner (câmera — fundo escuro por design) */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerInstruction}>Aponte a câmera para o QR Code de outro usuário</Text>
            <View style={styles.scannerTarget} />
            <Pressable style={styles.closeScannerBtn} onPress={() => setScannerVisible(false)}>
              <Text style={styles.closeScannerText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Tabs em card claro sobreposto */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'suggestions' && styles.tabBtnActive]}
          onPress={() => setActiveTab('suggestions')}>
          <Text style={[styles.tabBtnText, activeTab === 'suggestions' && styles.tabBtnTextActive]}>
            Sugestões ({suggestions.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
          onPress={() => setActiveTab('requests')}>
          <Text style={[styles.tabBtnText, activeTab === 'requests' && styles.tabBtnTextActive]}>
            Pedidos ({pendingReceived.length + pendingSent.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'connected' && styles.tabBtnActive]}
          onPress={() => setActiveTab('connected')}>
          <Text style={[styles.tabBtnText, activeTab === 'connected' && styles.tabBtnTextActive]}>
            Conectados ({accepted.length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerScreen}>
          <ActivityIndicator color={Light.gold} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: TAB_BAR_CLEARANCE }]}
          showsVerticalScrollIndicator={false}>

          {/* TAB 1: Sugestões */}
          {activeTab === 'suggestions' && (
            <View style={styles.tabContent}>
              {suggestions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={Light.textFaint} />
                  <Text style={styles.emptyText}>
                    Nenhuma sugestão de perfil com fit comercial disponível no momento.
                  </Text>
                </View>
              ) : (
                suggestions.map((item) => (
                  <View key={item.uid} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{item.profile.name}</Text>
                        <Text style={styles.cardSub}>
                          {item.profile.role} · <Text style={styles.companyText}>{item.profile.company}</Text>
                        </Text>
                      </View>
                      <ScoreRing score={item.fit.score} size={50} stroke={4} trackColor={Light.border} />
                    </View>

                    {item.fit.reasons.length > 0 && (
                      <View style={styles.reasonsContainer}>
                        {item.fit.reasons.map((r, i) => (
                          <View key={i} style={styles.reasonRow}>
                            <Ionicons name="sparkles" size={11} color={Light.gold} />
                            <Text style={styles.reasonText}>{r}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {item.profile.lookingFor ? (
                      <Text style={styles.infoText} numberOfLines={2}>
                        <Text style={styles.infoLabel}>Busca: </Text>
                        {item.profile.lookingFor}
                      </Text>
                    ) : null}

                    {item.profile.offering ? (
                      <Text style={styles.infoText} numberOfLines={2}>
                        <Text style={styles.infoLabel}>Oferece: </Text>
                        {item.profile.offering}
                      </Text>
                    ) : null}

                    <View style={styles.tagsContainer}>
                      {item.fit.tags.map((tag) => (
                        <View key={tag} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => handleRequestConnection(item.uid, item.profile.name)}>
                      <Ionicons name="person-add-outline" size={14} color="#fff" />
                      <Text style={styles.actionBtnText}>Solicitar Conexão</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 2: Pedidos (Recebidos e Enviados) */}
          {activeTab === 'requests' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Solicitações Recebidas ({pendingReceived.length})</Text>
              {pendingReceived.length === 0 ? (
                <Text style={styles.noDataText}>Nenhuma solicitação pendente.</Text>
              ) : (
                pendingReceived.map((c) => {
                  const otherProfile = visitorsMap.get(c.fromUid);
                  return (
                    <View key={c.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardName}>{c.fromName || otherProfile?.name || 'Participante'}</Text>
                          {otherProfile && (
                            <Text style={styles.cardSub}>
                              {otherProfile.role} · <Text style={styles.companyText}>{otherProfile.company}</Text>
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.rowActions}>
                        <Pressable
                          style={[styles.smallBtn, { backgroundColor: Light.success }]}
                          onPress={() => handleAccept(c.id, c.fromName || 'Participante')}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                          <Text style={styles.smallBtnText}>Aceitar</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.smallBtn, { backgroundColor: Light.danger }]}
                          onPress={() => handleDecline(c.id, c.fromName || 'Participante')}>
                          <Ionicons name="close" size={14} color="#FFFFFF" />
                          <Text style={styles.smallBtnText}>Recusar</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}

              <Text style={[styles.sectionTitle, { marginTop: Spacing.four }]}>
                Solicitações Enviadas ({pendingSent.length})
              </Text>
              {pendingSent.length === 0 ? (
                <Text style={styles.noDataText}>Nenhuma solicitação enviada pendente.</Text>
              ) : (
                pendingSent.map((c) => (
                  <View key={c.id} style={[styles.card, { opacity: 0.85 }]}>
                    <Text style={styles.cardName}>{c.toName || 'Participante'}</Text>
                    <View style={styles.waitingBadge}>
                      <Ionicons name="time-outline" size={12} color={Light.gold} />
                      <Text style={styles.waitingBadgeText}>Aguardando resposta</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: Conectados */}
          {activeTab === 'connected' && (
            <View style={styles.tabContent}>
              {accepted.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people" size={48} color={Light.textFaint} />
                  <Text style={styles.emptyText}>
                    Nenhuma conexão estabelecida ainda. Envie ou aceite pedidos para revelar contatos.
                  </Text>
                </View>
              ) : (
                accepted.map((c) => {
                  const isIncoming = c.toUid === user?.uid;
                  const otherUid = isIncoming ? c.fromUid : c.toUid;
                  const otherProfile = visitorsMap.get(otherUid) as VisitorProfile | undefined;
                  const displayName = isIncoming ? c.fromName : c.toName;

                  return (
                    <View key={c.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardName}>{displayName || otherProfile?.name || 'Profissional'}</Text>
                          {otherProfile && (
                            <Text style={styles.cardSub}>
                              {otherProfile.role} · <Text style={styles.companyText}>{otherProfile.company}</Text>
                            </Text>
                          )}
                        </View>
                      </View>

                      {otherProfile ? (
                        <View style={styles.contactDetails}>
                          {otherProfile.shareContact ? (
                            <>
                              <View style={styles.contactRow}>
                                <Ionicons name="mail-outline" size={13} color={Light.textMuted} />
                                <Text style={styles.contactText}>{otherProfile.email || 'Não informado'}</Text>
                              </View>
                              {otherProfile.phone ? (
                                <View style={styles.contactRow}>
                                  <Ionicons name="call-outline" size={13} color={Light.textMuted} />
                                  <Text style={styles.contactText}>{otherProfile.phone}</Text>
                                </View>
                              ) : null}
                            </>
                          ) : (
                            <Text style={styles.lockText}>
                              Compartilhamento de contatos desativado por esta pessoa.
                            </Text>
                          )}
                          {otherProfile.linkedin ? (
                            <Pressable
                              style={styles.linkedinLink}
                              onPress={() => Linking.openURL(otherProfile.linkedin!)}>
                              <Ionicons name="logo-linkedin" size={13} color="#2F6BFF" />
                              <Text style={styles.linkedinText}>Ver LinkedIn</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      ) : null}

                      {otherProfile && otherProfile.shareContact && (
                        <View style={styles.rowActions}>
                          <Pressable
                            style={styles.actionBtnOutline}
                            onPress={() =>
                              handleContactMessage(
                                displayName || otherProfile.name,
                                otherProfile.email || '',
                                otherProfile.phone
                              )
                            }>
                            <Ionicons name="chatbubble-ellipses-outline" size={13} color={Light.gold} />
                            <Text style={styles.actionBtnOutlineText}>Mensagem</Text>
                          </Pressable>
                          <Pressable
                            style={styles.actionBtnOutline}
                            onPress={() =>
                              handleExportVCard(
                                displayName || otherProfile.name,
                                otherProfile.company,
                                otherProfile.role,
                                otherProfile.email || '',
                                otherProfile.phone
                              )
                            }>
                            <Ionicons name="download-outline" size={13} color={Light.gold} />
                            <Text style={styles.actionBtnOutlineText}>Exportar .vcf</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },
  centerScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  tabsContainer: {
    flexDirection: 'row',
    marginTop: -30,
    marginHorizontal: 16,
    backgroundColor: Light.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Light.border,
    padding: 6,
    gap: 6,
    shadowColor: Light.navyDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Light.surfaceAlt,
  },
  tabBtnActive: { backgroundColor: Light.navy },
  tabBtnText: { color: Light.textMuted, fontSize: 12, fontWeight: '700' },
  tabBtnTextActive: { color: '#fff' },

  scrollContent: { padding: 16, gap: 12 },
  tabContent: { gap: 12 },
  sectionTitle: {
    color: Light.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  noDataText: { color: Light.textMuted, fontSize: 13, marginVertical: 4 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { color: Light.textMuted, fontSize: 13.5, textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: Light.surface,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { color: Light.navyDeep, fontSize: 16, fontWeight: '700' },
  cardSub: { color: Light.textMuted, fontSize: 13, marginTop: 2 },
  companyText: { color: Light.gold, fontWeight: '700' },

  reasonsContainer: {
    backgroundColor: Light.surfaceAlt,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Light.border,
    gap: 6,
  },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reasonText: { color: Light.text, fontSize: 12.5 },

  infoText: { color: Light.textMuted, fontSize: 12.5, lineHeight: 18 },
  infoLabel: { color: Light.gold, fontWeight: '700' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Light.surfaceAlt,
    borderWidth: 1,
    borderColor: Light.border,
  },
  tagChipText: { color: Light.textMuted, fontSize: 11, fontWeight: '600' },

  actionBtn: {
    backgroundColor: Light.navy,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '800' },

  rowActions: { flexDirection: 'row', gap: Spacing.two },
  smallBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  smallBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FBF6E9',
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  waitingBadgeText: { color: Light.goldTextStrong, fontSize: 11, fontWeight: '700' },

  contactDetails: {
    backgroundColor: Light.surfaceAlt,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Light.border,
    gap: 8,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactText: { color: Light.navyDeep, fontSize: 13 },
  lockText: { color: Light.textMuted, fontSize: 12, fontStyle: 'italic' },
  linkedinLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  linkedinText: { color: '#2F6BFF', fontSize: 12, fontWeight: '700' },

  actionBtnOutline: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: Light.goldPillBorder,
    backgroundColor: '#FBF6E9',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnOutlineText: { color: Light.goldTextStrong, fontSize: 13, fontWeight: '800' },

  // Scanner (fundo escuro por design — é a câmera)
  scannerContainer: { flex: 1, backgroundColor: '#000000' },
  scannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  scannerInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.six,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  scannerTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Light.gold,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
    marginBottom: 40,
  },
  closeScannerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeScannerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
