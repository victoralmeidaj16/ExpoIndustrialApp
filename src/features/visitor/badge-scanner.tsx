import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Light, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/use-auth';
import { addSavedLead } from './leads';
import { resolveVisitorQrCode, type ResolvedVisitorQr } from './visitor-ticket-qr';

type Props = {
  exhibitor: { id: string; company: string; stand?: string; ownerUid?: string };
  onClose: () => void;
};

/** Mount only while open: closing or resolving a QR releases the camera. */
export function BadgeScanner({ exhibitor, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ResolvedVisitorQr | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const mounted = useRef(true);
  const saving = useRef(false);
  const authorized = Boolean(user && exhibitor.ownerUid === user.uid);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function scan({ data }: { data: string }) {
    if (locked.current || !authorized) return;
    locked.current = true;
    setBusy(true);
    try {
      const visitor = await resolveVisitorQrCode(data);
      if (!mounted.current) return;
      if (visitor) setResult(visitor);
      else setError('Crachá não encontrado. Confira se é deste evento. Ingressos Sympla precisam estar sincronizados pelo organizador.');
    } catch {
      if (mounted.current) setError('Não foi possível consultar o visitante. Verifique sua conexão e tente novamente.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function save() {
    if (!result || saving.current || saved || !authorized) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      await addSavedLead({
        name: result.profile.name,
        role: result.profile.role || '',
        company: result.profile.company || '',
        email: result.profile.email || '',
        phone: result.profile.phone || '',
        exhibitorId: exhibitor.id,
        exhibitorName: exhibitor.company,
        stand: exhibitor.stand || '',
        source: `Estande: ${exhibitor.company}`,
      });
      if (mounted.current) setSaved(true);
    } catch {
      if (mounted.current) setError('Não foi possível salvar o contato. Verifique sua conexão e tente novamente.');
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function reset() {
    locked.current = false;
    setResult(null);
    setSaved(false);
    setError('');
  }

  const cameraVisible = authorized && permission?.granted && !result && !busy && !error;
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.three }]}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text style={styles.title}>Leitor de crachá</Text>
            <Text style={styles.muted}>{exhibitor.company}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Fechar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {!authorized ? <Text style={styles.error}>Entre com o acesso do expositor para ler crachás.</Text> : (
            <>
              {!permission ? <ActivityIndicator color={Light.gold} /> : !permission.granted ? (
                <View style={styles.card}>
                  <Text style={styles.title}>Permita o acesso à câmera</Text>
                  <Text style={styles.muted}>A câmera é usada para ler o QR Code do crachá ou ingresso Sympla.</Text>
                  <Pressable accessibilityRole="button" style={styles.button} onPress={async () => {
                    try {
                      if (!permission.canAskAgain && Platform.OS !== 'web') await Linking.openSettings();
                      else await requestPermission();
                    } catch { setError('Não foi possível abrir a câmera. Confira as permissões do dispositivo.'); }
                  }}>
                    <Text style={styles.buttonText}>{permission.canAskAgain ? 'Permitir câmera' : 'Configurar permissão'}</Text>
                  </Pressable>
                  {!permission.canAskAgain && Platform.OS === 'web' ? <Text style={styles.muted}>Libere a câmera nas configurações deste site no navegador e recarregue a página.</Text> : null}
                </View>
              ) : null}
              {cameraVisible ? (
                <>
                  <Text style={styles.muted}>Aponte para o QR Code do crachá ou do ingresso Sympla.</Text>
                  <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scan} onMountError={() => setError('A câmera não abriu. Confira as permissões e se ela está em uso por outro aplicativo.')} />
                </>
              ) : null}
              {busy ? <View style={styles.card}><ActivityIndicator color={Light.gold} /><Text style={styles.muted}>{result ? 'Salvando contato…' : 'Consultando visitante…'}</Text></View> : null}
              {result ? (
                <View style={styles.card}>
                  <Text style={styles.muted}>{result.source === 'sympla-ticket' ? 'Ingresso Sympla' : result.source === 'legacy-badge' ? 'Crachá impresso' : 'Crachá do aplicativo'}</Text>
                  <Text style={styles.title}>{result.profile.name || result.profile.email || 'Visitante sem cadastro'}</Text>
                  {!result.profile.name.trim() ? <Text style={styles.muted}>Cadastro incompleto: confirme nome e empresa com o visitante antes de salvar.</Text> : null}
                  {[
                    ['Empresa', result.profile.company], ['Cargo', result.profile.role],
                    ['E-mail', result.profile.email], ['Telefone / WhatsApp', result.profile.phone],
                    ['Área de atuação', result.profile.area], ['Interesses', result.profile.interests?.join(', ')],
                    ['Busca', result.profile.lookingFor],
                  ].map(([label, value]) => <View key={label}><Text style={styles.label}>{label}</Text><Text selectable style={styles.value}>{value || 'Não informado'}</Text></View>)}
                  {saved ? <Text accessibilityLiveRegion="polite" style={styles.value}>Contato salvo! Disponível na lista de leads do expositor.</Text> : (
                    <Pressable accessibilityRole="button" style={styles.button} disabled={busy} onPress={save}>
                      <Text style={styles.buttonText}>Salvar contato</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              {(result || error) && !busy ? <Pressable accessibilityRole="button" style={styles.button} onPress={reset}><Text style={styles.buttonText}>{result ? 'Ler próximo crachá' : 'Tentar novamente'}</Text></Pressable> : null}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Light.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four },
  heading: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.four },
  title: { fontSize: 22, fontWeight: '700', color: Light.text },
  muted: { fontSize: 14, lineHeight: 21, color: '#526174' },
  card: { backgroundColor: Light.surface, borderRadius: Radius.md, padding: Spacing.four, gap: Spacing.three },
  camera: { height: 340, width: '100%', borderRadius: Radius.md, overflow: 'hidden' },
  button: { backgroundColor: Light.gold, padding: Spacing.three, borderRadius: Radius.md, alignItems: 'center', minHeight: 44 },
  buttonText: { color: Light.navy, fontWeight: '700', fontSize: 14 },
  label: { fontSize: 12, color: '#526174' },
  value: { fontSize: 16, color: Light.text },
  error: { color: '#b42318', fontSize: 14, lineHeight: 21 },
});
