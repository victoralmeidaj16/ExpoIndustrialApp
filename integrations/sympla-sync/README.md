# Sincronização automática Sympla

## Estado em 10/09/2026

**Ativado em produção, com autorização do proprietário.** As APIs Cloud Scheduler
e Secret Manager e a identidade exclusiva estão configuradas em `movie-app-ddda3`.
Primeira importação concluída: 91 ingressos, 81 e-mails distintos e 170 operações.
O agendamento está `ENABLED`, a cada cinco minutos, sem depender do computador.

Validações e versão implantada:

- Build: `1debff1e-4862-47e1-b943-009febb1f4da` (sucesso).
- Imagem: `southamerica-east1-docker.pkg.dev/movie-app-ddda3/event-integrations/sympla-sync@sha256:994107393a1f8ccd48f024c475c31336377840c8e54c4c5295a384e3d2427ea3`.
- Simulação na nuvem: `sympla-sync-jk8d9` (sucesso; nenhuma gravação).
- Primeira importação: `sympla-sync-vm5xq` (sucesso; 10/09/2026 12:08 BRT).
- Execução de repetição: `sympla-sync-k4t5x` (sucesso; zero gravações).
- Teste acionado pelo próprio Scheduler: `sympla-sync-2vlhx` (sucesso;
  10/09/2026 12:11 BRT). Scheduler retornou HTTP 200 e a tarefa completou;
  este disparo foi solicitado manualmente para validar a cadeia autenticada.
- Primeiro disparo automático pelo relógio confirmado: `sympla-sync-9g4bx`,
  criado em 10/09/2026 12:15:03 BRT, uma tarefa concluída com sucesso.
- Segredo fixado na versão `sympla-sync-api:1`; nenhum `.env` foi enviado.

## Operação ativa

- Cloud Run Job `sympla-sync`, região `southamerica-east1`, uma tarefa.
- Cloud Scheduler `sympla-sync-every-five-minutes`, `*/5 * * * *`, fuso
  `America/Sao_Paulo`, autenticação Google OAuth para executar o job privado.
- Identidade exclusiva `sympla-sync@movie-app-ddda3.iam.gserviceaccount.com`.
- Segredo `sympla-sync-api`, contendo apenas a chave Sympla atual.
- Imagem construída exclusivamente a partir desta pasta, sem `.env`, app,
  rotas de login, código de notificações ou credenciais pessoais.
- Recursos faturáveis: Scheduler, execução Cloud Run, build/registro da imagem,
  armazenamento de segredo e operações Firestore. Frequência planejada, não
  garantia de entrega instantânea; erros serão visíveis nas execuções do job.

A identidade precisa ler/gravar Firestore (`roles/datastore.user`), ler somente
o segredo dedicado e executar somente o job dedicado (`roles/run.invoker`
no recurso). O papel Firestore é amplo no banco compartilhado; o código limita
seu uso aos participantes do evento `sympla-3486582` e respectivos
`ticketQrLookups`. IAM de servidor não aplica as Security Rules do cliente.
Nenhum papel de Firebase Auth, FCM ou envio de mensagens é necessário.

## Dados e garantias

Lê todas as páginas da API v1.6.0 antes de iniciar qualquer gravação.
Importa nome, e-mail, telefone, empresa, cargo e ingresso. Atualiza apenas
campos geridos pela integração, preservando `uid` e `ownerUid` existentes.
Uma repetição sem alterações não regrava participantes nem índices QR.
Um ingresso cancelado remove o índice antigo; se o mesmo e-mail tiver outro
ingresso aprovado, o acesso por e-mail permanece pago. Dados ausentes do
snapshot não causam exclusão automática de participantes.

Não cria usuários, não envia mensagens, não salva leads e não publica estandes.
Não altera o documento público do evento nem os perfis públicos dos visitantes.
O preenchimento no app continua acontecendo após a autenticação do visitante.

## Validação local

Na raiz do repositório:

```sh
node --test integrations/sympla-sync/sync.test.mjs
GOOGLE_CLOUD_PROJECT=movie-app-ddda3 SYMPLA_DRY_RUN=1 node --env-file=.env integrations/sympla-sync/run.mjs
```

Somente `SYMPLA_DRY_RUN=0` habilita gravações. A identidade local utiliza
Application Default Credentials; nunca exportar essa credencial pessoal para
o job. Em produção, o job utiliza sua identidade própria e Secret Manager.

## Consultar a operação

```sh
gcloud run jobs executions list --job=sympla-sync --region=southamerica-east1 --project=movie-app-ddda3
gcloud scheduler jobs describe sympla-sync-every-five-minutes --location=southamerica-east1 --project=movie-app-ddda3
```

Logs do job contêm somente contagens e códigos de falha, sem nomes, e-mails,
telefones ou ingressos. Scheduler confirmar o disparo não basta: conferir também
o sucesso da execução do Cloud Run. Uma falha será tentada no próximo ciclo.

Para pausar após ativar:

```sh
gcloud scheduler jobs pause sympla-sync-every-five-minutes --location=southamerica-east1 --project=movie-app-ddda3
```
