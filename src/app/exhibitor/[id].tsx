import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { ExhibitorLogo } from '@/components/exhibitor-logo';
import { ScoreRing } from '@/components/score-ring';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExhibitor } from '@/features/exhibitors/use-exhibitors';
import { CATEGORY_COLOR } from '@/features/venue/venue';
import { addSavedLead } from '@/features/visitor/leads';
import { useSavedExhibitors } from '@/features/visitor/saved-exhibitors';
import { getVisitorProfileByUid, DEMO_VISITOR_PROFILE } from '@/features/visitor/visitor-profile';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS = ['Produtos', 'Soluções', 'Vídeos', 'Downloads'] as const;

export default function ExhibitorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exhibitor: booth, loading } = useExhibitor(id);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Produtos');
  const { isSaved, toggle } = useSavedExhibitors();
  const saved = booth ? isSaved(booth.id) : false;
  const toggleSaved = () => booth && toggle(booth.id);

  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  const startScanning = async () => {
    if (!hasPermission || !hasPermission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Câmera necessária', 'Permissão para usar a câmera é necessária para escanear contatos.');
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
        let visitorInfo;
        if (visitorUid === 'demo-user') {
          visitorInfo = DEMO_VISITOR_PROFILE;
        } else {
          visitorInfo = await getVisitorProfileByUid(visitorUid);
        }

        if (visitorInfo) {
          await addSavedLead({
            name: visitorInfo.name,
            role: visitorInfo.role || 'Visitante',
            company: visitorInfo.company || 'Empresa',
            email: visitorInfo.email || '',
            phone: visitorInfo.phone || '',
            source: `Estande: ${booth?.company ?? 'não identificado'}`,
          });
          Alert.alert('Sucesso!', `Contato de ${visitorInfo.name} salvo com sucesso!`);
        } else {
          Alert.alert('Erro', 'Perfil do visitante não encontrado.');
        }
      } else {
        // Fallback para o formato JSON legado
        const visitorInfo = JSON.parse(data);
        if (visitorInfo.name && visitorInfo.email) {
          await addSavedLead({
            name: visitorInfo.name,
            role: visitorInfo.role || 'Visitante',
            company: visitorInfo.company || 'Empresa',
            email: visitorInfo.email,
            phone: visitorInfo.phone || '',
            source: `Estande: ${booth?.company ?? 'não identificado'}`,
          });
          Alert.alert('Sucesso!', `Contato de ${visitorInfo.name} salvo com sucesso!`);
        } else {
          Alert.alert('QR Code Inválido', 'Os dados do QR Code não estão no formato esperado.');
        }
      }
    } catch {
      Alert.alert('Erro ao escanear', 'Não foi possível ler os dados do QR Code.');
    }
  };


  if (!booth) {
    if (loading) {
      return <View style={[styles.screen, { paddingTop: insets.top + 40 }]} />;
    }
    return (
      <View style={[styles.screen, styles.empty, { paddingTop: insets.top + 40 }]}>
        <Ionicons name="alert-circle-outline" size={40} color={Brand.textMuted} />
        <Text style={styles.emptyText}>Estande não encontrado.</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.two, paddingBottom: 140 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Brand.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Perfil do Expositor</Text>
          <Pressable style={styles.iconBtn} onPress={toggleSaved}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? Brand.gold : Brand.textPrimary}
            />
          </Pressable>
        </View>

        {/* Capa + identidade */}
        <View style={styles.cover}>
          <ExhibitorLogo logoUrl={booth.logoUrl} logo={booth.logo} style={styles.logo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.company}>{booth.company}</Text>
            <Text style={styles.industry}>{booth.industry}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.catBadge, { borderColor: CATEGORY_COLOR[booth.category] }]}>
                <View
                  style={[styles.catDot, { backgroundColor: CATEGORY_COLOR[booth.category] }]}
                />
                <Text style={styles.catText}>{booth.category}</Text>
              </View>
            </View>
          </View>
          <ScoreRing score={booth.fit} />
        </View>

        {/* Localização do estande */}
        <View style={styles.locRow}>
          <Ionicons name="location" size={16} color={Brand.gold} />
          <Text style={styles.locText}>
            {booth.stand} · {booth.area}
          </Text>
          <Pressable style={styles.locBtn} onPress={() => router.push('/map')}>
            <Ionicons name="navigate" size={14} color={Brand.bgPrimary} />
            <Text style={styles.locBtnText}>Como chegar</Text>
          </Pressable>
        </View>

        {/* Sobre */}
        <Text style={styles.sectionTitle}>Apresentação</Text>
        <Text style={styles.about}>{booth.about}</Text>

        {Boolean(
          booth.segments?.length ||
            booth.targetAudience?.length ||
            booth.lookingFor?.length ||
            booth.keywords?.length,
        ) && (
          <>
            <Text style={styles.sectionTitle}>Afinidade</Text>
            <TagGroup title="Segmentos" items={booth.segments ?? []} />
            <TagGroup title="Público-alvo" items={booth.targetAudience ?? []} />
            <TagGroup title="Busca na feira" items={booth.lookingFor ?? []} />
            <TagGroup title="Palavras-chave" items={booth.keywords ?? []} />
          </>
        )}

        {/* Abas */}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable key={t} style={styles.tabItem} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              {tab === t && <View style={styles.tabUnderline} />}
            </Pressable>
          ))}
        </View>

        {/* Conteúdo da aba */}
        {tab === 'Produtos' ? (
          <View style={styles.productGrid}>
            {booth.products.map((p) => (
              <View key={p} style={styles.productCard}>
                <View style={styles.productIcon}>
                  <Ionicons name="cube-outline" size={20} color={Brand.cyan} />
                </View>
                <Text style={styles.productName}>{p}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.placeholderBox}>
            <Ionicons name="folder-open-outline" size={22} color={Brand.textMuted} />
            <Text style={styles.placeholderText}>
              {tab} disponíveis no estande durante o evento.
            </Text>
          </View>
        )}

        {/* Contatos de negócio */}
        {Boolean(
          booth.contactName ||
            booth.contactEmail ||
            booth.contactPhone ||
            booth.website ||
            booth.instagram ||
            booth.linkedin,
        ) && (
          <>
            <Text style={styles.sectionTitle}>Contatos de negócio</Text>
            <View style={styles.contactCard}>
              {booth.contactName ? (
                <Text style={styles.contactName}>
                  {booth.contactName}
                  {booth.contactRole ? ` · ${booth.contactRole}` : ''}
                </Text>
              ) : null}
              {booth.contactEmail ? (
                <ContactLine
                  icon="mail-outline"
                  text={booth.contactEmail}
                  onPress={() => openLink(`mailto:${booth.contactEmail}`)}
                />
              ) : null}
              {booth.contactPhone ? (
                <ContactLine
                  icon="logo-whatsapp"
                  text={booth.contactPhone}
                  onPress={() => openLink(whatsappLink(booth.contactPhone!))}
                />
              ) : null}
              {booth.website ? (
                <ContactLine
                  icon="globe-outline"
                  text={booth.website}
                  onPress={() => openLink(withHttps(booth.website!))}
                />
              ) : null}
              {booth.instagram ? (
                <ContactLine
                  icon="logo-instagram"
                  text={booth.instagram}
                  onPress={() => openLink(instagramLink(booth.instagram!))}
                />
              ) : null}
              {booth.linkedin ? (
                <ContactLine
                  icon="logo-linkedin"
                  text={booth.linkedin}
                  onPress={() => openLink(withHttps(booth.linkedin!))}
                />
              ) : null}
            </View>
          </>
        )}
        <View style={styles.contactRow}>
          <ActionButton icon="qr-code-outline" label="Captar lead" primary onPress={startScanning} />
        </View>
        <Pressable style={styles.saveBtn} onPress={toggleSaved}>
          <Ionicons
            name={saved ? 'checkmark-circle' : 'bookmark-outline'}
            size={18}
            color={Brand.gold}
          />
          <Text style={styles.saveBtnText}>
            {saved ? 'Empresa salva' : 'Salvar empresa'}
          </Text>
        </Pressable>

        {/* Modal de Scanner */}
        <Modal
          visible={scannerVisible}
          animationType="slide"
          onRequestClose={() => setScannerVisible(false)}>
          <View style={styles.scannerContainer}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
            <View style={styles.scannerOverlay}>
              <Text style={styles.scannerInstruction}>Aponte a câmera para o QR Code do Crachá</Text>
              <View style={styles.scannerTarget} />
              <Pressable style={styles.cancelScannerBtn} onPress={() => setScannerVisible(false)}>
                <Text style={styles.cancelScannerText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
}

function TagGroup({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.tagGroup}>
      <Text style={styles.tagGroupTitle}>{title}</Text>
      <View style={styles.tagRow}>
        {items.map((item) => (
          <View key={item} style={styles.tagChip}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ContactLine({
  icon,
  text,
  onPress,
}: {
  icon: IconName;
  text: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.contactLine} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={15} color={Brand.gold} />
      <Text style={[styles.contactLineText, onPress && styles.contactLineLink]}>{text}</Text>
      {onPress ? <Ionicons name="open-outline" size={14} color={Brand.textMuted} /> : null}
    </Pressable>
  );
}

/** Abre um link externo, avisando se o dispositivo não conseguir tratá-lo. */
async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Não foi possível abrir', url);
  }
}

/** Garante o esquema https:// em URLs digitadas sem protocolo. */
function withHttps(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Monta o link do WhatsApp a partir de um telefone (só dígitos; assume BR). */
function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${intl}`;
}

/** Aceita "@usuario", "usuario" ou uma URL completa do Instagram. */
function instagramLink(handle: string): string {
  if (/^https?:\/\//i.test(handle)) return handle;
  return `https://instagram.com/${handle.replace(/^@/, '')}`;
}

function ActionButton({
  icon,
  label,
  primary,
  onPress,
}: {
  icon: IconName;
  label: string;
  primary?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, primary ? styles.actionPrimary : styles.actionGhost]}
      onPress={onPress}>
      <Ionicons name={icon} size={16} color={primary ? Brand.bgPrimary : Brand.gold} />
      <Text style={[styles.actionText, primary ? styles.actionTextPrimary : styles.actionTextGhost]}>
        {label}
      </Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgPrimary },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.three },

  empty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  emptyText: { color: Brand.textSecondary, fontSize: 15 },
  backLink: { paddingHorizontal: 20, paddingVertical: 10 },
  backLinkText: { color: Brand.gold, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: Brand.textPrimary, fontSize: 17, fontWeight: '800' },

  cover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  logo: { width: 72, height: 56 },
  company: { color: Brand.textPrimary, fontSize: 16, fontWeight: '800' },
  industry: { color: Brand.textSecondary, fontSize: 12.5, marginTop: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 8 },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catText: { color: Brand.textSecondary, fontSize: 11.5, fontWeight: '600' },

  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  locText: { color: Brand.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Brand.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  locBtnText: { color: Brand.bgPrimary, fontSize: 12.5, fontWeight: '800' },

  sectionTitle: { color: Brand.textPrimary, fontSize: 16, fontWeight: '700', marginTop: Spacing.one },
  about: { color: Brand.textSecondary, fontSize: 13.5, lineHeight: 20 },
  tagGroup: { gap: 7 },
  tagGroupTitle: { color: Brand.textMuted, fontSize: 12, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tagChip: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    backgroundColor: Brand.bgCard,
  },
  tagText: { color: Brand.textSecondary, fontSize: 12.5, fontWeight: '600' },

  tabs: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  tabItem: { paddingBottom: 10 },
  tabText: { color: Brand.textMuted, fontSize: 13.5, fontWeight: '600' },
  tabTextActive: { color: Brand.gold },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Brand.gold,
    borderRadius: 2,
  },

  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  productCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  productIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Brand.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { color: Brand.textPrimary, fontSize: 12.5, fontWeight: '600', flex: 1 },

  placeholderBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.five,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  placeholderText: { color: Brand.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 240 },

  contactRow: { flexDirection: 'row', gap: Spacing.two },
  contactCard: {
    gap: 8,
    backgroundColor: Brand.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  contactName: { color: Brand.textPrimary, fontSize: 14, fontWeight: '800' },
  contactLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactLineText: { color: Brand.textSecondary, fontSize: 13, flex: 1 },
  contactLineLink: { color: Brand.gold, textDecorationLine: 'underline' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: Radius.sm,
  },
  actionPrimary: { backgroundColor: Brand.gold },
  actionGhost: { backgroundColor: Brand.goldSoft, borderWidth: 1, borderColor: Brand.borderGold },
  actionText: { fontSize: 13.5, fontWeight: '800' },
  actionTextPrimary: { color: Brand.bgPrimary },
  actionTextGhost: { color: Brand.gold },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.bgCard,
  },
  saveBtnText: { color: Brand.gold, fontSize: 13.5, fontWeight: '700' },

  // Scanner Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scannerTarget: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: Brand.gold,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
  },
  cancelScannerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: Radius.pill,
  },
  cancelScannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
