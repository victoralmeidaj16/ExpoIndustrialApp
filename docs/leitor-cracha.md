# Leitor de crachá do expositor

O expositor entra no portal `/expositor`, salva seu cadastro de empresa e toca em
**Ler crachá / ingresso Sympla**. O leitor mostra os dados disponíveis antes de
salvar o contato na lista de leads. Também está acessível no perfil público da
própria empresa quando o dono está logado. A exportação CSV existente continua disponível.

São aceitos links de crachá do app, JSON dos crachás antigos e o conteúdo exato do
QR do ingresso Sympla sincronizado. Não é feita leitura por número de pedido nem
check-in na portaria. O leitor precisa de internet para consultar ingressos Sympla.
Na web, a câmera exige HTTPS (ou localhost) e permissão do navegador.

## Ativar o reconhecimento Sympla

Executar em ambiente administrativo com `SYMPLA_API` e credencial Firebase Admin:

```sh
SYMPLA_EVENT_ID=3486582 npm run sync:sympla:event
```

A sincronização passa a gravar nome, empresa, cargo, e-mail e telefone no índice
`ticketQrLookups/{sha256}`, além dos metadados existentes. Isso permite reconhecer
visitantes que ainda não criaram conta no app. Ingressos sincronizados antes dessa
mudança precisam ser sincronizados novamente. A API key permanece no script administrativo.
Não foram executadas sincronização nem publicação em produção nesta implementação.

O índice não contém o QR bruto e não permite listagem pelas regras atuais. As
regras existentes permitem consulta individual a usuários autenticados com o hash.
Não houve alteração das regras ou coleções compartilhadas com os demais produtos.
Perfis acessíveis no app podem complementar a prévia com área, interesses e busca.

A sincronização existente importa somente participantes aprovados e não reconcilia
exclusões, cancelamentos ou troca de titularidade de registros antigos. Não usar
este leitor como validação de entrada ou de validade atual do ingresso.

## Verificação

```sh
node --test tests/*.test.cjs
```

Antes da liberação, sincronizar participantes e testar com um QR real do evento no
celular: permitir/negar câmera, ler ingresso de visitante sem conta, conferir dados,
salvar, ler novamente e verificar a lista/exportação. O reconhecimento depende do
QR lido corresponder ao campo `ticket_num_qr_code` retornado pela integração atual.
