"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./presentation.module.css";

const TOTAL_SLIDES = 10;

const symplaFields = [
  ["Nome", "Disponível", "ok"],
  ["Cargo", "Disponível", "ok"],
  ["Empresa", "Disponível", "ok"],
  ["WhatsApp", "Disponível", "ok"],
  ["Cidade / Estado", "Disponível", "ok"],
  ["Finalidade na feira", "Não coletada hoje", "missing"],
] as const;

const deliveryPhases = [
  {
    step: "01",
    title: "Fundação segura",
    copy: "Resolver o QR no servidor, vincular equipes aos expositores e sincronizar todos os inscritos aprovados.",
  },
  {
    step: "02",
    title: "Experiência de campo",
    copy: "Scanner exclusivo do expositor, confirmação do contato, deduplicação e tratamento de internet instável.",
  },
  {
    step: "03",
    title: "Piloto controlado",
    copy: "Teste com crachás reais, múltiplos vendedores, portal de leads e exportação para CRM.",
  },
] as const;

export default function ScannerPresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);

  const goToSlide = useCallback((index: number) => {
    const target = Math.max(0, Math.min(TOTAL_SLIDES - 1, index));
    document
      .getElementById(`slide-${target + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const slides = Array.from(deckRef.current?.querySelectorAll<HTMLElement>("[data-slide]") ?? []);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.slide);
        if (Number.isFinite(index)) setCurrentSlide(index);
      },
      { root: deckRef.current, threshold: [0.45, 0.7] },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goToSlide(currentSlide + 1);
      }
      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToSlide(currentSlide - 1);
      }
      if (event.key === "Home") goToSlide(0);
      if (event.key === "End") goToSlide(TOTAL_SLIDES - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentSlide, goToSlide]);

  return (
    <main className={styles.presentationShell}>
      <header className={styles.topRail}>
        <a className={styles.brand} href="#slide-1" onClick={() => goToSlide(0)}>
          <Image
            src="/logo-expoindustrial.png"
            alt="ExpoIndustrial Sul"
            width={138}
            height={30}
            priority
          />
          <span>Scanner de Crachá</span>
        </a>

        <div className={styles.railMeta}>
          <span>Reunião de alinhamento</span>
          <strong>André L. A. Bastos</strong>
        </div>

        <button className={styles.printButton} type="button" onClick={() => window.print()}>
          Imprimir / PDF
        </button>
      </header>

      <nav className={styles.progressNav} aria-label="Navegação dos slides">
        {Array.from({ length: TOTAL_SLIDES }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Ir para o slide ${index + 1}`}
            aria-current={currentSlide === index ? "page" : undefined}
            className={currentSlide === index ? styles.progressDotActive : styles.progressDot}
            onClick={() => goToSlide(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </nav>

      <div className={styles.deck} ref={deckRef}>
        <section
          id="slide-1"
          data-slide="0"
          className={`${styles.slide} ${styles.heroSlide}`}
        >
          <div className={styles.industrialGrid} />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>ExpoIndustrial Sul 2026 · Reunião de produto</p>
            <h1>
              Do crachá
              <br />
              ao <em>lead qualificado.</em>
            </h1>
            <p className={styles.heroLead}>
              Como transformar o QR Code da Sympla na principal ferramenta comercial dos
              expositores durante a feira.
            </p>
          </div>

          <div className={styles.heroStatus}>
            <span className={styles.statusLight} />
            <div>
              <small>Diagnóstico atual</small>
              <strong>Base técnica validada.</strong>
              <span>Integração ainda não pronta para operação.</span>
            </div>
          </div>

          <div className={styles.scrollHint}>
            <span>Use as setas</span>
            <b>↓</b>
          </div>
        </section>

        <section
          id="slide-2"
          data-slide="1"
          className={`${styles.slide} ${styles.lightSlide}`}
        >
          <div className={styles.slideHeading}>
            <p className={styles.sectionNumber}>01 / A experiência desejada</p>
            <h2>Uma leitura. Um contato completo. Zero digitação.</h2>
          </div>

          <div className={styles.journey}>
            <article className={styles.journeyStep}>
              <span className={styles.stepIndex}>01</span>
              <div className={styles.phoneMock}>
                <div className={styles.phoneTop} />
                <div className={styles.scanFrame}>
                  <span />
                </div>
                <small>Captar lead</small>
              </div>
              <h3>Expositor abre o scanner</h3>
              <p>Acesso exclusivo da equipe vinculada ao estande.</p>
            </article>

            <div className={styles.journeyArrow}>→</div>

            <article className={styles.journeyStep}>
              <span className={styles.stepIndex}>02</span>
              <div className={styles.badgeMock}>
                <span>VISITANTE</span>
                <b>Marina Costa</b>
                <small>Gerente de Suprimentos</small>
                <div className={styles.qrCode} aria-hidden="true" />
              </div>
              <h3>Escaneia o crachá Sympla</h3>
              <p>Impresso ou apresentado na tela do visitante.</p>
            </article>

            <div className={styles.journeyArrow}>→</div>

            <article className={styles.journeyStep}>
              <span className={styles.stepIndex}>03</span>
              <div className={styles.leadMock}>
                <span className={styles.leadCheck}>✓</span>
                <div>
                  <small>Lead salvo</small>
                  <b>Marina Costa</b>
                  <span>Cargo · Empresa · Finalidade</span>
                </div>
              </div>
              <h3>Contato aparece no portal</h3>
              <p>Pronto para WhatsApp, CSV e integração com CRM.</p>
            </article>
          </div>
        </section>

        <section
          id="slide-3"
          data-slide="2"
          className={`${styles.slide} ${styles.darkSlide}`}
        >
          <div className={styles.slideHeading}>
            <p className={styles.sectionNumber}>02 / O que já funciona</p>
            <h2>A fundação existe — e foi validada.</h2>
          </div>

          <div className={styles.capabilityGrid}>
            {[
              ["Câmera", "Expo SDK 56", "Leitura de QR configurada para Android e iPhone."],
              ["Sympla", "API respondendo", "Participantes, QR, cargo, empresa e WhatsApp disponíveis."],
              ["Firestore", "Modelo iniciado", "Índice por hash e coleção de leads já existem."],
              ["Portal", "Gestão comercial", "Lista em tempo real, WhatsApp e exportação CSV prontas."],
            ].map(([label, title, copy], index) => (
              <article key={label} className={styles.capabilityCard}>
                <span className={styles.cardIndex}>{String(index + 1).padStart(2, "0")}</span>
                <small>{label}</small>
                <h3>{title}</h3>
                <p>{copy}</p>
                <div className={styles.validationLine}>
                  <span>✓</span> Validado
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="slide-4"
          data-slide="3"
          className={`${styles.slide} ${styles.dataSlide}`}
        >
          <div className={styles.slideHeading}>
            <p className={styles.sectionNumber}>03 / Retrato do ambiente real</p>
            <h2>Os dados existem. A ponte ainda não.</h2>
            <p className={styles.headingNote}>Verificação realizada em 30 de julho de 2026.</p>
          </div>

          <div className={styles.metricsGrid}>
            <article className={styles.metricCard}>
              <strong>31</strong>
              <span>inscritos aprovados na Sympla</span>
              <small>API do evento 3486582</small>
            </article>
            <article className={styles.metricCard}>
              <strong>31</strong>
              <span>QR Codes disponíveis</span>
              <small>100% dos aprovados consultados</small>
            </article>
            <article className={`${styles.metricCard} ${styles.metricAlert}`}>
              <strong>0</strong>
              <span>QR Codes resolvíveis no Firestore</span>
              <small>Resultado atual: “QR Code inválido”</small>
            </article>
            <article className={styles.metricCard}>
              <strong>
                2<span>/7</span>
              </strong>
              <span>expositores publicados com proprietário</span>
              <small>5 ainda sem conta vinculada</small>
            </article>
          </div>

          <div className={styles.dataConclusion}>
            <span>Conclusão</span>
            <p>
              A leitura física pode acontecer, mas o sistema ainda não consegue transformar o
              código em um lead pertencente à empresa correta.
            </p>
          </div>
        </section>

        <section
          id="slide-5"
          data-slide="4"
          className={`${styles.slide} ${styles.lightSlide}`}
        >
          <div className={styles.slideHeading}>
            <p className={styles.sectionNumber}>04 / Limitação atual</p>
            <h2>Hoje, o QR só funciona depois de cinco condições.</h2>
          </div>

          <div className={styles.conditionFlow}>
            {[
              ["1", "Inscrição sincronizada", "O participante precisa existir no Firestore."],
              ["2", "Mesmo e-mail", "A conta do app deve usar o e-mail informado na Sympla."],
              ["3", "Conta criada", "Quem nunca instalou o app ainda não pode ser identificado."],
              ["4", "Perfil aberto", "A associação só é publicada ao abrir “Meu Crachá”."],
              ["5", "Expositor autenticado", "A leitura depende de internet e sessão ativa."],
            ].map(([number, title, copy]) => (
              <article key={number} className={styles.conditionItem}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.warningBand}>
            <strong>O efeito prático:</strong>
            <span>
              o expositor não consegue captar diretamente quem apenas se cadastrou na Sympla —
              justamente o cenário mais comum no pavilhão.
            </span>
          </div>
        </section>

        <section
          id="slide-6"
          data-slide="5"
          className={`${styles.slide} ${styles.fieldSlide}`}
        >
          <div className={styles.slideHeading}>
            <p className={styles.sectionNumber}>05 / Qualidade do lead</p>
            <h2>Temos contato e cargo. Falta intenção de compra.</h2>
          </div>

          <div className={styles.fieldLayout}>
            <div className={styles.fieldTable}>
              {symplaFields.map(([field, status, tone]) => (
                <div key={field} className={styles.fieldRow}>
                  <span>{field}</span>
                  <strong className={tone === "ok" ? styles.fieldOk : styles.fieldMissing}>
                    {tone === "ok" ? "✓" : "!"} {status}
                  </strong>
                </div>
              ))}
            </div>

            <aside className={styles.decisionCard}>
              <span className={styles.decisionLabel}>Decisão de produto</span>
              <h3>Onde coletar a finalidade da visita?</h3>
              <div className={styles.optionMuted}>
                <small>Opção A</small>
                <b>Apenas no app</b>
                <p>Mais detalhado, mas exclui quem não criar conta.</p>
              </div>
              <div className={styles.optionRecommended}>
                <small>Recomendação</small>
                <b>Campo objetivo na Sympla</b>
                <p>Cobre todos os inscritos e já chega associado ao crachá.</p>
              </div>
            </aside>
          </div>
        </section>

        <section
          id="slide-7"
          data-slide="6"
          className={`${styles.slide} ${styles.architectureSlide}`}
        >
          <div className={styles.slideHeading}>
            <p className={styles.sectionNumber}>06 / Arquitetura proposta</p>
            <h2>Resolver no servidor. Entregar somente o necessário.</h2>
          </div>

          <div className={styles.architectureFlow}>
            <article>
              <span className={styles.archIcon}>▦</span>
              <small>01</small>
              <h3>Scanner do expositor</h3>
              <p>Usuário e empresa validados.</p>
            </article>
            <div className={styles.flowConnector}>
              <span>QR criptografado</span>
              <i>→</i>
            </div>
            <article className={styles.serverNode}>
              <span className={styles.archIcon}>◆</span>
              <small>02</small>
              <h3>Serviço seguro</h3>
              <p>Hash, validação e deduplicação.</p>
            </article>
            <div className={styles.flowConnector}>
              <span>Lead autorizado</span>
              <i>→</i>
            </div>
            <article>
              <span className={styles.archIcon}>◎</span>
              <small>03</small>
              <h3>Portal da empresa</h3>
              <p>Contato, contexto e exportação.</p>
            </article>
          </div>

          <div className={styles.architectureBenefits}>
            <span>Sem depender do app do visitante</span>
            <span>Múltiplos vendedores por expositor</span>
            <span>Lead ligado ao estande correto</span>
            <span>Dados protegidos e auditáveis</span>
          </div>
        </section>

        <section
          id="slide-8"
          data-slide="7"
          className={`${styles.slide} ${styles.darkSlide}`}
        >
          <div className={styles.slideHeading}>
            <p className={styles.sectionNumber}>07 / Segurança e operação</p>
            <h2>Uma funcionalidade principal precisa resistir ao dia da feira.</h2>
          </div>

          <div className={styles.guardrailGrid}>
            {[
              ["Acesso por equipe", "Cada vendedor possui login próprio, vinculado ao mesmo expositor."],
              ["QR local", "O crachá digital deixa de enviar a credencial para serviço externo."],
              ["Webhook protegido", "Segredo obrigatório, validação da origem e logs sem dados pessoais."],
              ["Internet instável", "Fila de tentativas e feedback claro quando a rede oscilar."],
              ["Titularidade", "Códigos antigos são invalidados quando o ingresso muda de titular."],
              ["Rastreabilidade", "Data, vendedor, expositor e estande registrados em cada leitura."],
            ].map(([title, copy], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="slide-9"
          data-slide="8"
          className={`${styles.slide} ${styles.deliverySlide}`}
        >
          <div className={styles.slideHeading}>
            <p className={styles.sectionNumber}>08 / Caminho de entrega</p>
            <h2>Três etapas até o piloto no pavilhão.</h2>
          </div>

          <div className={styles.deliveryTrack}>
            {deliveryPhases.map((phase) => (
              <article key={phase.step}>
                <span>{phase.step}</span>
                <h3>{phase.title}</h3>
                <p>{phase.copy}</p>
              </article>
            ))}
          </div>

          <div className={styles.acceptancePanel}>
            <span>Critério de “pronto”</span>
            <ul>
              <li>QR de um inscrito que nunca abriu o app gera lead.</li>
              <li>O lead aparece apenas para a empresa autorizada.</li>
              <li>Duas leituras do mesmo crachá não duplicam o contato.</li>
              <li>Cargo, empresa, finalidade e origem ficam disponíveis no portal.</li>
              <li>Fluxo validado em Android e iPhone com crachá real.</li>
            </ul>
          </div>
        </section>

        <section
          id="slide-10"
          data-slide="9"
          className={`${styles.slide} ${styles.finalSlide}`}
        >
          <div className={styles.finalKicker}>Decisões para a reunião</div>
          <h2>O que precisamos aprovar para avançar.</h2>

          <div className={styles.decisionGrid}>
            <article>
              <span>01</span>
              <h3>QR direto da Sympla</h3>
              <p>Funcionamento independente da criação de conta no app.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Finalidade no cadastro</h3>
              <p>Adicionar uma pergunta objetiva ao formulário da Sympla.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Equipe por expositor</h3>
              <p>Permitir vários vendedores com acessos individuais.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Piloto em campo</h3>
              <p>Selecionar expositores e crachás reais para homologação.</p>
            </article>
          </div>

          <div className={styles.finalStatement}>
            <span>Recomendação</span>
            <p>
              Tratar o scanner como infraestrutura comercial crítica do evento — com operação
              simples na ponta e validação segura no servidor.
            </p>
          </div>

          <footer className={styles.finalFooter}>
            <Image src="/logo-expoindustrial.png" alt="" width={122} height={26} />
            <div>
              <strong>ExpoIndustrial Sul 2026</strong>
              <span>Scanner de crachá · Captação inteligente de leads</span>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
