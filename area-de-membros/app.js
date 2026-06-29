// DADOS MOCKADOS — ÁREA DE MEMBROS PREMIUM (ÁPICE + EXPO INDUSTRIAL SUL)

const MOCK_EXHIBITORS = [
  {
    id: 1,
    name: "WEG Equipamentos",
    stand: "A-12",
    category: "patrocinador",
    tech: "iot",
    desc: "Líder global em motores elétricos, automação industrial e sistemas de energia. Apresentando soluções completas de Indústria 4.0.",
    tags: ["Motores", "IoT", "Eficiência Energética"],
    products: ["WEG Motor Scan (Sensor IoT)", "Inversores de Frequência CWW900", "Plataforma WEG IoT"],
    logo: '<svg viewBox="0 0 100 100" style="width:100%; height:100%;"><rect width="100" height="100" fill="#00579F" rx="8"/><text x="50" y="65" font-family="sans-serif" font-weight="900" font-size="34" fill="white" text-anchor="middle">WEG</text></svg>'
  },
  {
    id: 2,
    name: "Siemens Brasil",
    stand: "B-04",
    category: "patrocinador",
    tech: "software",
    desc: "Pioneira em digitalização e automação para manufatura discreta e de processos. Gêmeos digitais e integração TI/TO.",
    tags: ["Gêmeos Digitais", "Sistemas MES", "CLPs"],
    products: ["MindSphere (Industrial IoT)", "CLP Simatic S7-1500", "Software TIA Portal"],
    logo: '<svg viewBox="0 0 100 100" style="width:100%; height:100%;"><rect width="100" height="100" fill="#00797A" rx="8"/><text x="50" y="62" font-family="sans-serif" font-weight="800" font-size="18" fill="white" text-anchor="middle">SIEMENS</text></svg>'
  },
  {
    id: 3,
    name: "Kuka Robótica",
    stand: "C-08",
    category: "expositor",
    tech: "robotica",
    desc: "Especialista em robôs industriais e soluções inovadoras de automação para linhas de produção de alta velocidade.",
    tags: ["Robótica", "Braços Articulados", "Células de Solda"],
    products: ["Robô Colaborativo LBR iisy", "Robô Industrial KR QUANTEC", "KUKA.Sim (Software Simulação)"],
    logo: '<svg viewBox="0 0 100 100" style="width:100%; height:100%;"><rect width="100" height="100" fill="#ED7A1C" rx="8"/><text x="50" y="65" font-family="sans-serif" font-weight="800" font-size="26" fill="white" text-anchor="middle">KUKA</text></svg>'
  },
  {
    id: 4,
    name: "Bosch Rexroth",
    stand: "A-02",
    category: "expositor",
    tech: "manutencao",
    desc: "Soluções inteligentes de acionamento e controle hidráulico, pneumático e elétrico para máquinas industriais.",
    tags: ["Hidráulica", "Pneumática", "Manutenção Preditiva"],
    products: ["CytroBox (Unidade Hidráulica IoT)", "Sensores Digitais Proximidade", "Guias Lineares Inteligentes"],
    logo: '<svg viewBox="0 0 100 100" style="width:100%; height:100%;"><rect width="100" height="100" fill="#1C1F2A" rx="8"/><text x="50" y="62" font-family="sans-serif" font-weight="800" font-size="24" fill="#00CCFF" text-anchor="middle">Bosch</text></svg>'
  },
  {
    id: 5,
    name: "SMC Pneumáticos",
    stand: "D-10",
    category: "expositor",
    tech: "maquinas",
    desc: "Líder mundial em tecnologia pneumática para automação industrial e controle de fluidos.",
    tags: ["Pneumática", "Válvulas", "Eficiência de Ar"],
    products: ["Garras Pneumáticas de Precisão", "Coletores de Válvulas Serial", "Sensores de Fluxo de Ar"],
    logo: '<svg viewBox="0 0 100 100" style="width:100%; height:100%;"><rect width="100" height="100" fill="#005A9C" rx="8"/><text x="50" y="65" font-family="sans-serif" font-weight="900" font-size="30" fill="white" text-anchor="middle">SMC</text></svg>'
  }
];

const MOCK_NETWORKING = [
  {
    id: 1,
    name: "Eduardo Santos",
    company: "WEG Equipamentos",
    role: "Diretor de IoT Industrial",
    roleKey: "ceo",
    segment: "automacao",
    state: "SC",
    city: "Jaraguá do Sul",
    avatar: "ES"
  },
  {
    id: 2,
    name: "Mariana Schmidt",
    company: "Ápice Educação Executiva",
    role: "Mentora de Indústria 4.0",
    roleKey: "especialista",
    segment: "automacao",
    state: "PR",
    city: "Curitiba",
    avatar: "MS"
  },
  {
    id: 3,
    name: "Julio Cesar",
    company: "Siemens Brasil",
    role: "Engenheiro de Soluções MES",
    roleKey: "engenheiro",
    segment: "automacao",
    state: "SP",
    city: "São Paulo",
    avatar: "JC"
  },
  {
    id: 4,
    name: "Patrícia Lima",
    company: "SulMetal S/A",
    role: "Compradora Sênior",
    roleKey: "comprador",
    segment: "metalurgico",
    state: "SC",
    city: "Joinville",
    avatar: "PL"
  },
  {
    id: 5,
    name: "Carlos Eduardo",
    company: "Renault Brasil",
    role: "Gerente de Manufatura",
    roleKey: "ceo",
    segment: "automotivo",
    state: "PR",
    city: "São José dos Pinhais",
    avatar: "CE"
  }
];

const MOCK_LIBRARY = [
  {
    id: 1,
    title: "Aula Magna: Liderança Exponencial na Indústria 4.0",
    type: "palestra",
    author: "Prof. Marcos Silveira (Ápice)",
    duration: "45 min",
    badge: "EXCLUSIVO",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    title: "Workshop: Implementação Prática de Gêmeos Digitais",
    type: "workshop",
    author: "Siemens Tech Academy",
    duration: "1h 20min",
    badge: "WORKSHOP",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 3,
    title: "E-book: Guia de Eficiência Energética Industrial",
    type: "ebook",
    author: "WEG Energy Solutions",
    duration: "32 páginas",
    badge: "E-BOOK",
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    title: "Artigo: Manutenção Preditiva vs. Corretiva em Motores de Grande Porte",
    type: "artigo",
    author: "Ápice Engineering",
    duration: "15 min de leitura",
    badge: "TÉCNICO",
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=60"
  }
];

const MOCK_FEED = [
  {
    id: 1,
    author: "Eduardo Santos",
    role: "Diretor de IoT Industrial na WEG",
    time: "Há 2 horas",
    body: "Tivemos a honra de receber hoje na sede da WEG o time de mentores da Ápice Educação Executiva para alinhar nossa trilha de desenvolvimento em Indústria 4.0. Juntos vamos transformar o ecossistema industrial da região sul. #WEG #Apice #Industria40",
    likes: 42,
    comments: 8,
    isLiked: false,
    tag: "Expositor"
  },
  {
    id: 2,
    author: "Siemens Brasil",
    role: "Patrocinador Master",
    time: "Há 5 horas",
    body: "Acabamos de liberar na Biblioteca a gravação do nosso workshop exclusivo sobre implementação de Gêmeos Digitais. Uma demonstração prática e direta para engenheiros de manufatura. Confiram na aba Biblioteca! #Siemens #GemeosDigitais",
    likes: 89,
    comments: 14,
    isLiked: false,
    tag: "Patrocinador"
  }
];

const MOCK_FORUMS = [
  { id: 1, title: "Indústria 4.0 & Conectividade", desc: "Debates sobre infraestrutura industrial 5G, sensores IoT e integração de barramentos.", members: 142, topics: 34, icon: "iot" },
  { id: 2, title: "Liderança Executiva Industrial", desc: "Espaço dedicado a gestores, diretores e CEOs para compartilhar cases de gestão de times.", members: 98, topics: 18, icon: "ceo" },
  { id: 3, title: "Manutenção & Confiabilidade", desc: "Melhores práticas de manutenção preditiva, análise de vibração e automação de alertas.", members: 110, topics: 27, icon: "manutencao" }
];

const MOCK_AGENDA = [
  { id: 1, day: 16, month: "NOV", title: "Abertura Oficial da Expo Industrial Sul 2026", time: "09:00", type: "Feira" },
  { id: 2, day: 17, month: "NOV", title: "Painel Ápice: O Futuro da Indústria 4.0 no Sul", time: "14:00", type: "Palestra" },
  { id: 3, day: 18, month: "NOV", title: "Encontro Rodada de Negócios B2B", time: "10:00", type: "Matchmaking" },
  { id: 4, day: 19, month: "NOV", title: "Workshop WEG de Eficiência Operacional", time: "16:00", type: "Workshop" }
];

// ESTADO GLOBAL DA APLICAÇÃO
let userConnections = 24;
let userXP = 1250;
let userReunioes = 4;

// CONFIGURAÇÃO DE NAVEGAÇÃO E SPA
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  renderDashboard();
  renderFeed();
  renderCommunity();
  renderLibrary();
  renderNetworking();
  renderMarketplace();
  renderAgenda();
  setupFilters();
  setupChat();
  setupPostCreation();
  setupQrScanner();
});

function setupNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = item.getAttribute("data-view");
      switchView(targetView);
    });
  });
}

function switchView(viewName) {
  // Atualiza classe ativa na sidebar
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach(item => {
    if (item.getAttribute("data-view") === viewName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Atualiza painéis ativos no corpo
  const panels = document.querySelectorAll(".view-panel");
  panels.forEach(panel => {
    if (panel.id === `view-${viewName}`) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });

  // Rola para o topo do conteúdo
  document.getElementById("contentBody").scrollTop = 0;
}

// ATUALIZADORES DE XP E CONEXÕES
function addXP(amount, reason) {
  userXP += amount;
  document.getElementById("kpiPontos").innerText = `${userXP.toLocaleString()} XP`;
  document.getElementById("profileXpText").innerText = `${userXP} / 2.000 XP`;
  
  // Atualiza barra de progresso (calculada com base em 2000 max)
  const percent = Math.min((userXP / 2000) * 100, 100);
  document.getElementById("profileXpBar").style.width = `${percent}%`;

  showNotification(`+${amount} XP: ${reason}`);
}

function addConnection() {
  userConnections++;
  document.getElementById("kpiConexoes").innerText = userConnections;
}

function addMeeting() {
  userReunioes++;
  document.getElementById("kpiReunioes").innerText = userReunioes;
}

// NOTIFICAÇÃO FLUTUANTE PREMIUM
function showNotification(message) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "24px";
  container.style.right = "24px";
  container.style.backgroundColor = "var(--text-primary)";
  container.style.color = "var(--bg-primary)";
  container.style.padding = "12px 20px";
  container.style.borderRadius = "8px";
  container.style.boxShadow = "var(--shadow-lg)";
  container.style.zIndex = "1000";
  container.style.fontSize = "13px";
  container.style.fontWeight = "500";
  container.style.border = "1px solid var(--gold-border)";
  container.style.animation = "fadeIn 0.3s ease-out";
  container.innerText = message;

  document.body.appendChild(container);

  setTimeout(() => {
    container.style.animation = "fadeOut 0.3s ease-in";
    setTimeout(() => container.remove(), 300);
  }, 4000);
}

// RENDERS DAS SEÇÕES
function renderDashboard() {
  // Carrega posts recentes no feed do dashboard
  const container = document.getElementById("dashboardFeedContainer");
  container.innerHTML = "";
  
  MOCK_FEED.forEach(post => {
    const card = document.createElement("div");
    card.className = "feed-post-card";
    card.style.padding = "16px";
    card.style.marginBottom = "12px";
    card.innerHTML = `
      <div class="post-author-row">
        <div class="post-author-info">
          <div class="user-avatar" style="width:28px; height:28px; font-size:11px;">${post.author.split(" ").map(n => n[0]).join("")}</div>
          <div class="post-author-meta">
            <span class="post-author-name" style="font-size:13px;">${post.author} <span class="badge-exhibitor">${post.tag}</span></span>
            <span class="post-author-role" style="font-size:10px;">${post.role}</span>
          </div>
        </div>
      </div>
      <p class="post-body" style="font-size:13px; line-height:1.5; margin-top:8px;">${post.body.substring(0, 140)}...</p>
    `;
    container.appendChild(card);
  });

  // Carrega patrocinadores
  const sponsorsContainer = document.getElementById("dashboardSponsors");
  sponsorsContainer.innerHTML = "";
  
  MOCK_EXHIBITORS.filter(ex => ex.category === "patrocinador").forEach(ex => {
    const item = document.createElement("div");
    item.className = "aside-item";
    item.innerHTML = `
      <div style="width: 38px; height: 38px; flex-shrink: 0;">
        ${ex.logo}
      </div>
      <div class="aside-item-info">
        <span class="aside-item-title">${ex.name}</span>
        <span class="aside-item-desc">Estande ${ex.stand}</span>
      </div>
    `;
    sponsorsContainer.appendChild(item);
  });
}

function renderFeed() {
  const container = document.getElementById("feedPostsContainer");
  container.innerHTML = "";

  MOCK_FEED.forEach(post => {
    const card = document.createElement("div");
    card.className = "feed-post-card";
    card.innerHTML = `
      <div class="post-author-row">
        <div class="post-author-info">
          <div class="user-avatar">${post.author.split(" ").map(n => n[0]).join("")}</div>
          <div class="post-author-meta">
            <span class="post-author-name">${post.author} <span class="badge-exhibitor">${post.tag}</span></span>
            <span class="post-author-role">${post.role}</span>
          </div>
        </div>
        <span class="post-time">${post.time}</span>
      </div>
      <p class="post-body">${post.body}</p>
      <div class="post-engagement-stats">
        <span>${post.likes} curtidas</span>
        <span>${post.comments} comentários</span>
      </div>
      <div class="post-actions">
        <button class="post-action-btn ${post.isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Curtir
        </button>
        <button class="post-action-btn">
          <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          Comentar
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Renderiza Vagas na Lateral
  const jobsContainer = document.getElementById("feedJobsContainer");
  jobsContainer.innerHTML = `
    <div class="aside-item">
      <div class="aside-item-info">
        <span class="aside-item-title" style="font-weight:700;">Engenheiro de Automação IoT</span>
        <span class="aside-item-desc">WEG Equipamentos • Jaraguá do Sul</span>
      </div>
    </div>
    <div class="aside-item">
      <div class="aside-item-info">
        <span class="aside-item-title" style="font-weight:700;">Gerente de Manufatura Enxuta</span>
        <span class="aside-item-desc">SulMetal S/A • Joinville</span>
      </div>
    </div>
  `;
}

function toggleLike(postId) {
  const post = MOCK_FEED.find(p => p.id === postId);
  if (post) {
    if (post.isLiked) {
      post.likes--;
      post.isLiked = false;
    } else {
      post.likes++;
      post.isLiked = true;
      addXP(10, "curtiu uma publicação técnica");
    }
    renderFeed();
  }
}

function renderCommunity() {
  const container = document.getElementById("communityRoomsGrid");
  container.innerHTML = "";

  MOCK_FORUMS.forEach(room => {
    const card = document.createElement("div");
    card.className = "forum-room-card";
    card.innerHTML = `
      <div class="forum-room-header">
        <div class="forum-room-icon">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <span class="forum-room-badge">${room.topics} tópicos</span>
      </div>
      <h3 class="forum-room-title">${room.title}</h3>
      <p class="forum-room-desc">${room.desc}</p>
      <div class="forum-room-footer">
        <span class="forum-room-stats">${room.members} membros</span>
        <button class="forum-room-join-btn" onclick="enterForum('${room.title}')">Entrar no Fórum &rarr;</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function enterForum(title) {
  showNotification(`Entrando na sala temática: ${title}`);
  addXP(15, "participou de fórum técnico");
}

function renderLibrary(filter = "todos") {
  const container = document.getElementById("libraryGrid");
  container.innerHTML = "";

  const filtered = filter === "todos" ? MOCK_LIBRARY : MOCK_LIBRARY.filter(item => item.type === filter);

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "library-item-card";
    card.innerHTML = `
      <div class="library-item-thumb">
        <img src="${item.image}" alt="${item.title}">
        <span class="library-item-badge">${item.badge}</span>
        <div class="library-play-btn" onclick="watchContent('${item.title}')">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
      <div class="library-item-content">
        <h3 class="library-item-title">${item.title}</h3>
        <p class="view-subtitle" style="margin-bottom: 0;">${item.author}</p>
        <div class="library-item-meta">
          <span>Duração: ${item.duration}</span>
          <span style="color: var(--gold-primary); font-weight:600; cursor:pointer;" onclick="watchContent('${item.title}')">Assistir Agora</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function watchContent(title) {
  showNotification(`Carregando conteúdo: "${title}"`);
  addXP(30, "assistiu vídeo/palestra técnica");
}

function renderNetworking(segmentFilter = "todos", roleFilter = "todos", stateFilter = "todos") {
  const container = document.getElementById("networkingGrid");
  container.innerHTML = "";

  const filtered = MOCK_NETWORKING.filter(item => {
    const matchesSegment = segmentFilter === "todos" || item.segment === segmentFilter;
    const matchesRole = roleFilter === "todos" || item.roleKey === roleFilter;
    const matchesState = stateFilter === "todos" || item.state === stateFilter;
    return matchesSegment && matchesRole && matchesState;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-tertiary);">Nenhum especialista ou parceiro encontrado com os filtros selecionados.</div>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "networking-card";
    card.innerHTML = `
      <div class="networking-avatar-big">${item.avatar}</div>
      <h3 class="networking-name">${item.name}</h3>
      <p class="networking-role">${item.role}</p>
      <p class="networking-company">${item.company}</p>
      <div class="networking-location">
        <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${item.city} - ${item.state}</span>
      </div>
      <div class="networking-card-actions">
        <button class="btn-secondary" onclick="connectUser('${item.name}')">Conectar</button>
        <button class="btn-primary" onclick="scheduleB2B('${item.name}')">Agendar Reunião</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function connectUser(name) {
  showNotification(`Solicitação de conexão enviada para ${name}`);
  addXP(10, `conectou-se com ${name}`);
  addConnection();
}

function scheduleB2B(name) {
  showNotification(`Reunião B2B solicitada com ${name}. Verifique seu calendário na aba Agenda.`);
  addXP(25, `agendou rodada de negócios com ${name}`);
  addMeeting();
}

function renderMarketplace(techFilter = "todos", categoryFilter = "todos") {
  const container = document.getElementById("marketplaceGrid");
  container.innerHTML = "";

  const filtered = MOCK_EXHIBITORS.filter(item => {
    const matchesTech = techFilter === "todos" || item.tech === techFilter;
    const matchesCategory = categoryFilter === "todos" || item.category === categoryFilter;
    return matchesTech && matchesCategory;
  });

  filtered.forEach(ex => {
    const card = document.createElement("div");
    card.className = "exhibitor-card";
    card.innerHTML = `
      <div class="exhibitor-banner">
        <div class="exhibitor-logo-box">
          ${ex.logo}
        </div>
        <span class="exhibitor-stand">STAND ${ex.stand}</span>
      </div>
      <div class="exhibitor-card-content">
        <div class="exhibitor-name-row">
          <h3 class="exhibitor-name">${ex.name}</h3>
          ${ex.category === "patrocinador" ? '<span class="badge-exhibitor" style="background-color: var(--text-primary); color: #fff;">PATROCINADOR MASTER</span>' : ''}
        </div>
        <p class="exhibitor-desc">${ex.desc}</p>
        <div class="exhibitor-tag-group">
          ${ex.tags.map(t => `<span class="exhibitor-tag">${t}</span>`).join("")}
        </div>
        <div class="exhibitor-card-footer">
          <button class="btn-secondary" onclick="openExhibitorDetails(${ex.id})">Detalhes</button>
          <button class="btn-primary" onclick="requestMatch(${ex.id})">Solicitar Reunião</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openExhibitorDetails(id) {
  const ex = MOCK_EXHIBITORS.find(e => e.id === id);
  if (ex) {
    document.getElementById("modalExhibitorName").innerText = ex.name;
    document.getElementById("modalExhibitorDesc").innerText = ex.desc;
    
    // Tags
    const tagsBox = document.getElementById("modalExhibitorTags");
    tagsBox.innerHTML = ex.tags.map(t => `<span class="exhibitor-tag">${t}</span>`).join("");
    
    // Products
    const prodList = document.getElementById("modalExhibitorProducts");
    prodList.innerHTML = ex.products.map(p => `<li>${p}</li>`).join("");

    // Ação do Botão Match
    const matchBtn = document.getElementById("modalMatchBtn");
    matchBtn.onclick = () => {
      requestMatch(ex.id);
      document.getElementById("exhibitorModal").close();
    };

    document.getElementById("exhibitorModal").showModal();
  }
}

// Fallback manual para light-dismiss nos modais
const exhibitorModal = document.getElementById("exhibitorModal");
if (exhibitorModal && !('closedBy' in HTMLDialogElement.prototype)) {
  exhibitorModal.addEventListener('click', (event) => {
    if (event.target !== exhibitorModal) return;
    const rect = exhibitorModal.getBoundingClientRect();
    const isDialogContent = (
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width
    );
    if (!isDialogContent) exhibitorModal.close();
  });
}

function requestMatch(exId) {
  const ex = MOCK_EXHIBITORS.find(e => e.id === exId);
  if (ex) {
    showNotification(`Match inteligente aceito com ${ex.name}!`);
    addXP(40, `solicitou rodada de matchmaking com expositor ${ex.name}`);
    addMeeting();
  }
}

function renderAgenda() {
  const listContainer = document.getElementById("agendaEventsList");
  listContainer.innerHTML = "";

  MOCK_AGENDA.forEach(evt => {
    const item = document.createElement("div");
    item.className = "agenda-item";
    item.innerHTML = `
      <div class="agenda-date-badge">
        <span class="agenda-date-badge-day">${evt.day}</span>
        <span class="agenda-date-badge-month">${evt.month}</span>
      </div>
      <div class="agenda-item-info">
        <h4 class="agenda-item-title">${evt.title}</h4>
        <div class="agenda-item-meta">
          <span>Horário: ${evt.time}</span>
          <span style="color: var(--gold-primary); font-weight:600;">Tipo: ${evt.type}</span>
        </div>
      </div>
    `;
    listContainer.appendChild(item);
  });

  // Dias do Calendário
  const grid = document.getElementById("calendarGridNumbers");
  grid.innerHTML = "";
  
  // Adiciona dias vazios do início da semana
  for (let i = 0; i < 6; i++) {
    const emptyBox = document.createElement("div");
    emptyBox.className = "calendar-day-box outside";
    emptyBox.innerHTML = `<span class="calendar-day-num">${26 + i}</span>`;
    grid.appendChild(emptyBox);
  }

  // Dias de Novembro
  for (let day = 1; day <= 30; day++) {
    const dayBox = document.createElement("div");
    dayBox.className = "calendar-day-box";
    
    // Verifica se tem evento nesse dia
    const hasEvent = MOCK_AGENDA.some(e => e.day === day);
    const isFeiraDay = day >= 16 && day <= 19;
    
    if (isFeiraDay) {
      dayBox.classList.add("active");
    }

    dayBox.innerHTML = `
      <span class="calendar-day-num">${day}</span>
      ${hasEvent ? '<div class="calendar-event-dot"></div>' : ''}
    `;

    dayBox.onclick = () => {
      const dayEvt = MOCK_AGENDA.find(e => e.day === day);
      if (dayEvt) {
        showNotification(`Evento no dia ${day}: "${dayEvt.title}"`);
      } else {
        showNotification(`Nenhum evento oficial agendado para o dia ${day} de Novembro.`);
      }
    };

    grid.appendChild(dayBox);
  }
}

// LÓGICA DE FILTROS E BUSCA GLOBAL
function setupFilters() {
  // Networking
  document.getElementById("netFilterSegment").addEventListener("change", filterNet);
  document.getElementById("netFilterRole").addEventListener("change", filterNet);
  document.getElementById("netFilterState").addEventListener("change", filterNet);
  
  document.getElementById("clearNetFilters").addEventListener("click", () => {
    document.getElementById("netFilterSegment").value = "todos";
    document.getElementById("netFilterRole").value = "todos";
    document.getElementById("netFilterState").value = "todos";
    filterNet();
  });

  function filterNet() {
    const segment = document.getElementById("netFilterSegment").value;
    const role = document.getElementById("netFilterRole").value;
    const state = document.getElementById("netFilterState").value;
    renderNetworking(segment, role, state);
  }

  // Marketplace
  document.getElementById("marketFilterTech").addEventListener("change", filterMarket);
  document.getElementById("marketFilterCategory").addEventListener("change", filterMarket);
  
  document.getElementById("clearMarketFilters").addEventListener("click", () => {
    document.getElementById("marketFilterTech").value = "todos";
    document.getElementById("marketFilterCategory").value = "todos";
    filterMarket();
  });

  function filterMarket() {
    const tech = document.getElementById("marketFilterTech").value;
    const category = document.getElementById("marketFilterCategory").value;
    renderMarketplace(tech, category);
  }

  // Biblioteca
  const libFilters = document.querySelectorAll(".pill-filter");
  libFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      libFilters.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-lib-filter");
      renderLibrary(filter);
    });
  });

  // Busca Global Inteligente
  document.getElementById("globalSearch").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length > 2) {
      showNotification(`Pesquisando por: "${query}" em todo o ecossistema...`);
      // Simula direcionamento automático
      if (query.includes("weg") || query.includes("siemens") || query.includes("expositores") || query.includes("fornecedor")) {
        switchView("marketplace");
        document.getElementById("globalSearch").value = "";
      } else if (query.includes("palestra") || query.includes("vídeo") || query.includes("e-book")) {
        switchView("library");
        document.getElementById("globalSearch").value = "";
      } else if (query.includes("conectar") || query.includes("diretor") || query.includes("especialistas")) {
        switchView("networking");
        document.getElementById("globalSearch").value = "";
      }
    }
  });
}

// LÓGICA DO ASSISTENTE DE IA INTELIGENTE
function setupChat() {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messagesBox = document.getElementById("chatMessages");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const txt = input.value.trim();
    if (txt) {
      addMessage(txt, "user");
      input.value = "";
      addXP(10, "fez pergunta ao Assistente IA");
      
      // Simula pensamento e resposta da IA
      setTimeout(() => {
        const response = getIaResponse(txt);
        addMessage(response, "bot");
      }, 1000);
    }
  });

  function addMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.className = `ia-chat-message-bubble ${sender}`;
    bubble.innerHTML = text;
    messagesBox.appendChild(bubble);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
}

function getIaResponse(prompt) {
  const txt = prompt.toLowerCase();
  
  if (txt.includes("iot") || txt.includes("preditiva") || txt.includes("sensor")) {
    return `Com base na sua dúvida sobre IoT e Manutenção Preditiva: 
    <br><br>
    Recomendo visitar o estande da <strong>WEG Equipamentos</strong> (Stand A-12), pioneira com a solução <strong>WEG Motor Scan</strong>, e da <strong>Bosch Rexroth</strong> (Stand A-02), que oferece a central modular de óleo IoT <strong>CytroBox</strong>. 
    <br><br>
    Você também pode assistir ao workshop da <em>Siemens Academy</em> na aba <strong>Biblioteca</strong>. Deseja agendar um match direto com estas empresas?`;
  }
  
  if (txt.includes("fornecedor") || txt.includes("expositor") || txt.includes("empresa") || txt.includes("comprar")) {
    return `Temos ${MOCK_EXHIBITORS.length} fornecedores industriais premium ativos no momento. 
    <br><br>
    - Para motores e eficiência energética: <strong>WEG Equipamentos</strong>.
    - Para automação de linhas e sistemas MES: <strong>Siemens Brasil</strong>.
    - Para braços articulados e robôs industriais: <strong>Kuka Robótica</strong>.
    <br><br>
    Deseja que eu filtre o catálogo ou faça o agendamento de uma reunião B2B com algum deles?`;
  }

  if (txt.includes("especialista") || txt.includes("conectar") || txt.includes("networking") || txt.includes("pessoa")) {
    return `Encontrei conexões estratégicas para você na nossa comunidade:
    <br><br>
    - <strong>Eduardo Santos</strong> (Diretor de IoT na WEG)
    - <strong>Mariana Schmidt</strong> (Mentora de Indústria 4.0 na Ápice)
    <br><br>
    Você gostaria de enviar uma solicitação de conexão direta agora mesmo?`;
  }

  if (txt.includes("palestra") || txt.includes("workshop") || txt.includes("curso") || txt.includes("conteúdo")) {
    return `Temos ótimos conteúdos gravados disponíveis na <strong>Biblioteca</strong>:
    <br><br>
    - <em>Liderança Exponencial na Indústria 4.0</em> (Aula Magna da Ápice)
    - <em>Implementação de Gêmeos Digitais</em> (Siemens)
    - <em>Guia de Eficiência Energética</em> (E-book WEG)
    <br><br>
    Deseja abrir a Biblioteca para escolher?`;
  }

  return `Entendi o seu interesse sobre "${prompt}". Como assistente inteligente do ecossistema Ápice + Expo Industrial Sul, posso ajudar você a formular soluções, indicar fornecedores específicos de tecnologias industriais 4.0 ou preparar uma agenda personalizada para a feira em Novembro.`;
}

// CRIAÇÃO DE POSTS NO FEED
function setupPostCreation() {
  const publishBtn = document.getElementById("publishPostBtn");
  const input = document.getElementById("postInput");

  publishBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (text) {
      const newPost = {
        id: MOCK_FEED.length + 1,
        author: "Victor Almeida",
        role: "Diretor Industrial na SulMotores",
        time: "Agora mesmo",
        body: text,
        likes: 0,
        comments: 0,
        isLiked: false,
        tag: "Membro Premium"
      };

      MOCK_FEED.unshift(newPost);
      input.value = "";
      renderFeed();
      addXP(50, "publicou um case de sucesso técnico");
    }
  });
}

// SIMULAÇÃO DE SCANNER DE QR CODE (CREDENCIAL DE VISITANTES E EXPOSITORES)
function setupQrScanner() {
  const openBtn = document.getElementById("openScannerBtn");
  const modal = document.getElementById("scannerModal");
  const simBtn = document.getElementById("triggerScanSim");

  openBtn.addEventListener("click", () => {
    modal.showModal();
  });

  // Fallback manual para light-dismiss no scannerModal
  if (modal && !('closedBy' in HTMLDialogElement.prototype)) {
    modal.addEventListener('click', (event) => {
      if (event.target !== modal) return;
      const rect = modal.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isDialogContent) modal.close();
    });
  }

  simBtn.addEventListener("click", () => {
    // Escolhe um profissional aleatório da rede para simular detecção
    const randomProfiles = [
      { name: "Guilherme Werner", company: "WEG Motores", role: "Especialista em Vibração" },
      { name: "Luciana Costa", company: "Kuka Robótica", role: "Líder de Contratos B2B" },
      { name: "Ricardo Fraga", company: "Ápice Educação", role: "Diretor de Programas MBA" }
    ];

    const detected = randomProfiles[Math.floor(Math.random() * randomProfiles.length)];
    
    // Adiciona ao networking mockado se não existir
    if (!MOCK_NETWORKING.some(u => u.name === detected.name)) {
      MOCK_NETWORKING.push({
        id: MOCK_NETWORKING.length + 1,
        name: detected.name,
        company: detected.company,
        role: detected.role,
        roleKey: "especialista",
        segment: "automacao",
        state: "SC",
        city: "Joinville",
        avatar: detected.name.split(" ").map(n => n[0]).join("")
      });
    }

    modal.close();
    
    showNotification(`QR Code detectado com sucesso!`);
    setTimeout(() => {
      connectUser(detected.name);
      addXP(100, `escanou credencial física de ${detected.name}`);
      renderNetworking();
    }, 800);
  });
}
