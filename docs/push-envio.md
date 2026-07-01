# Push / alertas — lado do envio (match-web)

O app (ExpoIndustrialApp) já registra cada device e grava o Expo push token em
`visitors/{uid}.pushTokens` (array). Falta o **painel do organizador (match-web)**
compor a mensagem e disparar via **Expo Push API**.

## 1. Ler os tokens dos leads

O match-web já é admin em `visitors` (regras do Firestore). Para segmentar:

```ts
// coletar todos os tokens (ou filtre por leadSource, sector, objetivos, etc.)
const snap = await getDocs(collection(db, 'visitors'));
const tokens = snap.docs
  .flatMap((d) => (d.data().pushTokens as string[] | undefined) ?? [])
  .filter((t) => t.startsWith('ExponentPushToken'));
```

## 2. Enviar (lotes de até 100)

⚠️ **Não** chame a Expo Push API direto do browser em produção — CORS + você
exporia a lógica. Coloque isto numa **Firebase Cloud Function** (ou rota de API
do Next no match-web, server-side):

```ts
// chunk de 100 e POST para a Expo Push API
async function sendPush(tokens: string[], title: string, body: string, data = {}) {
  for (let i = 0; i < tokens.length; i += 100) {
    const messages = tokens.slice(i, i + 100).map((to) => ({
      to, title, body, data, sound: 'default', channelId: 'default',
    }));
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  }
}
```

## 3. Tratar recibos (limpeza de tokens)

A resposta traz `tickets`; tokens com erro `DeviceNotRegistered` devem ser
removidos do `visitors/{uid}.pushTokens` (via `arrayRemove`) para não acumular
lixo. Ver https://docs.expo.dev/push-notifications/sending-notifications/.

## Pré-requisito no app (uma vez)

O token só é emitido em **builds com projectId EAS**. Rode na raiz do app:

```bash
eas init          # cria o projectId e grava em app.json → extra.eas.projectId
```

Sem isso, `registerForPushNotificationsAsync()` retorna `null` (com aviso no log)
e nenhum token é gravado. Push **não** funciona no Expo Go do SDK 53+ nem em
emulador — precisa de device físico + build de desenvolvimento/produção.
