# Auditoria funcional da pagina de apresentacao

> Arquivo auditado: [`match-web/src/app/apresentacao/page.tsx`](match-web/src/app/apresentacao/page.tsx)
> Data da auditoria: 09/09/2026
> Escopo: aplicativo do evento ExpoIndustrialSul, Portal do Expositor e Painel do Organizador.

## Resumo executivo

A pagina de apresentacao abre e suas interacoes locais funcionam, e uma parte relevante do ecossistema descrito ja esta implementada. Entretanto, o texto atualmente apresenta como concluidas algumas funcionalidades que ainda estao parciais, dependem de configuracao operacional ou nao existem no painel web.

Os principais bloqueadores encontrados sao:

1. o vinculo de estande pode ser feito por qualquer usuario autenticado que encontre um estande sem proprietario;
2. o webhook da Sympla pode aceitar requisicoes sem autenticacao quando o segredo nao estiver configurado;
3. as regras do Firestore nao garantem o controle de privacidade descrito na apresentacao;
4. os relatorios consolidados, graficos demograficos e parte da moderacao prometida nao existem no Painel do Organizador;
5. ~~a integracao da inscricao Sympla/R Gestor ainda nao eliminava o preenchimento manual do cadastro no aplicativo~~ — corrigido em codigo; sincronizacao e publicacao pendentes.

## Ressalvas e decisoes de escopo aceitas

### Editor do croqui

O painel permite alterar numero do estande, area, categoria, pontuacao e logotipo, mas nao oferece uma interface para reposicionar coordenadas ou redesenhar ruas e o layout do pavilhao.

Isso **nao e considerado um problema para este projeto**, pois foi definido que a planta e o layout permanecerao os mesmos. Portanto, nao e necessario desenvolver um editor visual de coordenadas ou de ruas.

Referencia: [`match-web/src/app/(painel)/croqui/page.tsx`](match-web/src/app/(painel)/croqui/page.tsx#L164).

### Credenciais na pagina de apresentacao

As credenciais de teste permanecerao na pagina por decisao dos responsaveis. A pagina e destinada somente ao Victor e ao Andre, e as contas sao conhecidas apenas por eles.

Isso fica registrado como **risco aceito**, sem necessidade de remover ou alterar as senhas neste momento. A decisao deve ser reavaliada somente se a pagina passar a ser divulgada publicamente ou se essas credenciais forem reutilizadas em outros ambientes.

## Problemas criticos

### 1. Vinculo do estande nao valida a empresa — corrigido em codigo

**Status atual:** corrigido no codigo em 09/09/2026; implantacao e configuracao operacional pendentes.

O fluxo agora exige que o organizador cadastre um `claimEmail` no estande, que a conta confirme esse mesmo e-mail no Firebase Auth e que a conta ainda nao esteja vinculada a outra empresa. A API retorna somente os estandes autorizados para o endereco confirmado.

Todo novo vinculo grava `status: 'draft'`. O expositor nao consegue publicar a propria empresa nem alterar os campos de autorizacao do vinculo pelas Security Rules.

Referencias:

- [`match-web/src/app/api/portal/expositor/vincular/route.ts`](match-web/src/app/api/portal/expositor/vincular/route.ts#L23)
- [`match-web/src/app/portal/expositor/cadastro/page.tsx`](match-web/src/app/portal/expositor/cadastro/page.tsx#L44)
- Promessa de vinculo seguro na [`pagina de apresentacao`](match-web/src/app/apresentacao/page.tsx#L283)

**Pendente de operacao:** publicar o painel, implantar as novas regras do Firestore, preencher o e-mail autorizado de cada expositor e conferir o envio de verificacao de e-mail no Firebase.

### 2. Webhook da Sympla pode falhar de forma aberta — corrigido em codigo

**Status:** corrigido em codigo; configuracao do segredo e publicacao pendentes.

O endpoint agora opera com falha fechada: sem `SYMPLA_WEBHOOK_SECRET`, responde `503`; com segredo incorreto, responde `401`; e somente payload autenticado chega ao Firebase. O payload completo, que pode conter dados pessoais, deixou de ser escrito no log.

Referencia: [`match-web/src/app/api/webhooks/sympla/route.ts`](match-web/src/app/api/webhooks/sympla/route.ts#L20).

**Pendente de operacao:** configurar o mesmo segredo no ambiente server-side e na ferramenta que entrega o webhook, homologar com dados ficticios e publicar o painel. Ver [`INTEGRACAO_SYMPLA_HIGESTOR.md`](INTEGRACAO_SYMPLA_HIGESTOR.md).

### 3. Privacidade dos visitantes no Firestore

**Status:** corrigido em codigo; requer migracao dos dados existentes e publicacao das regras.

O modelo foi separado para que `visitors/{uid}` contenha apenas identidade profissional e preferencias de matchmaking. E-mail, telefone, LinkedIn, site, tokens push e metadados operacionais agora ficam em `visitorPrivateProfiles/{uid}`, acessivel apenas pelo titular e por administradores.

O compartilhamento entre visitantes usa `visitorContactCards/{uid}`. Esse documento so pode ser lido por outro visitante quando `shareContact` estiver ativo e houver uma conexao realmente aceita. Somente o destinatario do convite pode aceitar ou recusar uma conexao.

O cracha sem ingresso Sympla passou a usar um identificador aleatorio, nao listavel, em `visitorBadgeLookups`, evitando colocar o UID ou abrir o perfil privado no QR. Tokens push e os fluxos administrativos do app e do `match-web` tambem foram redirecionados para a colecao privada.

Referencias:

- [`firestore.rules`](firestore.rules)
- [`src/features/visitor/visitor-profile.ts`](src/features/visitor/visitor-profile.ts)
- [`src/features/connections/use-connections.ts`](src/features/connections/use-connections.ts)
- [`match-web/src/features/visitors/use-visitors.ts`](match-web/src/features/visitors/use-visitors.ts)
- [`scripts/migrate-visitor-private-data.ts`](scripts/migrate-visitor-private-data.ts)

**Ativacao em producao:** primeiro executar `npm run migrate:visitor-privacy` para diagnostico; depois, com credenciais Firebase Admin e janela coordenada de publicacao, executar `npm run migrate:visitor-privacy -- --apply` e publicar as novas regras e versoes dos clientes. O script nao altera dados sem `--apply`.

## Funcionalidades descritas que estao ausentes ou parciais

### Relatorio consolidado de leads

**Status:** nao implementado no painel web.

O dashboard nao consulta a colecao `leads`. Ele mostra apenas contagens basicas de expositores, sessoes, patrocinadores, visitantes e conclusao do onboarding. Nao existe relatorio de leads totais, qualificacao ou filtro por segmento industrial.

Os valores `2.450`, `12.840` e `148` mostrados na apresentacao sao numeros estaticos de uma pre-visualizacao, nao dados do Firestore.

Referencias:

- [`match-web/src/app/(painel)/page.tsx`](match-web/src/app/(painel)/page.tsx#L129)
- [`match-web/src/app/apresentacao/page.tsx`](match-web/src/app/apresentacao/page.tsx#L525)
- [`match-web/src/app/apresentacao/page.tsx`](match-web/src/app/apresentacao/page.tsx#L563)

### Dashboard demografico

**Status:** parcialmente implementado.

O painel lista os visitantes e suas respostas de onboarding, incluindo empresa, cargo, setores, interesses e objetivos. Entretanto, nao calcula distribuicao de cargos, principais empresas, percentuais, graficos ou outros indicadores demograficos agregados.

Referencia: [`match-web/src/app/(painel)/visitantes/page.tsx`](match-web/src/app/(painel)/visitantes/page.tsx#L25).

### Moderacao de expositores no painel web

**Status:** corrigida em codigo; publicacao do painel pendente.

O Painel do Organizador agora possui uma tela propria de moderacao com busca, filtros de empresas em analise/publicadas, checklist obrigatorio, edicao completa da ficha comercial e acoes explicitas para publicar ou devolver para rascunho. A publicacao exige empresa, logotipo, descricao, setor, contato, produtos e estande preenchidos.

O painel tambem permite revisar responsavel, cargo, e-mail, telefone, site, Instagram, LinkedIn, segmentos atendidos, publico-alvo, objetivos e palavras-chave. A edicao de numero, area e categoria do estande continua no croqui. Nenhuma acao de moderacao envia notificacao, e-mail ou mensagem ao expositor.

Referencias:

- [`match-web/src/app/(painel)/expositores/page.tsx`](match-web/src/app/(painel)/expositores/page.tsx)
- [`match-web/src/features/exhibitors/moderation.ts`](match-web/src/features/exhibitors/moderation.ts)
- [`match-web/src/features/exhibitors/use-exhibitors.ts`](match-web/src/features/exhibitors/use-exhibitors.ts)
- Promessa de moderacao na [`pagina de apresentacao`](match-web/src/app/apresentacao/page.tsx#L430)

### Perfil comercial no Portal do Expositor

**Status:** parcialmente implementado.

O portal web permite editar empresa, descricao, setor, responsavel, cargo, e-mail, telefone, site, Instagram, LinkedIn e logotipo.

O formulario web nao permite cadastrar palavras-chave, produtos, segmentos atendidos, publico-alvo ou objetivos de matchmaking, embora esses campos existam no modelo e no formulario do aplicativo nativo.

Referencias:

- [`match-web/src/app/portal/expositor/perfil/page.tsx`](match-web/src/app/portal/expositor/perfil/page.tsx#L21)
- Promessa do perfil comercial na [`pagina de apresentacao`](match-web/src/app/apresentacao/page.tsx#L291)

### Reaproveitamento do cadastro Sympla/R Gestor

**Status:** sincronizacao Sympla automatica ativada em 10/09/2026 com autorizacao
do Victor. Cloud Scheduler executa o importador no Cloud Run a cada cinco minutos.
Primeira importacao: 91 ingressos de 81 e-mails; repeticao sem novas gravacoes.
Publicacao/homologacao do login por ingresso no app e na API continuam separadas.
HiGestor nao faz parte deste agendamento. Detalhes em
[`integrations/sympla-sync/README.md`](integrations/sympla-sync/README.md).

O prototipo de login por ingresso foi bloqueado na revisao de publicacao: o QR do cracha e compartilhavel e nao comprova a posse do e-mail. A API responde 403 sem criar contas nem emitir sessoes; a opcao fica oculta no app. O login com senha, o reaproveitamento da inscricao e o scanner continuam disponiveis. Nenhuma comunicacao e enviada nesta publicacao.

Depois da autenticacao, o onboarding procura os cadastros importados da Sympla e de todos os eventos R Gestor e preenche nome, WhatsApp, empresa e cargo disponiveis para revisao. Se a pessoa estiver em mais de um evento, os registros sao combinados sem substituir campos preenchidos por valores vazios.

A consulta anonima anterior foi removida. A leitura agora ocorre apenas depois do login e somente para o e-mail da propria conta, preservando a regra de privacidade. Se a pessoa estiver em mais de um evento, os registros sao combinados sem substituir campos preenchidos por valores vazios. Dados ausentes continuam sendo solicitados no onboarding.

Referencias:

- [`src/features/auth/auth-form.tsx`](src/features/auth/auth-form.tsx#L51)
- [`src/features/auth/auth-form.tsx`](src/features/auth/auth-form.tsx#L97)
- [`src/app/onboarding.tsx`](src/app/onboarding.tsx#L62)
- [`src/features/visitor/imported-registration-profile.ts`](src/features/visitor/imported-registration-profile.ts)
- [`match-web/src/app/api/auth/sympla-ticket/route.ts`](match-web/src/app/api/auth/sympla-ticket/route.ts)
- [`scripts/sync-higestor-event-access.ts`](scripts/sync-higestor-event-access.ts)
- [`firestore.rules`](firestore.rules#L163)

### QR Code do estande e geracao de leads

**Status:** textos corrigidos em codigo; publicacao do painel pendente.

O QR Code do estande abre o perfil da empresa no aplicativo, onde o visitante pode consultar os dados e salvar a empresa nos favoritos. Esse escaneamento nao cria automaticamente um lead.

Um lead e criado quando o representante autenticado do expositor abre o leitor, escaneia o cracha do visitante e confirma a acao `Salvar contato`. Esse fluxo corresponde a FAQ da apresentacao.

O estado vazio do portal agora informa corretamente que os leads aparecem quando um representante autorizado escaneia o cracha do visitante e confirma o salvamento. O QR do estande continua sendo descrito somente como acesso ao perfil da empresa.

Referencias:

- [`src/app/exhibitor/[id].tsx`](src/app/exhibitor/[id].tsx#L168)
- [`src/features/visitor/badge-scanner.tsx`](src/features/visitor/badge-scanner.tsx#L51)
- [`match-web/src/app/portal/expositor/page.tsx`](match-web/src/app/portal/expositor/page.tsx#L53)
- FAQ correta na [`pagina de apresentacao`](match-web/src/app/apresentacao/page.tsx#L631)

### Atualizacao de leads no Portal do Expositor

**Status:** funcional, mas nao em tempo real.

O portal consulta os leads com `getDocs`. A lista e carregada pontualmente e nao recebe atualizacoes automaticas com `onSnapshot`. Novos leads podem exigir recarregamento ou nova abertura da pagina.

Referencia: [`match-web/src/lib/services/exhibitors.ts`](match-web/src/lib/services/exhibitors.ts#L55).

### Lembretes da agenda

**Status:** parcial.

O botao de lembrete salva o ID da sessao nas preferencias do visitante, mas nao agenda uma notificacao local para o horario da palestra. O usuario ve o lembrete como ativo, porem nenhum alerta especifico da sessao e programado pelo aplicativo.

Referencia: [`src/features/agenda/use-sessions.ts`](src/features/agenda/use-sessions.ts#L174).

### Matchmaking por inteligencia artificial

**Status:** funcional com ressalvas.

O ranking de expositores pode chamar o Gemini quando `EXPO_PUBLIC_GEMINI_API_KEY` estiver configurada. Sem a chave ou em caso de erro, o aplicativo utiliza um algoritmo deterministico local.

As sugestoes de pessoas nao chamam um modelo de IA. Elas sao calculadas por regras de complementaridade, setores, objetivos, interesses, gargalos e correspondencia textual.

Como a chave do Gemini usa o prefixo publico do Expo, ela e incluida no cliente. Isso precisa ser considerado em termos de abuso, custo e privacidade dos dados enviados.

Referencias:

- [`src/features/matchmaking/score.ts`](src/features/matchmaking/score.ts#L187)
- [`src/features/matchmaking/people-score.ts`](src/features/matchmaking/people-score.ts#L20)

### Notificacoes push

**Status:** implementadas em codigo, mas ainda nao homologadas de ponta a ponta.

O app solicita permissao em aparelhos fisicos, gera o Expo Push Token e o grava no visitante. O painel possui envio imediato, cadastro de notificacoes agendadas e historico. Existe uma API de cron para processar os agendamentos.

Entretanto:

- somente visitantes com permissao concedida e token registrado recebem a notificacao;
- web e simuladores nao representam o funcionamento real do push;
- o arquivo `MELHORIAS.md` registra uma verificacao com `targets: 0`;
- o gatilho principal de minuto em minuto depende de configuracao externa;
- o `app.json` ainda nao declara `android.package`, necessario para fechar a cadeia de build Android.

Referencias:

- [`src/features/notifications/push.ts`](src/features/notifications/push.ts)
- [`match-web/src/features/notifications/send-push.ts`](match-web/src/features/notifications/send-push.ts)
- [`match-web/src/app/api/cron/scheduled-notifications/route.ts`](match-web/src/app/api/cron/scheduled-notifications/route.ts)
- [`.github/workflows/scheduled-notifications.yml`](.github/workflows/scheduled-notifications.yml)
- [`app.json`](app.json#L16)

### Materiais dos palestrantes

**Status:** parcialmente implementado.

Existem materiais genericos publicados pelo organizador e materiais exclusivos vinculados a eventos pagos. Nao existe, no modelo atual, uma ligacao direta entre material, sessao e palestrante. Portanto, a expressao `Materiais dos Palestrantes` e mais especifica do que a funcionalidade real.

**Texto corrigido:** a apresentacao agora usa `Materiais do Evento` e descreve apenas materiais gerais e conteudos exclusivos de eventos pagos.

### Destaque de patrocinadores

**Status:** parcialmente implementado.

O painel possui CRUD de patrocinadores e os logotipos aparecem no aplicativo. Atualmente eles sao exibidos principalmente em uma secao da home, e nao de forma geral nos cabecalhos e menus como informa a apresentacao.

**Texto corrigido:** a apresentacao agora limita a promessa a area de patrocinadores da pagina inicial.

### Busca global nos mapas

**Status:** funcional com limitacoes.

A tela de mapa pesquisa empresa, estande, categoria, setor, descricao e produtos e consegue destacar o estande selecionado nos mapas 2D e 3D.

A busca da lista geral de expositores e a busca interna do HTML 3D usam conjuntos de campos menores. Portanto, a busca por produto funciona pela integracao da tela React com o mapa, mas nao e um motor global unico compartilhado por todas as telas.

### Operacao offline

**Status:** a ressalva da apresentacao esta correta.

O aplicativo possui dados locais de demonstracao e preferencias locais, mas a operacao oficial de expositores, visitantes, agenda, leads e painel depende do Firebase e de internet.

O mapa 3D tambem carrega Three.js, OrbitControls, Tween e fontes por CDNs externas. Em falha do motor 3D, existe mapa 2D como alternativa, mas a experiencia 3D nao e offline.

Referencia: [`src/features/floor-plan/floor-plan-html.ts`](src/features/floor-plan/floor-plan-html.ts#L1).

### Exclusao de conta

**Status:** erro adicional nao mencionado na apresentacao.

A tela informa que cracha, preferencias e conexoes serao removidos, mas a implementacao apaga somente o documento `visitors/{uid}` e a conta do Firebase Authentication. Conexoes, leads e indices de QR podem permanecer na base.

Referencia: [`src/app/profile.tsx`](src/app/profile.tsx#L106).

## Funcionalidades verificadas como existentes

- compartilhamento do mesmo Firestore entre aplicativo e painel;
- atualizacoes em tempo real de expositores, agenda, patrocinadores, visitantes, evento e materiais;
- mapa 2D;
- mapa 3D interativo;
- busca e destaque de estandes;
- rota visual ate o estande;
- perfil detalhado do expositor;
- contatos comerciais e redes sociais;
- favoritos de expositores;
- QR Code do estande;
- cracha digital do visitante com QR Code ampliavel;
- leitura de cracha do aplicativo;
- suporte a QR legado e ingresso Sympla no scanner;
- verificacao de que o leitor pertence a conta vinculada ao expositor;
- salvamento e deduplicacao de leads;
- exportacao de leads em CSV;
- agenda, favoritos e inscricao em sessoes;
- CRUD administrativo de agenda;
- CRUD de patrocinadores;
- CRUD de materiais;
- configuracao geral do evento;
- listagem detalhada de visitantes e respostas de onboarding;
- cadastro e historico de notificacoes;
- eventos pagos e controle de acesso a materiais exclusivos;
- abas e FAQs interativas da pagina de apresentacao.

## Funcionalidades existentes que nao recebem destaque suficiente na apresentacao

### Networking entre visitantes

O aplicativo oferece sugestoes de pessoas, solicitacao de conexao, aceite, recusa, visualizacao de contatos autorizados, QR entre visitantes, abertura de mensagem e geracao de vCard.

### Assistente de busca

Existe um assistente que pesquisa expositores e programacao usando os dados locais do aplicativo. Ele funciona como busca orientada por palavras-chave, nao como um chatbot generativo completo.

### Expositores favoritos

O visitante pode salvar empresas e consultar posteriormente a lista de expositores favoritos.

### Eventos pagos

Ha suporte a eventos pagos, participantes importados, validacao por e-mail autenticado, integracao com dados da Sympla e materiais exclusivos para participantes confirmados.

### Painel administrativo no aplicativo nativo

O aplicativo possui uma area administrativa com revisao de expositores, filtro por status, publicacao/rascunho e visualizacao de leads. Essa area e mais completa para moderacao do que o painel web atual.

## Problemas encontrados na propria pagina de apresentacao

### Link `Beneficios`

**Status:** corrigido em codigo. A secao de recursos agora possui o identificador `beneficios` e compensacao para o cabecalho fixo.

Referencia: [`match-web/src/app/apresentacao/page.tsx`](match-web/src/app/apresentacao/page.tsx#L101).

### Botao de exportacao da demonstracao

**Status:** corrigido em codigo. O controle da simulacao deixou de ser um botao e passou a ser identificado como exemplo da exportacao disponivel no Portal do Expositor.

### Numeros da pre-visualizacao

**Status:** corrigido em codigo. A pre-visualizacao identifica explicitamente os numeros fixos como `Dados ilustrativos`.

### Aviso do linter

**Status:** corrigido em codigo. O componente SVG `UserCheck`, que nao era utilizado, foi removido.

## Verificacoes tecnicas executadas

| Verificacao | Resultado |
|---|---|
| Build do `match-web` | Aprovado; 24 rotas geradas |
| Export web do aplicativo Expo | Aprovado; 29 rotas geradas |
| TypeScript do aplicativo | Aprovado |
| Testes automatizados, incluindo login por ingresso e reaproveitamento Sympla/R Gestor | 50/50 aprovados |
| Lint do aplicativo | 0 erros e 31 avisos |
| Lint do `match-web` | 17 erros e 19 avisos |
| Renderizacao local da apresentacao | Aprovada |
| Abas Visitante, Expositor e Administrador | Aprovadas |
| Abertura e fechamento das FAQs | Aprovados |
| Link `#beneficios` | Aprovado apos correcao; destino presente |

O build aprovado demonstra que os projetos compilam, mas nao comprova sozinho autenticacao, dados de producao, entrega de push ou integracoes externas. As credenciais exibidas na pagina nao foram utilizadas nesta auditoria para executar operacoes autenticadas em producao.

## Erros de lint do painel web

O `match-web` compila, mas o comando de lint termina com 17 erros e 19 avisos. Os erros se concentram em:

- chamadas sincronas de `setState` dentro de efeitos;
- uso de `Date.now()` durante renderizacao;
- tipos `any` no webhook da Sympla.

Os avisos incluem imports e variaveis nao utilizados e uso de `<img>` sem o componente de otimizacao do Next.js.

Esses problemas nao impediram o build atual, mas devem ser corrigidos para recuperar uma verificacao de qualidade limpa e evitar regressao com regras futuras do React/Next.

## Ordem recomendada de correcao

1. ~~proteger o vinculo de estandes e impedir publicacao automatica~~ — corrigido em codigo;
2. ~~fazer o webhook da Sympla falhar de forma fechada~~ — corrigido em codigo; configuracao e publicacao pendentes;
3. ~~separar dados publicos e privados dos visitantes no Firestore~~ — corrigido em codigo; migracao e publicacao pendentes;
4. ~~criar o fluxo web de moderacao e publicacao de expositores~~ — corrigido em codigo; publicacao do painel pendente;
5. implementar relatorio consolidado de leads e indicadores demograficos;
6. ~~corrigir o reaproveitamento de cadastro Sympla/R Gestor~~ — corrigido em codigo; sincronizacao e publicacao pendentes;
7. homologar notificacoes push em aparelhos fisicos e finalizar a configuracao Android;
8. transformar lembretes de agenda em notificacoes reais;
9. completar os campos de matchmaking no Portal do Expositor;
10. ~~corrigir textos inconsistentes e o link `#beneficios` da apresentacao~~ — corrigido em codigo; publicacao pendente;
11. corrigir os erros de lint do painel web;
12. corrigir a exclusao incompleta de dados da conta.

O editor visual da planta e a remocao das credenciais da pagina nao fazem parte desta lista, conforme as decisoes de escopo registradas no inicio deste documento.
