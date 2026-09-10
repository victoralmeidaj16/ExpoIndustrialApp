# Passo a passo — Sympla e HiGestor/R Gestor

> Atualizado em 10/09/2026. Este documento separa configuração técnica,
> homologação e ativação em produção. Nenhuma etapa marcada como produção deve
> ser executada sem autorização do Victor. Nenhum teste deve enviar e-mail,
> mensagem ou notificação a participante ou expositor real.

## 1. Definir a responsabilidade de cada plataforma

- **Sympla:** inscrição gratuita da visitação, dados básicos do visitante e QR
  do ingresso usado pelo leitor de crachás.
- **HiGestor/R Gestor:** inscrição e confirmação de pagamento dos eventos
  técnicos pagos, link de checkout e liberação de materiais exclusivos.
- **Firebase:** identidade do aplicativo e cópia controlada dos acessos. As
  senhas da Sympla e do HiGestor nunca são copiadas nem reutilizadas.

O desenho recomendado não exige transferir participantes do HiGestor para a
Sympla. Cada plataforma alimenta a coleção `paidEvents` com `source` próprio.

## 2. Credenciais necessárias

| Credencial | Onde obter | Onde configurar | Nunca colocar em |
|---|---|---|---|
| `SYMPLA_API` | Sympla: Minha Conta → Integrações | `.env` do ambiente administrativo/CI | `EXPO_PUBLIC_*`, Git ou navegador |
| `SYMPLA_EVENT_HASH` | campo `id` retornado pela API atual de eventos | ambiente do sincronizador | código fixo |
| `SYMPLA_EVENT_ID` | número da URL pública do evento | sincronizador, Vercel e painel do evento | vários arquivos diferentes |
| `SYMPLA_WEBHOOK_SECRET` | segredo aleatório criado pela organização | Vercel e ferramenta que entregar o webhook | URL pública ou app móvel |
| `HIGESTOR_API_KEY` | conta/suporte HiGestor com acesso à API | `.env` do sincronizador/CI | app Expo, painel client-side ou Git |
| `HIGESTOR_EVENT_ID` | módulo de eventos do HiGestor ou API `/eventos` | execução do sincronizador | código de interface |
| Firebase Admin | Firebase Console → conta de serviço, ou identidade do CI | `GOOGLE_APPLICATION_CREDENTIALS` ou `FIREBASE_SERVICE_ACCOUNT_JSON` | aplicativo, Git ou variável pública |

O token Sympla atual usa o header `s_token` e é gerado em **Minha Conta →
Integrações**, conforme o [contrato oficial da API](https://developers.sympla.com.br/api-docs).
Desde a versão 1.6.0, participantes usam paginação por cursor e o evento é
endereçado pelo hash retornado pela API, não apenas pelo número da URL. Consulte
também as [alterações incompatíveis da Sympla](https://developers.sympla.com.br/docs/breaking-changes.html).

A documentação pública do HiGestor confirma gestão de inscritos, pagamentos e
links de inscrição, mas não publica o contrato técnico dos endpoints usados pelo
projeto. A homologação deve ser confirmada no [suporte oficial](https://higestor.com.br/suporte/).

## 3. Preparar o formulário da Sympla

1. Confirmar que o evento correto está na conta que gerará `SYMPLA_API`.
2. Manter nome, sobrenome e e-mail por participante.
3. Criar os campos adicionais com estes nomes estáveis:
   - `WHATSAPP`;
   - `EMPRESA`;
   - `CARGO`;
   - `Cidade/Estado`.
4. Fazer os campos necessários serem coletados por participante, não apenas do
   comprador quando houver mais de um ingresso.
5. Criar um ingresso de teste interno e não usar contatos reais na homologação.
6. Registrar o ID numérico, o slug público e o hash retornado pela API.

A Sympla permite campos personalizados e exportação das respostas no painel de
participantes, conforme a [orientação oficial sobre formulários](https://ajuda.sympla.com.br/hc/pt-br/articles/204767225-Posso-criar-um-formul%C3%A1rio-de-inscri%C3%A7%C3%A3o-compra-personalizado-e-por-onde-encontro-as-respostas-dele).

## 4. Homologar a API Sympla sem gravar no Firebase

O sincronizador foi atualizado para a API `v1.6.0`, usando:

- `GET /public/v1.6.0/events` para localizar o hash;
- `GET /public/v1.6.0/events/{eventIdHash}/participants`;
- `pagination.next_cursor` para percorrer as páginas;
- `cancelled_filter=include` para reconciliar cancelamentos.

Depois da atualização, executar somente com um evento/participante de teste:

```bash
SYMPLA_DRY_RUN=1 \
SYMPLA_EVENT_ID=ID_NUMERICO \
SYMPLA_EVENT_HASH=HASH_DA_API \
npm run sync:sympla:event
```

Critérios para aprovação:

- autenticação retorna sucesso sem mostrar o token em logs;
- evento retornado corresponde à edição correta;
- nome, e-mail, telefone, empresa, cargo e QR são reconhecidos;
- paginação chega ao fim sem repetir participantes;
- e-mails aparecem mascarados nos logs;
- por padrão, o dry-run mostra apenas contagens; `SYNC_LOG_RECORDS=1` habilita
  registros individuais mascarados quando isso for realmente necessário;
- nenhum documento é gravado durante `SYMPLA_DRY_RUN=1`.

## 5. Configurar e homologar o webhook Sympla

O endpoint do projeto é:

```text
POST https://DOMINIO/api/webhooks/sympla
Header: x-webhook-secret: SEGREDO
```

1. Gerar um segredo longo e aleatório.
2. Definir `SYMPLA_WEBHOOK_SECRET`, `SYMPLA_EVENT_ID` e
   `FIREBASE_SERVICE_ACCOUNT_JSON` no ambiente server-side da Vercel.
3. Configurar o mesmo segredo na integração que entrega os eventos (integração
   oficial, Zapier ou Pluga, conforme o recurso disponível na conta).
4. Homologar apenas com payload fictício em ambiente de preview.
5. Confirmar respostas esperadas:
   - sem segredo configurado: `503`;
   - segredo incorreto: `401`;
   - payload sem e-mail: `400`;
   - payload válido de teste: `200`.
6. Só depois autorizar produção.

O webhook não envia comunicação. Ele apenas atualiza o acesso no Firebase. O
log não deve registrar o payload completo porque ele contém dados pessoais.

## 6. Preparar e homologar o HiGestor/R Gestor

Solicitar ao suporte ou ao administrador da conta a confirmação escrita de:

1. token habilitado para leitura de eventos e inscrições;
2. base URL e versão do contrato;
3. endpoints de eventos e inscrições;
4. paginação (`page[limit]` e `page[offset]`);
5. significado de `situacao` nas faturas;
6. como identificar pagamento aprovado, cancelado, estornado e cortesia;
7. disponibilidade de webhook para mudanças de pagamento;
8. limites de requisições e validade/rotação da chave.

Com o token confirmado, listar apenas eventos, sem ler participantes:

```bash
npm run sync:higestor:event
```

O comando sem `HIGESTOR_EVENT_ID` consulta a lista de eventos e mostra os IDs.
Depois, homologar um evento de teste sem gravar:

```bash
HIGESTOR_DRY_RUN=1 \
HIGESTOR_EVENT_ID=ID_DE_TESTE \
PAID_EVENT_ID=higestor-ID_DE_TESTE \
npm run sync:higestor:event
```

Validar pago, pendente, cancelado, estornado, cortesia, inscrição sem e-mail e
paginação com mais de 200 registros. O sincronizador grava estados não pagos
como `pending` e reconhece descrições de cancelamento/estorno como `cancelled`;
os termos exatos retornados pela conta devem ser homologados com o suporte.

## 7. Configurar os eventos pagos no painel

No Painel do Organizador → **Eventos pagos**:

1. cadastrar um documento por evento;
2. usar ID `higestor-{HIGESTOR_EVENT_ID}`;
3. preencher título, data, local e ordem;
4. informar o ID HiGestor;
5. colar o link público exato de inscrição/pagamento;
6. abrir o link somente com uma conta de teste;
7. vincular materiais exclusivos ao mesmo ID do evento.

O aplicativo já possui os eventos oficiais `17300`, `17299` e `18696`; os IDs,
links e datas devem ser conferidos no HiGestor antes da publicação da edição.

## 8. Aplicar a sincronização no Firebase

Somente após os dry-runs e com autorização explícita:

```bash
# Sympla
SYMPLA_EVENT_ID=ID_NUMERICO \
SYMPLA_EVENT_HASH=HASH_DA_API \
npm run sync:sympla:event

# HiGestor — repetir para cada evento pago
HIGESTOR_EVENT_ID=ID \
PAID_EVENT_ID=higestor-ID \
npm run sync:higestor:event
```

Conferir no Firestore usando exclusivamente contas de teste:

- `paidEvents/sympla-{id}/attendees/{email}`;
- `ticketQrLookups/{sha256-do-qr}`;
- `paidEvents/higestor-{id}/attendees/{email}`;
- status `paid`, `pending` ou `cancelled` coerente com a origem.

## 9. Login e reaproveitamento de dados

As plataformas não entregam a senha dos participantes. Há duas opções válidas:

1. **Manter Firebase e-mail/senha:** participante cria a conta do app com o
   mesmo e-mail da inscrição; após autenticar, dados importados preenchem o
   onboarding.
2. **Adotar acesso sem senha:** enviar link mágico ou código temporário para o
   e-mail já inscrito e criar a sessão Firebase depois da confirmação.

A segunda opção reduz o recadastro, mas envolve envio de e-mail. Ela permanece
bloqueada até autorização expressa do Victor e definição do provedor, remetente,
texto, consentimento e ambiente de homologação. Não é permitido testar esse
fluxo com pessoas reais sem autorização.

## 10. Automatização recomendada

Depois da homologação manual:

- executar reconciliação Sympla e HiGestor em agenda server-side;
- usar segredo próprio para cada job;
- não colocar tokens no GitHub Actions em texto aberto;
- impedir execuções simultâneas;
- registrar apenas contagens e identificadores técnicos, nunca payload completo;
- alertar somente a equipe técnica em caso de falha — qualquer comunicação a
  participantes continua fora do escopo sem autorização;
- manter uma reconciliação diária completa mesmo quando houver webhook.

## 11. Checklist final de produção

- [ ] Token Sympla rotacionado e guardado no ambiente server-side.
- [ ] Hash e ID da edição Sympla confirmados.
- [ ] Script Sympla migrado e testado na API v1.6.0.
- [ ] Segredo obrigatório do webhook configurado nos dois lados.
- [ ] Webhook testado com dados fictícios e sem payload pessoal nos logs.
- [ ] Contrato/endpoints HiGestor confirmados pelo suporte.
- [ ] Token HiGestor rotacionado e guardado no ambiente server-side.
- [ ] Estados de pagamento e cancelamento homologados.
- [ ] Eventos e links de checkout conferidos.
- [ ] Firebase Admin configurado somente no servidor/CI.
- [ ] Dry-runs aprovados.
- [ ] Regras do Firestore publicadas.
- [ ] Teste ponta a ponta feito exclusivamente com contas de teste.
- [ ] Autorização do Victor registrada antes de ativar produção.

## Estado atual do projeto

- credencial `SYMPLA_API`: validada em leitura na API v1.6.0 em 10/09/2026;
- edição Sympla: `EXPOINDUSTRIAL SUL 2026`, referência `3486582`, hash `s353376`;
- dry-run Sympla: 87 participantes, todos com status `approved`, nome, e-mail,
  WhatsApp, empresa e QR; 83 com cargo e 4 sem cargo preenchido;
- integração Sympla em lote: atualizada para a API v1.6.0 e homologada sem gravação;
- webhook Sympla: autenticação agora falha fechada no código;
- leitura de QR Sympla: implementada;
- preenchimento após login pelo mesmo e-mail: implementado;
- sincronização HiGestor em lote: implementada com reconciliação de pago, pendente e termos conhecidos de cancelamento; homologacao pendente;
- links de pagamento HiGestor no app: implementados;
- login único/reutilização de senha externa: não disponível pelas plataformas;
- acesso sem senha por e-mail: não implementado e bloqueado sem autorização de envio.
