/**
 * Push notifications (Expo Notifications).
 *
 * Fluxo: quando há um usuário logado, o app pede permissão, obtém o Expo push
 * token do device e o grava em `visitors/{uid}.pushTokens` (array — um usuário
 * pode ter vários aparelhos). O organizador, no painel match-web, lê esses
 * tokens (é admin em `visitors`) e dispara mensagens/alertas para os leads via
 * Expo Push API. Ver `docs/push-envio.md` para o lado do envio.
 *
 * Sem device físico (emulador/web) ou sem projectId EAS o registro é ignorado
 * silenciosamente — nunca deve quebrar o app.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { VISITORS_COLLECTION } from '@/features/visitor/visitor-profile';

const ANDROID_CHANNEL_ID = 'default';

/**
 * Como as notificações aparecem com o app em primeiro plano. Definido uma vez
 * no carregamento do módulo (import em `_layout`). Usa a API nova do SDK 56
 * (`shouldShowBanner`/`shouldShowList`) no lugar do `shouldShowAlert` obsoleto.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** projectId EAS — obrigatório para o Expo push token. Ausente sem `eas init`. */
function getProjectId(): string | undefined {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId
  );
}

/**
 * Pede permissão, garante o canal Android e retorna o Expo push token deste
 * device — ou `null` se não for possível (emulador, permissão negada, sem
 * projectId). Nunca lança.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Avisos do evento',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#E5B94E',
    });
  }

  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }
  if (!granted) return null;

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[push] Sem projectId EAS — rode `eas init` para habilitar o push em builds.');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err) {
    console.warn('[push] Falha ao obter o Expo push token:', err);
    return null;
  }
}

/**
 * Guarda o token no doc do visitante logado (dedup via `arrayUnion`), para o
 * organizador poder segmentar os envios. Best-effort.
 */
export async function savePushToken(token: string): Promise<void> {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) return;
  const uid = auth.currentUser.uid;
  await setDoc(
    doc(db, VISITORS_COLLECTION, uid),
    {
      ownerUid: uid,
      pushTokens: arrayUnion(token),
      pushPlatform: Platform.OS,
      pushTokenUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
