# Ecossistema ExpoIndustrial Sul — visão de produto

Existem **dois produtos distintos** neste ecossistema. Não confundir.

> Atualizado em 09/09/2026.

---

## 1. ExpoIndustrialApp — **o app DO EVENTO** (este repositório)

App **da feira**, usado **durante as datas do evento** (ExpoIndustrial Sul, 16–19 nov).
Foco no visitante presente na feira, ali e naquele momento:

- Home do evento, KPIs, destaques
- Expositores + detalhe
- Mapa / croqui do pavilhão
- Agenda de palestras (inscrição, favoritos, lembretes)
- Matchmaking **durante a feira**
- Assistente (busca sobre estandes, agenda, mapa)
- Portal do expositor (auto-cadastro `draft`)
- Perfil do visitante

**Status:** maduro, em produção. Firebase ligado, dados reais no Firestore.

---

## 2. MatchIndustrial365 — **a COMUNIDADE o ano todo** (outro repositório)

Pasta: `../MatchIndustrial365/`

Produto de **matchmaking / networking B2B "365"** — ou seja, **o ano inteiro**, não só
durante a feira. É o app da feira que **se torna uma comunidade que roda o ano todo**,
mantendo a relação viva entre as edições (alimentando o vínculo e estando mais presente
fora do período do evento).

Dois front-ends:

- **match-mobile** (Expo, em `../MatchIndustrial365/match-mobile/`) — o **app da
  comunidade 365** para os participantes (networking/matchmaking contínuo, fora do
  período da feira).
- **match-web** (Next.js) — o **painel do organizador**. ⚠️ **Mora neste repositório**,
  em `./match-web/` (ver seção abaixo).

**Status:** match-mobile continua só esqueleto (template Expo + telas de auth em
`(auth)/`); match-web **não está mais vazio** — são 20 rotas em produção.

---

## 3. match-web — onde ele mora e o que já existe

**Pasta oficial: `ExpoIndustrialApp/match-web/`** (este repositório). É de onde sai o
deploy do projeto Vercel `match365` (Root Directory = `match-web`, deploy automático no
`git push` da `main`); o `match-web/vercel.json` com `{"framework":"nextjs"}` é
obrigatório, senão o build herda o `vercel.json` da raiz e quebra.

⚠️ **`../MatchIndustrial365/match-web/` é uma cópia congelada em 30/06/2026** — um repo
git local, sem remote, linkado ao mesmo projeto Vercel. Tudo o que ela tem já existe
aqui, e o inverso não vale: avisos, eventos pagos, as API routes, o scanner de
apresentação e vários ajustes só existem nesta pasta. **Não editar nem deployar de lá.**

Rotas em produção (20):

| Área | Rotas |
|---|---|
| Painel do organizador `(painel)` | dashboard, `agenda`, `avisos`, `croqui`, `evento`, `eventos-pagos`, `materiais`, `patrocinadores`, `visitantes` |
| Portal do expositor `/portal/expositor` | dashboard, `cadastro`, `login`, `leads`, `perfil` |
| Institucional | `/login`, `/apresentacao`, `/apresentacao-scanner` |
| API (server-side, firebase-admin) | `/api/webhooks/sympla`, `/api/portal/expositor/vincular`, `/api/cron/scheduled-notifications` |

---

## Dados — Firestore COMPARTILHADO

⚠️ **Os três front-ends usam o MESMO projeto Firebase: `movie-app-ddda3`** (mesmas
coleções: `exhibitors`, `sessions`, `sponsors`, `visitors`, …).

Consequência prática: **mudança no modelo de dados precisa ser coordenada entre os três
apps.** Uma coleção criada aqui aparece para o MatchIndustrial365 e vice-versa. O
`match-web` (painel do organizador) é quem vai escrever campos hoje protegidos por regras
(ex.: `status: 'published'`, `point` do estande no croqui).

| Front-end | Stack | Papel | Período |
|---|---|---|---|
| **ExpoIndustrialApp** | Expo | App do evento (visitante) | Durante a feira |
| **match-mobile** | Expo | Comunidade B2B 365 | O ano todo |
| **match-web** | Next.js | Painel do organizador + portal do expositor | Gestão/admin |

> As pastas: `ExpoIndustrialApp/` (app do evento **e** `match-web/`) e
> `../MatchIndustrial365/` (só o `match-mobile` é fonte viva).
