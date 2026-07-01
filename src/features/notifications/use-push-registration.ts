/**
 * Registra o device para push assim que há um usuário logado e mantém um
 * listener para notificações recebidas com o app aberto. Montado uma vez, no
 * layout raiz. Sem login, não faz nada (o token é atrelado ao `uid`).
 */
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/use-auth';
import { registerForPushNotificationsAsync, savePushToken } from '@/features/notifications/push';

export function usePushRegistration(): void {
  const { user } = useAuth();
  const uid = user?.uid;

  // Registra e persiste o token quando alguém loga.
  useEffect(() => {
    if (!uid) return;
    let active = true;
    registerForPushNotificationsAsync().then((token) => {
      if (active && token) savePushToken(token).catch(() => {});
    });
    return () => {
      active = false;
    };
  }, [uid]);

  // Mantém o listener de notificações recebidas em primeiro plano (o handler
  // global já decide exibir o banner; aqui é o ponto de extensão para reagir).
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {});
    return () => sub.remove();
  }, []);
}
