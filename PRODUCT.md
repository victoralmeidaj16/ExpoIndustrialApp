# Ecossistema ExpoIndustrial Sul — visão de produto

Existem **dois produtos distintos** neste ecossistema. Não confundir.

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

- **match-mobile** (Expo) — o **app da comunidade 365** para os participantes
  (networking/matchmaking contínuo, fora do período da feira).
- **match-web** (Next.js) — o **painel do organizador** (aprovar/publicar expositores,
  posicionar estandes no croqui, gerir dados do evento).

**Status:** match-mobile é só esqueleto (template + telas de auth); match-web está vazio
(create-next-app intocado).

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
| **match-web** | Next.js | Painel do organizador | Gestão/admin |
