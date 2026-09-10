# 📋 Plano de Melhorias e Correções — ExpoIndustrial Sul

> Auditoria técnica do ecossistema ExpoIndustrialApp / match-web em **09/09/2026** (segunda rodada),
> atualizada em **10/09/2026** após a homologação somente leitura da API Sympla.
> A rodada anterior (itens 1 a 9, todos concluídos) foi arquivada — o que sobrou dela em aberto
> está registrado na seção "Herdado da rodada anterior", no fim deste documento.
> Organizado por prioridade (P0 a P3) com diagnóstico, arquivos afetados, solução e critério de aceite.

## Estado das verificações automáticas

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` (app) | ✅ limpo |
| `npx tsc --noEmit` (match-web) | ✅ limpo |
| `npx eslint src/` | ✅ 0 erros (31 warnings — item 13) |
| `npx next build` (match-web) | ✅ 24 rotas |
| Testes (`tests/*.test.cjs`) | ✅ 43/43 |

**Nenhum dos problemas abaixo é detectável por linter ou compilador.** Todos foram encontrados
por leitura de código, inspeção do Firestore e medição do comportamento em produção.

---

## 🚨 P0 — Endpoints abertos em produção

### [x] 1. Webhook da Sympla aceita `POST` anônimo (falha aberta)
- **Problema:** a checagem do segredo é `if (secret) { … }`. Sem a env definida, **nada** é
  validado. `SYMPLA_WEBHOOK_SECRET` não está no `match-web/.env.local` (só no `.env.example`);
  se também não estiver na Vercel, qualquer pessoa com a URL faz `POST` e concede
  `status: 'paid'` no evento a um e-mail à escolha.
- **Arquivos afetados:**
  - [`match-web/src/app/api/webhooks/sympla/route.ts`](match-web/src/app/api/webhooks/sympla/route.ts#L20-L28)
- **Feito (código):**
  1. Sem `SYMPLA_WEBHOOK_SECRET`, o endpoint responde `503` antes de inicializar o Firebase.
  2. Segredo ausente/incorreto não processa o payload nem grava documentos.
  3. Status ausente ou desconhecido passou a `pending`; somente `A`, `approved` ou `paid` libera acesso.
  4. O payload completo, que contém dados pessoais, deixou de ser escrito no log.
  5. Tipos `any` do webhook foram removidos e payloads inesperados são normalizados com segurança.
- **Critério de aceite:**
  - `POST` sem o header `x-webhook-secret` correto devolve 401; sem a env configurada o endpoint
    não processa nada e devolve 503. ✅ coberto por testes.
- **Nota:** é a mesma classe de defeito do item 2 — os dois endpoints foram escritos com o padrão
  "se o segredo existir, valide", que é exatamente o inverso do seguro.
- **Pendente de operação:** configurar o mesmo segredo na Vercel e na ferramenta que entrega o
  webhook e homologar com payload fictício. Não usar participante real sem autorização.

---

### [x] 2. Cron de notificações autorizado por `User-Agent` falsificável
- **Problema:** sem `CRON_SECRET`, `isAuthorized()` caía em
  `request.headers.get('user-agent').includes('vercel-cron/1.0')` — um header que qualquer
  `curl -H` reproduz. Confirmado em produção: `gh secret list` está **vazio** e a requisição do
  workflow **passa**, o que prova que a Vercel também não tem o segredo. Ou seja, o endpoint que
  dispara push para toda a base estava aberto a qualquer um.
- **Arquivos afetados:**
  - [`match-web/src/app/api/cron/scheduled-notifications/route.ts`](match-web/src/app/api/cron/scheduled-notifications/route.ts#L24-L33)
  - [`.github/workflows/scheduled-notifications.yml`](.github/workflows/scheduled-notifications.yml)
- **Critério de aceite:**
  - `curl` sem header → 401; com Bearer errado → 401; com `User-Agent: vercel-cron/1.0` sozinho → 401.
- **Feito (código):**
  - `isAuthorized()` agora **falha fechada**: sem `CRON_SECRET` retorna `false` antes de qualquer
    outra checagem. O ramo do `User-Agent` foi eliminado.
  - O workflow parou de forjar `User-Agent: vercel-cron/1.0` (ele só existia para explorar esse
    fallback) e agora aborta com mensagem clara se o secret não estiver configurado.
- **⚠️ Pendente de operação — ORDEM OBRIGATÓRIA:** a rota **falha fechada**. Se este código subir
  antes do segredo existir na Vercel, todo disparo passa a devolver 401 e **nenhum aviso sai**.
  Ver o passo a passo no item 7.

---

### [x] 3. `vincular` publica o estande sem moderação do organizador
- **Problema:** qualquer usuário logado reivindica qualquer estande sem dono e o documento já
  entra como `status: 'published'` — aparece no app do evento sem revisão. A transação protege
  contra *roubo* de estande já vinculado, mas não contra o primeiro que chegar.
- **Arquivos afetados:**
  - [`match-web/src/app/api/portal/expositor/vincular/route.ts`](match-web/src/app/api/portal/expositor/vincular/route.ts#L53)
- **Solução técnica:**
  1. Gravar `status: 'pending'` (ou `draft`) em vez de `published`.
  2. Criar a ação de aprovar no painel do organizador, que promove para `published`.
  3. Alternativa mais barata para o evento: manter `published`, mas exigir que o e-mail do
     usuário bata com o `contactEmail` que o organizador cadastrou no estande.
- **Critério de aceite:**
  - Um expositor recém-cadastrado não consegue se publicar sozinho no app sem passar pelo
    organizador.
- **Feito (código):**
  - O organizador define um `claimEmail` por estande no painel do croqui.
  - O cadastro exige que esse mesmo e-mail esteja verificado no Firebase Auth.
  - A API devolve somente o estande autorizado para a conta, sem expor a lista completa.
  - A transação impede que uma conta assuma dois estandes e mantém repetição idempotente.
  - Todo vínculo novo grava `status: 'draft'`; somente um administrador pode publicar.
  - As Security Rules impedem o expositor de alterar `claimEmail`, `linkedEmail` e `linkedAt`.
  - Oito testes automatizados cobrem autorização, e-mail não verificado, conflito e rascunho.
- **Pendente de operação:** publicar o `match-web`, implantar `firestore.rules`, preencher o
  e-mail autorizado dos expositores e conferir o template/domínio de verificação do Firebase.

---

## ⚡ P1 — Falhas que aparecem no dia do evento

### [x] 4. Crachá de quem comprou e não abriu o app não escaneia
- **Problema:** o webhook gravava em `ticketQrLookups` apenas
  `{eventId, ticketQrHash, userEmailLower, source, updatedAt}` — **sem `uid` e sem `profile`**.
  O leitor do app rejeitava exatamente esse formato. Resultado: o visitante compra o ingresso,
  o webhook dispara em tempo real, e na portaria do estande aparece "Crachá não encontrado".
  O script em lote `sync-sympla-event-access.ts` **já** gravava o `profile` completo — o webhook
  era a única metade quebrada.
- **Arquivos afetados:**
  - [`match-web/src/app/api/webhooks/sympla/route.ts`](match-web/src/app/api/webhooks/sympla/route.ts#L95-L120)
  - [`src/features/visitor/visitor-ticket-qr.ts`](src/features/visitor/visitor-ticket-qr.ts#L128-L130)
  - [`src/features/visitor/badge-scanner.tsx`](src/features/visitor/badge-scanner.tsx#L125)
- **Critério de aceite:**
  - Um participante que só comprou o ingresso (nunca abriu o app) tem o crachá lido no estande.
- **Feito:**
  - **Webhook:** passa a gravar `profile: { name, company, role, email, phone }` no lookup,
    reaproveitando as variáveis que já eram extraídas do `custom_form` para o doc do participante.
  - **Resolver:** a guarda virou
    `if (!lookup.uid && !lookup.profile?.name && !lookup.userEmailLower) return null;` — um doc que
    tenha ao menos o e-mail vale como crachá, e só o doc sem nada identificável é descartado.
    `profileFromLookup()` já fazia o fallback `profile.email ?? userEmailLower`, então não precisou mudar.
  - **Scanner:** título cai para o e-mail quando não há nome, com o aviso *"Cadastro incompleto:
    confirme nome e empresa com o visitante antes de salvar."*
  - **Dedupe de leads não precisou de mudança** — verificado: `leadDedupKey()` chaveia por
    e-mail → telefone → nome+empresa e ignora o uid do visitante, então um perfil só com e-mail
    dedupa igual a um completo.
- **⚠️ Restrição documentada no código:** as Security Rules limitam `ticketQrLookups` com
  `hasOnly([...])`, e num `merge` o `request.resource.data` é o documento **resultante**. Qualquer
  campo extra gravado ali pelo Admin SDK bloquearia para sempre o `publishSymplaTicketQrLookup`
  daquele visitante. Há um teste que trava esse conjunto de campos.
- **Homologado em 10/09/2026 sem gravação:** a chave existente autenticou na API Sympla v1.6.0;
  o evento `EXPOINDUSTRIAL SUL 2026` foi localizado pela referência `3486582` e hash `s353376`.
  O dry-run leu 87 participantes aprovados: todos com nome, e-mail, WhatsApp, empresa e QR; 83
  com cargo e 4 sem cargo. Nenhum documento foi gravado.
- **Ainda a fazer (operação):** com credencial Firebase Admin e autorização explícita, executar o
  sincronizador sem `SYMPLA_DRY_RUN=1` para criar/backfill dos documentos. O script é idempotente
  e não sobrescreve `uid`/`ownerUid` de quem já vinculou o ingresso pelo app.

---

### [x] 5. Colisão de hash da string vazia em `ticketQrLookups`
- **Problema:** `hashTicketQrCode('')` devolvia `sha256('') = e3b0c442…`, que é **truthy**. O
  `if (ticketQrHash)` então passava sempre, e **todo** participante sem QR no payload gravava no
  **mesmo documento**, sobrescrevendo o anterior. O script em lote já tratava isso corretamente
  (devolve `''` para entrada vazia); só o webhook divergia.
- **Arquivos afetados:**
  - [`match-web/src/app/api/webhooks/sympla/route.ts`](match-web/src/app/api/webhooks/sympla/route.ts#L137-L141)
- **Critério de aceite:**
  - Payload sem QR não gera nenhum documento em `ticketQrLookups`. ✅ coberto por teste.
- **Feito:** `hashTicketQrCode` espelha o script em lote — `return payload ? createHash(...) : '';`
- **⚠️ Pendente de operação:** apagar no console do Firestore o documento envenenado
  `ticketQrLookups/e3b0c442298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
  É o SHA-256 da string vazia — nunca é um documento legítimo. Hoje ele mapeia esse hash para um
  e-mail arbitrário e sobrevive à correção do código.

---

### [x] 6. Webhook não filtrava pedido cancelado
- **Problema:** o script em lote verifica `order_status === 'A' || 'approved'` antes de conceder
  acesso; o webhook não verificava nada. Cancelamento ou estorno mantinha o `status: 'paid'`.
- **Arquivos afetados:**
  - [`match-web/src/app/api/webhooks/sympla/route.ts`](match-web/src/app/api/webhooks/sympla/route.ts#L61-L66)
- **Critério de aceite:**
  - Pedido cancelado perde o acesso pago e o QR deixa de resolver no leitor. ✅ coberto por teste.
- **Feito:** o participante grava `paid` somente com aprovação explícita; cancelado/estornado
  grava `cancelled`; status ausente ou desconhecido grava `pending`. Todo estado não aprovado
  remove o lookup do QR, impedindo que um payload incompleto conceda acesso.
- **Sincronizador atualizado:** migrou de `/public/v3` para a API oficial `/public/v1.6.0`, usa o
  hash do evento, paginação por cursor e `cancelled_filter=include`. Assim o lote completo também
  reconcilia cancelamentos em vez de apenas ignorá-los.
- **Cobertura:** testes validam aprovação explícita, status pendente, cancelamentos e remoção do QR.

---

### [x] 7. Avisos agendados saem com horas de atraso
- **Correção do diagnóstico:** a primeira leitura desta auditoria dizia que "o cron nunca dispara",
  por causa da ausência de bloco `crons` no `vercel.json`. **Estava errado.** O workflow
  `.github/workflows/scheduled-notifications.yml` existe, está commitado desde `95debde` e roda —
  a resposta observada foi `{"ok":true,"due":0,"processed":0,"targets":0}`, o que também prova
  que a rota funciona e o `FIREBASE_SERVICE_ACCOUNT_JSON` está configurado na Vercel.
- **Problema real — pontualidade.** O workflow declara `*/5 * * * *`, mas o GitHub descarta a
  maioria dos ticks. Medido em **40 execuções reais** via `gh run list`:

  | Declarado | Medido |
  |---|---|
  | a cada 5 min | mín **92 min** · mediana **167 min** · máx **340 min** |

  Um aviso marcado para as 14:00 sai, na média, às 16:47. Inútil para "a palestra começa em 15
  minutos". A Vercel não resolve: o projeto `match365` está no plano **Hobby**, que limita crons
  a 1 por dia.
- **Arquivos afetados:**
  - [`.github/workflows/scheduled-notifications.yml`](.github/workflows/scheduled-notifications.yml)
  - [`match-web/src/app/api/cron/scheduled-notifications/route.ts`](match-web/src/app/api/cron/scheduled-notifications/route.ts)
- **Critério de aceite:**
  - Aviso agendado entregue em menos de 90 s do horário marcado (hoje: ~167 min).
- **Feito (código):**
  - Workflow rebaixado a **rede de segurança**, com comentário no topo explicando a medição.
    Autentica com Bearer de verdade e aborta se o secret faltar.
  - Rota fecha o acesso sem `CRON_SECRET` (item 2).
  - **`reclaimStaleLocks()` (novo):** `lockNotification` marcava o doc como `processing` e **nada
    nunca destravava** — uma execução que morresse entre o lock e o envio deixava o aviso preso
    para sempre, sem enviar e sem tentar de novo. Agora, docs em `processing` há mais de 10 min
    voltam para `pending` (teto de 3 tentativas, depois `failed`). Roda **antes** da consulta de
    pendentes, para o aviso recuperado sair na mesma execução, e o total vai no campo `reclaimed`
    da resposta, que serve de sinal de monitoramento.
- **⚠️ Pendente de operação — ORDEM OBRIGATÓRIA (não inverter):**
  1. `openssl rand -hex 32` → o segredo.
  2. **Vercel** (projeto `match365`) → Settings → Environment Variables → `CRON_SECRET`,
     Production (+ Preview) → **redeploy** (env só vale em deploy novo).
  3. Conferir: `curl -i -H "Authorization: Bearer <segredo>" https://match365.vercel.app/api/cron/scheduled-notifications` → 200.
  4. **GitHub:** `gh secret set CRON_SECRET`.
  5. **cron-job.org** (grátis, granularidade de 1 min): GET na mesma URL, a cada minuto, header
     `Authorization: Bearer <segredo>`, timeout 30 s, notificação de falha por e-mail ligada.
  6. **Só então** subir o código deste item.
- **Estratégia escolhida:** cron-job.org como gatilho principal (1 min, grátis) + GitHub Actions
  como rede. Descartados: upgrade para Vercel Pro (~US$20/mês) e envio manual pelo painel.

---

### [ ] 8. `targets: 0` — nenhum token de push registrado
- **Problema:** o cron responde `targets: 0`, ou seja, a coleção `visitors` não tem nenhum
  `pushTokens`. Mesmo com o agendamento pontual, **nenhum aviso chegaria a ninguém**.
- **Diagnóstico provável (não é bug):** `push.ts` retorna cedo em `!Device.isDevice`, e o Expo Go
  não emite token para o projectId `9358e907-…`. Só um dev/production build real registra.
- **Arquivos afetados:**
  - [`src/features/notifications/push.ts`](src/features/notifications/push.ts)
- **Critério de aceite / procedimento:**
  1. `eas build --profile development --platform android`, instalar em aparelho físico.
  2. Entrar como visitante, aceitar a permissão, mandar o app para segundo plano.
  3. Firestore → `visitorPrivateProfiles/{uid}.pushTokens` contém `ExponentPushToken[...]`.
  4. Isolar o Expo do backend:
     `curl -X POST https://exp.host/--/api/v2/push/send -H 'Content-Type: application/json' -d '[{"to":"ExponentPushToken[...]","title":"Teste","body":"ok"}]'`
     → se o banner não aparecer aqui, o problema é credencial/FCM, não o cron.
  5. Painel `/avisos` deve passar a mostrar "1 dispositivo(s)"; enviar um aviso imediato.
  6. Agendar um aviso para agora + 2 min e cronometrar o atraso real (meta < 90 s).

---

## 🛠️ P2 — Riscos de configuração

### [ ] 9. Security Rules ainda não publicadas em produção
- **Problema:** `firestore.rules` tem 17 inserções não commitadas, herdadas dos itens 2 e 5 da
  rodada anterior. Sem o deploy, o portal do expositor e os lookups de QR quebram em produção.
- **Solução:** `firebase deploy --only firestore:rules --project movie-app-ddda3`
  (já validado com `--dry-run`).
- **Nota:** **nenhuma** das correções dos itens 4, 5, 6 e 7 depende desse deploy — elas usam o
  Admin SDK, que ignora as rules. Revisar esse diff separadamente para que ele não suba de carona.

---

### [ ] 10. Possível divergência de caixa no e-mail dentro das rules
- **Problema:** as rules comparam `request.resource.data.userEmailLower == request.auth.token.email`
  e usam `token.email` cru no caminho do `exists()`. Os participantes são gravados com e-mail
  **minúsculo** pelo webhook e pelo script. Se o `token.email` preservar maiúsculas em algum
  provedor, tanto a escrita do lookup quanto a verificação de ingresso falham com `PERMISSION_DENIED`.
- **Arquivos afetados:**
  - [`firestore.rules`](firestore.rules#L108-L120)
- **Critério de aceite:**
  - Testar com uma conta cujo e-mail tenha maiúsculas (ex.: `Victor@Gmail.com`) antes do evento;
    se falhar, normalizar com `.lower()` nas rules.

---

### [ ] 11. `android.package` ausente no `app.json`
- **Problema:** o bloco `android` não declara `package`. O build EAS Android falha ou gera um
  identificador automático, inconsistente com o iOS (`com.victoralmeida.expoindustrialsul`).
- **Arquivos afetados:**
  - [`app.json`](app.json#L15-L27)
- **Solução:** adicionar `"package": "com.victoralmeida.expoindustrialsul"`.
- **Critério de aceite:** `eas build --platform android` conclui sem erro de identificador.
- **Nota:** bloqueia o item 8 — sem build Android não há como registrar token de push.

---

### [ ] 12. Mapa 3D ainda depende de três CDNs externas
- **Problema:** o HTML do WebView carrega Three.js, OrbitControls e Tween de `cdnjs` e `jsdelivr`.
  O fallback SVG nativo (item 4 da rodada anterior) já existe e funciona offline, mas o caminho
  3D continua sem rede no pavilhão.
- **Arquivos afetados:**
  - [`src/features/floor-plan/floor-plan-html.ts`](src/features/floor-plan/floor-plan-html.ts)
- **Critério de aceite:**
  - Celular em Modo Avião: o mapa abre no fallback 2D em até 7 s. ⚠️ **teste manual no aparelho
    nunca foi feito** — é o critério de aceite pendente desde a rodada anterior.

---

## 🧹 P3 — Higiene

### [ ] 13. Trabalho não commitado e warnings de lint
- **Problema A — risco de perda:** 48 arquivos modificados e 13 não rastreados, **todos sem
  commit**, na `main` sincronizada com `origin/main`. Inclui o trabalho inteiro das duas rodadas
  de auditoria. Um `git checkout` acidental apaga tudo.
- **Problema B — 31 warnings de ESLint** (0 erros): 11 imports/variáveis mortos
  (`LinearGradient`, `deleteDoc`, `getDocs`, `DocumentData`, `createVerticalIsland`,
  `handleRoutePress`…) e 5 warnings repetidos de `visibleExhibitors` em
  [`src/app/map.tsx`](src/app/map.tsx#L220), que invalidam a memoização a cada render.
- **Critério de aceite:**
  - Commits separados por assunto, para que cada correção seja isolável e reversível.
  - `npx eslint src/` sem warnings de variável não usada.

---

## Herdado da rodada anterior (itens 1 a 9, concluídos)

Pendências que sobreviveram àqueles itens e continuam válidas:

- **Deploy das rules** — ver item 9 acima.
- **Teste do mapa em Modo Avião** — ver item 12 acima.
- **`../MatchIndustrial365/match-web/`** — a pasta continua no disco, é um repo git local sem
  remote e está **linkada ao mesmo projeto Vercel**. Um `vercel --prod` de lá publicaria a versão
  congelada de junho por cima da atual. Arquivar ou apagar é ação destrutiva fora deste
  repositório: **decisão do dono**, não foi feita.
- **`area-de-membros/`** — a query do Firestore foi corrigida, mas a pasta continua sendo copiada
  para o build web (`build:web` → `cp -r area-de-membros dist/area-de-membros`) e ainda carrega o
  SDK 10.8.0 por CDN. Se a área de membros já foi absorvida por `/paid-events`, o certo é remover
  a cópia — mas isso tira a página do ar, então é **decisão de produto**.
- **Chaves do Firebase em `area-de-membros/app.js` não são vazamento** — a config Web
  (`apiKey`, `appId`, …) é identificador público, exigido em claro pelo SDK do navegador. Quem
  protege os dados são as `firestore.rules`. Registrado aqui para a próxima auditoria não
  reabrir o caso.

---

## Ordem recomendada

1. **Item 7 (operação)** — `CRON_SECRET` na Vercel → GitHub → cron-job.org, **nessa ordem**, antes
   de subir o código já escrito. Sem isso, os avisos param de sair.
2. **Item 1 (operação)** — configurar `SYMPLA_WEBHOOK_SECRET` na Vercel e na origem do webhook;
   o código já falha fechado.
3. **Item 5 (operação)** — apagar o doc `e3b0c442…` no Firestore.
4. **Item 4 (operação)** — configurar Firebase Admin e, somente com autorização, rodar o sync
   Sympla sem dry-run para backfill dos 87 participantes já validados.
5. **Itens 11 e 8** — `android.package`, depois o build EAS para provar a cadeia de push ponta a ponta.
6. **Item 9** — revisar e publicar as rules.
7. **Itens 3, 10, 12, 13** — antes da feira, na medida do tempo.

## Integrações Sympla e HiGestor/R Gestor

O procedimento completo de credenciais, dry-run, webhook, sincronização, login e ativação está em
[`INTEGRACAO_SYMPLA_HIGESTOR.md`](INTEGRACAO_SYMPLA_HIGESTOR.md). Nenhuma etapa de produção ou
qualquer comunicação a participante/expositor deve ser executada sem autorização explícita.
