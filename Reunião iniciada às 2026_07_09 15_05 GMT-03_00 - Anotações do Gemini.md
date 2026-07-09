# **📝 Observações**

jul. 9, 2026

## **Reunião em 9 de jul. de 2026 às 15:05 GMT-03:00**

Registros da reunião [Transcrição](https://docs.google.com/document/d/1qpQi9lqnVMStmx--VNzkbXEnZnX3PO4FgM6H6To4u_4/edit?usp=drive_web&tab=t.eqqzrdceq88r) 

### **Resumo**

Reunião definiu integrações essenciais com plataformas externas e priorizou funcionalidades principais do aplicativo sobre novas propostas.

**Integrações e Inteligência Artificial**  
A integração com plataformas de gestão permitirá automatizar logins e acessos dos usuários. O uso de inteligência artificial na prospecção foi identificado como um ganho significativo de eficiência operacional.

**Funcionalidades e Navegação Aplicativo**  
Configurações de privacidade garantem consentimento explícito para trocas de dados entre participantes. O painel administrativo permitirá gerenciar estandes e o envio de notificações programadas de forma eficiente.

**Priorização do Desenvolvimento Técnico**  
A decisão tomada foi priorizar o desenvolvimento das funcionalidades essenciais do aplicativo, reservando propostas educacionais para uma fase posterior. Processos de registro simplificados facilitarão o fluxo de entrada.

### **Próximas etapas**

- [ ] \[Victor Almeida Jeremias\] Atualizar Aplicativo: Atualizar a versão do aplicativo e do painel do expositor. Integrar as informações mais recentes e corrigir os dados desatualizados.

- [ ] \[Victor Almeida Jeremias\] Corrigir Visualização Mapa: Corrigir a sobreposição do modal no módulo de mapa. Garantir que as informações dos estandes apareçam corretamente sobre o menu.

- [ ] \[Victor Almeida Jeremias\] Configurar Notificações Agendadas: Habilitar o agendamento prévio de notificações no painel administrativo. Configurar campos para título, mensagem e horários de disparo automáticos.

- [ ] \[Victor Almeida Jeremias\] Verificar Link Pagamento: Investigar a integração do link de redirecionamento de pagamento no R gestor. Validar o fluxo de inscrição para usuários após a confirmação do pagamento.

- [ ] \[Victor Almeida Jeremias\] Enviar link cadastro: Enviar o link para que os expositores preencham os dados da empresa.

- [ ] \[Victor Almeida Jeremias\] Atualizar página tarefas: Incluir a lista de atividades pendentes e uma área para comentários na página.

- [ ] \[André L.A. Bastos\] Validar informações: Validar os dados do sistema e enviar áudio com as correções necessárias.

- [ ] \[André L.A. Bastos\] Analisar link app: Visualizar o link para identificar as alterações necessárias no aplicativo.

- [ ] \[Victor Almeida Jeremias\] Automatizar envio e-mail: Implementar o envio automático do link de download do aplicativo por e-mail após a inscrição.

- [ ] \[Victor Almeida Jeremias\] Realizar deploy: Executar o envio das atualizações pendentes do sistema.

### **Detalhes**

* **Prospecção com Inteligência Artificial**: André e Victor discutem uma ferramenta de prospecção baseada em Inteligência Artificial que automatiza a busca por contatos em redes sociais. Eles concordam que a ferramenta aumenta drasticamente a produtividade, operando continuamente para identificar perfis qualificados, o que altera significativamente a dinâmica atual de prospecção manual no LinkedIn ([00:00:45](#00:00:45)). Eles refletem sobre o potencial de mercado dessa tecnologia e o hiato entre as possibilidades técnicas e a adoção atual pelo mercado ([00:10:20](#00:10:20)) ([00:12:06](#00:12:06)).

* **Integração do Aplicativo com Simpla e R Gestor**: Victor demonstra o aplicativo em desenvolvimento, focando na integração com a plataforma Simpla para o acesso de usuários. Eles definem que o aplicativo deve suportar o login tanto para visitantes quanto para expositores, aproveitando as credenciais já existentes ([00:13:49](#00:13:49)). A integração com a interface de programação de aplicações (API) do Simpla foi confirmada, permitindo a geração de códigos QR para crachás, além da conexão com o sistema R Gestor para o gerenciamento de listas de participantes e liberação de conteúdos ([00:16:40](#00:16:40)).

* **Proposta de Módulo Educacional**: Victor apresenta uma ideia para um módulo educacional voltado para a Febracisa, que utilizaria Inteligência Artificial para transcrever as falas de professores em tempo real, gerar resumos automáticos e criar atividades de fixação com um sistema de ranking para engajar os alunos ([00:21:17](#00:21:17)). André reconhece a relevância da proposta, mas decide priorizar o desenvolvimento das funcionalidades principais do aplicativo neste momento, reservando a discussão sobre este módulo para uma etapa posterior ([00:22:17](#00:22:17)).

* **Autenticação e Registro de Usuários**: Eles discutem o fluxo de login dos usuários, estabelecendo que o aplicativo deve puxar automaticamente as informações preenchidas na inscrição via Simpla, para evitar a necessidade de preenchimento manual de dados. O objetivo é facilitar o acesso e melhorar a experiência do usuário ([00:22:17](#00:22:17)).

* **Funcionalidades de Networking e Privacidade**: Victor apresenta a área de networking do aplicativo, onde usuários podem se conectar com outros participantes da feira. André enfatiza a importância da privacidade, solicitando que o compartilhamento de dados pessoais seja configurado como não autorizado por padrão, exigindo consentimento explícito do usuário para trocar informações ([00:25:04](#00:25:04)).

* **Exibição de Perfis de Expositores**: Sobre as páginas dos expositores, André sugere que o conteúdo seja simplificado, contendo links para o site da empresa, perfil no LinkedIn e Instagram, em vez de vídeos. Victor concorda em ajustar a interface para refletir essas preferências de exibição ([00:30:27](#00:30:27)).

* **Funcionalidades de Mapa e Conectividade**: Victor detalha o desenvolvimento do mapa da feira dentro do aplicativo. Eles validam a disponibilidade de rede 4G no local do evento, o que permitirá o uso eficiente das funcionalidades do mapa em 2D. O sistema permitirá que o usuário clique em estandes e visualize informações detalhadas através de janelas modais ([00:31:19](#00:31:19)).

* **Painel Administrativo do Organizador**: Victor demonstra o painel de controle administrativo, que permitirá a André gerenciar o evento. Este painel inclui a capacidade de associar empresas aos números dos estandes, atualizar logotipos de patrocinadores e disponibilizar materiais para download ([00:33:09](#00:33:09)) ([00:42:27](#00:42:27)).

* **Gestão de Notificações e Avisos**: Foi discutida a implementação de uma funcionalidade de avisos no painel administrativo. Victor e André concordam que o sistema deve permitir o envio de notificações, incluindo a possibilidade de pré-programar avisos (como contagens regressivas para o evento) para que sejam disparados automaticamente em horários definidos ([00:45:58](#00:45:58)).

* **Processo de Inscrição e Contratos**: André esclarece a diferença nos processos de registro: visitantes se inscrevem via R Gestor, enquanto a participação de expositores é tratada via contrato direto. Após a finalização do cadastro, o sistema deve enviar um link automático para que os expositores insiram os dados de suas empresas ([00:48:19](#00:48:19)).

* **Próximos Passos e Testes**: Victor compromete-se a atualizar o link do aplicativo com as novas versões e correções de layout para que André possa testar a interface. André se compromete a validar as informações e enviar feedbacks através de áudios para ajustes finais. Além disso, eles planejam automatizar o envio de e-mails de confirmação com o link de download do aplicativo para os usuários após a inscrição no Simpla ([00:49:09](#00:49:09)).

*Revise as anotações do Gemini para checar se estão corretas. [Confira dicas e saiba como o Gemini faz anotações](https://support.google.com/meet/answer/14754931)*

*Como está a qualidade de **destas observações?** [Responda a uma breve pesquisa](https://google.qualtrics.com/jfe/form/SV_9vK3UZEaIQKKE7A?confid=spyabLhD-QykL117qzepDxIWOAIIigIgABgFCA&detailid=standard&screenshot=false) para nos dar seu feedback, incluindo o quanto as observações foram úteis para o que você precisa.*

# **📖 Transcrição**

jul. 9, 2026

## **Reunião em 9 de jul. de 2026 às 15:05 GMT-03:00 \- Transcrição**

### **00:00:45** {#00:00:45}

**Victor Almeida Jeremias:** He. O que Ah.

**André L.A. Bastos:** E aí?

**Victor Almeida Jeremias:** André,

**André L.A. Bastos:** E aí, queridão? Como é que você tá? Tudo bem?

**Victor Almeida Jeremias:** tudo certo, graças a Deus.

**André L.A. Bastos:** Tudo joia?

**Victor Almeida Jeremias:** aí,

**André L.A. Bastos:** Correndo aqui, cara. Rapaz, aquilo ali que eu aquilo ali que eu te passe Sei do ele ele faz uma prospecção, cara.

**Victor Almeida Jeremias:** Угу.

**André L.A. Bastos:** Aí, tipo assim, ele procura na rede gente que tem aí o perfil que me interessa, ele gera uma mensagem, faz um uma contato com o cara. Assim, eu achei muito mirabolante, quer dizer, simples. É simples. Do ponto de vista da IA é simples, né? do ponto de vista da IA é simples. Eh, só não sei se realmente funciona, né? Esse é o ponto que eu queria saber. Por isso que eu te mandei ver se tu conhece alguma coisa similar ou enfim,

### **00:09:40**

**Victor Almeida Jeremias:** Pô,

**André L.A. Bastos:** por isso que eu te mandei,

**Victor Almeida Jeremias:** mas é legal a ideia do cara, hein, da empresa aí. Bem

**André L.A. Bastos:** cara. Olha,

**Victor Almeida Jeremias:** bacana.

**André L.A. Bastos:** olha. Realmente bem interessante, cara. Bem interessante, cara. Bem fiquei de cara.

**Victor Almeida Jeremias:** E vou te dizer que não é muito difícil de fazer não, cara. Não dá para fazer isso aí.

**André L.A. Bastos:** É,

**Victor Almeida Jeremias:** Ideia genial do cara, hein?

**André L.A. Bastos:** pô, cara, isso aí

**Victor Almeida Jeremias:** Vai ajudar bastante tu na tu achar os leads aí, certo?

**André L.A. Bastos:** muito,

**Victor Almeida Jeremias:** Divulgar.

**André L.A. Bastos:** muito, cara, muito. E isso aí dá, pô. Pois é,

**Victor Almeida Jeremias:** Imagina.

**André L.A. Bastos:** só não sei se só não sei se funciona, né, cara? Só não sei se funciona, mas vai sair muita coisa ainda com essa inteligência artificial.

### **00:10:20** {#00:10:20}

**André L.A. Bastos:** Mas sai muita coisa ainda, hein?

**Victor Almeida Jeremias:** Vai, vai. Não, agora tá tá um um um ao meu ver,

**André L.A. Bastos:** O

**Victor Almeida Jeremias:** tá um gap gigante assim entre o que que dá para fazer e o que que já está sendo feito. Então o que que as pessoas já sabem, o que que é possível fazer. Então tem um gap que dá para explorar isso aí, tipo criar alguma algum serviço pro pessoal

**André L.A. Bastos:** Uhum. Sim,

**Victor Almeida Jeremias:** pegar essa onda, surfar essa onda e tá,

**André L.A. Bastos:** cara.

**Victor Almeida Jeremias:** é demais, né?

**André L.A. Bastos:** É,

**Victor Almeida Jeremias:** É bizarro.

**André L.A. Bastos:** é, é, é assim, a produtividade aumenta. Eu tô, tô aqui que passando um cafezinho. A produtividade aumenta drasticamente, né, cara?

**Victor Almeida Jeremias:** Nossa,

**André L.A. Bastos:** Drasticamente.

**Victor Almeida Jeremias:** imagina já vai ter o link certo,

**André L.A. Bastos:** Drasticamente.

**Victor Almeida Jeremias:** já vai ter o perfil ali qualificado.

**André L.A. Bastos:** É, é exatamente.

### **00:11:10**

**André L.A. Bastos:** Pô, pra gente hoje aqui é pra gente hoje aqui é maior maior trabalho. Que tipo assim, ó, eu vou lá no LinkedIn aí eu vi e vejo quem

**Victor Almeida Jeremias:** Sol.

**André L.A. Bastos:** tem quem tem mat com quem tem fit, né, com com a a minha solução com a questão da feira. Aí eu mando convite pro cara. Se o cara aceitar, aí eu mando uma mensagem para ele, né?

**Victor Almeida Jeremias:** Aha.

**André L.A. Bastos:** p\*\*\*\*, bicho, aí é louco. E ali o cara trabalhando, fica 24 horas. E isso tudo eu perco tempo, né,

**Victor Almeida Jeremias:** Sim,

**André L.A. Bastos:** Vittor?

**Victor Almeida Jeremias:** sim. Imagina o tempo é valioso

**André L.A. Bastos:** É. E a Exato.

**Victor Almeida Jeremias:** também.

**André L.A. Bastos:** E aí o que que acontece? A ferramenta ali, a ferramenta ela ela faz automaticamente, cara. M. e trabalha 24 horas por dia, s dias por semana, entendeu?

### **00:12:06** {#00:12:06}

**André L.A. Bastos:** É, é desumano. É desumano, cara. Acho que eu acho que o os negócios vão mudar drasticamente com isso tudo, né, cara?

**Victor Almeida Jeremias:** Não tem como, né? O cara, o,

**André L.A. Bastos:** Com É,

**Victor Almeida Jeremias:** o, o empreendedor tem que ficar atualizado, tem que, senão vai ficar para trás em cada coisa bizarra que dá para fazer hoje em dia.

**André L.A. Bastos:** é, é, é, é,

**Victor Almeida Jeremias:** E o mercado tá passando.

**André L.A. Bastos:** é.

**Victor Almeida Jeremias:** Quem não quis ficar para trás já

**André L.A. Bastos:** Sim, sim. Você que tá aí no nesse meio,

**Victor Almeida Jeremias:** era.

**André L.A. Bastos:** Vittor, e bom, tu sabe, tu conhece o meu negócio ali, é a feira, tal, tem o lance da educação também, cara. O que tu tiver de conhecimento nisso aí, que tu, ó, André, tem uma ferramenta assim, assim, assim, pô, me fala, cara, porque eu não eu não consigo acompanhar tudo isso, entendeu? Mas tu que tá aí muito fuçado com essas coisas,

### **00:12:49**

**Victor Almeida Jeremias:** Não deixou.

**André L.A. Bastos:** o que tu souber aí me fala, André, ó, vi uma coisa assim, acho que te interessa, tá? Vamos lá.

**Victor Almeida Jeremias:** Fechou.

**André L.A. Bastos:** Vamos pro nosso PP.

**Victor Almeida Jeremias:** Deixa eu abrir aqui. Pô, eu não sei porque ainda tá falhando aqui. Eh, vai ficar caindo aqui as imagens, mas daí daí tu vai dando os toque aí,

**André L.A. Bastos:** Tá sem problema.

**Victor Almeida Jeremias:** por favor. Não sei porque tá porque dá isso aí na tela inteira. compartilhar então, André. Ah, cara, o bom que o bom que a reunião que tá sendo transcrita e tudo já resume depois, cara. Vira um documento bem legal e eu consigo saber as dores,

**André L.A. Bastos:** Sim,

**Victor Almeida Jeremias:** consigo saber o que que tu quer, o que que eu que eu decidi, quais, enfim. Então, tá bem alinhado já, é bastante coisa. Então esse aqui seria o aplicativo que seria o

**André L.A. Bastos:** Não, não tá não tá não tá na não tá mostrando para mim não.

### **00:13:49** {#00:13:49}

**Victor Almeida Jeremias:** o partilhar tela inteira. Tá, agora foi, né?

**André L.A. Bastos:** Sim,

**Victor Almeida Jeremias:** Tá mostrando o que o aplicativo.

**André L.A. Bastos:** sim.

**Victor Almeida Jeremias:** Fechou.

**André L.A. Bastos:** Ah.

**Victor Almeida Jeremias:** Eu botei uma imagem aqui de exemplo, mas já mais ou menos pode ser a a uma aqui e tal. Eh,

**André L.A. Bastos:** Aha.

**Victor Almeida Jeremias:** eh, uma coisa que, eh, é bom, eu quero pontuar aqui que a para ficar mais claro para mim, a parte de login aqui e aqui o o pessoal baixaria o aplicativo, se já tem um credencial já realizado lá no simple lá, ele vai apertar aqui, acessar credencial e já aparece aqui com o login e a senha dele.

**André L.A. Bastos:** Aha.

**Victor Almeida Jeremias:** Mas o que não ficou claro para mim é pro cara realizar o login, realizar a inscrição, a gente bota aqui também.

**André L.A. Bastos:** Não, pois é,

**Victor Almeida Jeremias:** Ele a inscrição de para

**André L.A. Bastos:** eu eu eu havia até havia falado para você para fazer a inscrição por aí,

**Victor Almeida Jeremias:** stand.

**André L.A. Bastos:** mas não lembra que eu falei para você até que poderia fazer a inscrição por aí, mas na verdade o seguinte, ô, aí vai inutilizar o Simpla, entendeu?

### **00:15:15**

**André L.A. Bastos:** se o se a gente tá pegando os dados lá do Simpla, eh, para participação na

**Victor Almeida Jeremias:** Não, não. Eu digo, eu digo do expositor.

**André L.A. Bastos:** feira, porque do não e e essa credencial,

**Victor Almeida Jeremias:** Угу.

**André L.A. Bastos:** o eh o appro inscrição ali, na verdade é só para o visitante, né? Quer dizer, é o visitante que vai na vai na feira. né? É claro que o expositor também pode acessar o app, óbvio, né? Mais a a

**Victor Almeida Jeremias:** Deixa eu pegar um um lápis, uma caneta aqui. Já vou. Pera aí.

**André L.A. Bastos:** legal.

**Victor Almeida Jeremias:** Desculpa te cortar aí, André.

**André L.A. Bastos:** Sim.

**Victor Almeida Jeremias:** Eu preciso escrever, senão minha mente

**André L.A. Bastos:** Bom, qual é o qual é o esquema do aplicativo?

**Victor Almeida Jeremias:** voa.

**André L.A. Bastos:** O cara, o visitante, tá? Na verdade, o aplicativo é uma grande comunidade onde o visitante e o expositor eh buscam informações, né?

### **00:16:40** {#00:16:40}

**Victor Almeida Jeremias:** Mhm.

**André L.A. Bastos:** Esse é o ponto número um, tá? Eh, então assim, o visitante entra, o expositor também entra no no no aplicativo, né? A ideia ali,

**Victor Almeida Jeremias:** Uhum,

**André L.A. Bastos:** aí temos que ver o que que tem de conteúdo que a gente pode colocar ali,

**Victor Almeida Jeremias:** entendi.

**André L.A. Bastos:** entendeu?

**Victor Almeida Jeremias:** Eh, é só para falar ali, ali a questão do Simpla é deu certo,

**André L.A. Bastos:** Deu certo.

**Victor Almeida Jeremias:** deu certo,

**André L.A. Bastos:** Ah,

**Victor Almeida Jeremias:** deu para integrar lá,

**André L.A. Bastos:** legal.

**Victor Almeida Jeremias:** já apareceu o Qcode, eh, que é gerado lá, já aparece aqui, tipo, é o mesmo. Então, a pessoa pode mostrar o crachá físico ou do

**André L.A. Bastos:** Tá. Mas aí, por exemplo, eh,

**Victor Almeida Jeremias:** celularção.

**André L.A. Bastos:** para eu para eu gerar etiquetas para o crachar do cara.

**Victor Almeida Jeremias:** Ah, vou dá para botar isso também. acredito que dá de ver o crachá do cara, né, da pessoa para imprimir.

### **00:17:44**

**André L.A. Bastos:** É porque assim, ó, o que que acontece ali no Sim?

**Victor Almeida Jeremias:** Uhum.

**André L.A. Bastos:** Por que que eu falo, por que que eu gosto do simples ali? Porque ele gera uma etiqueta com que eu que eu colo lá no

**Victor Almeida Jeremias:** Uhum.

**André L.A. Bastos:** crachá,

**Victor Almeida Jeremias:** Uhum.

**André L.A. Bastos:** entendeu? Então, Eu eu imaginei que ali no que o que o aplicativo ia gerar essa etiqueta

**Victor Almeida Jeremias:** Não.

**André L.A. Bastos:** também.

**Victor Almeida Jeremias:** Então, eh, pro usuários sim. Aí para nós também eu consigo ver isso aí. Eu acho que dá. Dá para até para pesquisar

**André L.A. Bastos:** Vamos pro uso.

**Victor Almeida Jeremias:** aqui.

**André L.A. Bastos:** Senão, senão o que que acontece? Eh, tem a API do Simpla, certo?

**Victor Almeida Jeremias:** Uhum.

**André L.A. Bastos:** E tem a API do do dos eventos lá que você buscou lá no R gestor, lembra?

**Victor Almeida Jeremias:** Isso, isso. Aham.

**André L.A. Bastos:** Tá?

### **00:18:39**

**André L.A. Bastos:** Se eu se eu conseguir buscar eh os os participantes lá do R gestor lá pro Simpla, para mim já tá valendo, porque lá no Simpla, você entendeu? Se eu eu A pergunta é: "Ah, acho que não dá, né?

**Victor Almeida Jeremias:** Não. Eh, dá sim. Eu acho que entendi. Entendi. Eh, uma coisa que deu certo ali também de aproveitar do R gestor é sobre que deu certo para pegar o banco de lados do do R gestor lá e já habilitar aqui no aplicativo. Então, eh, vai ver lá se,

**André L.A. Bastos:** Ótimo.

**Victor Almeida Jeremias:** se os endereços é o mesmo e já vai liberar o conteúdo, os materiais da para aquele usuário da apresentação.

**André L.A. Bastos:** Isso,

**Victor Almeida Jeremias:** E caso o usuário não seja um usuário eh free lá,

**André L.A. Bastos:** isso.

**Victor Almeida Jeremias:** que não tenha pago nada para, né, o visitante ali, já tenha lá um redirecionar pro pagamento do do R gestor, pro link do R gestor para ele se inscrever lá no evento. Aí, inscrevendo lá,

**André L.A. Bastos:** Sim,

**Victor Almeida Jeremias:** a gente já traz eh de forma automática aqui, já libera os conteúdos, tá?

### **00:19:48**

**André L.A. Bastos:** sim.

**Victor Almeida Jeremias:** Ó,

**André L.A. Bastos:** Beleza.

**Victor Almeida Jeremias:** aí eu já botei isso aqui,

**André L.A. Bastos:** Леза.

**Victor Almeida Jeremias:** já da já tá com os eventos reais ali na no aplicativo. Ah, cara, não lembro. Vou, não sei se eu vou lembrar aqui assim do André, tu a tua as tuas aulas da da da pós ali é é feito online

**André L.A. Bastos:** presencial, cara. A gente tá, a gente vai,

**Victor Almeida Jeremias:** presencial.

**André L.A. Bastos:** a gente vai migrar pro online, cara.

**Victor Almeida Jeremias:** Nossa.

**André L.A. Bastos:** A gente vai ter que migrar pro online, porque presencial não tá dando não, cara. E esse ano, esse ano a gente a gente tem uma turma que tá rodando.

**Victor Almeida Jeremias:** e

**André L.A. Bastos:** A gente tem uma turma que tá rodando, mas a a desse ano não abriu, não tinha número suficiente, cara.

**Victor Almeida Jeremias:** E eu eu tô querendo ali um sistema pra Febracisa ali e já

**André L.A. Bastos:** Угу.

**Victor Almeida Jeremias:** pra já pra escola da mãe também para gerar atividade e de acordo com as falas da pessoa, de acordo com as falas do professor.

### **00:21:17** {#00:21:17}

**Victor Almeida Jeremias:** Então, por exemplo,

**André L.A. Bastos:** Ага.

**Victor Almeida Jeremias:** o professor tá lá falando, eh, vai começar o conteúdo, ele liga lá no aplicativo, dá um OK lá, gravar, alguma coisa assim, transcrever. Eh, o aplicativo vai começar a transcrever as falas do professor. Depois da dessa da aula dada, ele vai lá, aperta de novo para parar e já apertando para parar já vai gerar um resumo e atividades,

**André L.A. Bastos:** Так.

**Victor Almeida Jeremias:** tipo 10 atividades de acordo com a transcrição, de acordo com o seu conteúdo que ele deu. E gerando essas eh essa transcrição, gera já 10 atividades. estilo prova ali de quatro alternativas, só uma correta e já mostra lá pro pro aluno. Então já e já mostra pro aluno lá para responder.

**André L.A. Bastos:** Ага.

**Victor Almeida Jeremias:** No final já gera tipo um rankzinho, uma gera deixa o aluno mais engajado, gera um senso de competição.

**André L.A. Bastos:** Ага.

**Victor Almeida Jeremias:** Aí mostra quantos de cada um acertou ou enfim, aí eu poderia, isso é uma ideia, né? Não sei como é que tá aí.

**André L.A. Bastos:** Sim, nós vamos começar sobre isso.

### **00:22:17** {#00:22:17}

**André L.A. Bastos:** Eh, lembra que eu cheguei a falar contigo sobre isso? A gente a gente precisa a gente precisa botar isso. Deixa, vamos só resolver isso primeiro do app no primeiro momento,

**Victor Almeida Jeremias:** Uhum.

**André L.A. Bastos:** mas a gente vai voltar a falar sobre isso, até porque a gente precisa ver essa questão do online,

**Victor Almeida Jeremias:** Fechou.

**André L.A. Bastos:** cara.

**Victor Almeida Jeremias:** Ó, a da e a pessoa fazendo um login. Dá para botar antes, depois aparece isso aqui, personalização aplicativo, tal. Eh, aqui a ideia já puxar do banco de dados lá do do Eu vou botar aqui para já, deixa eu dizer aqui para depois pra transcrição. Já já saber. após o login, já puxar as informações feitas na inscrição via a PI do Simpla para preencher os dados já ocupados lá, pro usuário não precisar eh preencher

**André L.A. Bastos:** Certo. Sim, sim,

**Victor Almeida Jeremias:** novamente,

**André L.A. Bastos:** sim.

**Victor Almeida Jeremias:** tá? É, deixa eu mostrar aqui. Deixa eu ver se já tá com os eventos aqui.

### **00:23:32**

**Victor Almeida Jeremias:** Ó, já aparece. Eu botei assim em um em uns card aqui. Já tá certo aqui os nomes do dos eventos aqui,

**André L.A. Bastos:** Não,

**Victor Almeida Jeremias:** André.

**André L.A. Bastos:** mas aí um detalhe depois a gente o o esse aí tá certo. Não, não tá não, não. Tá bem tá bem diferente. Depois eu depois a gente acerta.

**Victor Almeida Jeremias:** Tá aí.

**André L.A. Bastos:** Hum. Para esse para Tá.

**Victor Almeida Jeremias:** He.

**André L.A. Bastos:** Depois eu vou conseguir entrar nele. Aí eu vejo, ó, por exemplo, tem ali, né? Ah, vagas, tal, tal, tal, tal. Ah, tem um inscrever. Se aí não inscrever vai direto pro site lá do cara.

**Victor Almeida Jeremias:** Isso vai direto lá pro pro gestor ou para ou pro outro

**André L.A. Bastos:** Ótimo. Excelente.

**Victor Almeida Jeremias:** link aí que

**André L.A. Bastos:** Excelente. Excelente. É isso que eu queria queria ver contigo.

### **00:24:17**

**André L.A. Bastos:** Beleza. Os nomes, a única coisa que não tá legal ali são os nomes,

**Victor Almeida Jeremias:** materiais.

**André L.A. Bastos:** mas aí isso aí é detalhe, né?

**Victor Almeida Jeremias:** Pois é, vou dar uma olhadinha. Mas era para ter puxado ali. Mas eh sim. Ah, é daqui também a imagem, não sei se a gente bota uma imagem genérica ou ou se tiver alguma imagem promocional também, a gente bota aqui atrás,

**André L.A. Bastos:** Ó,

**Victor Almeida Jeremias:** mas de menos essas coisas de de

**André L.A. Bastos:** é, aí é só perfumaria, né?

**Victor Almeida Jeremias:** É, exatamente. Eh, enfim, enfim, aqui tem a questão do expositor também a loja e

**André L.A. Bastos:** Não, eu não cai cai caiu,

**Victor Almeida Jeremias:** tal.

**André L.A. Bastos:** caiu o aplicativo. Não tô vendo, não tá vendo não. Agora foi.

**Victor Almeida Jeremias:** Oi.

**André L.A. Bastos:** Vamos lá. Vamos, vamos lá do começo. Vamos lá do começo,

**Victor Almeida Jeremias:** Bora aqui,

### **00:25:04** {#00:25:04}

**André L.A. Bastos:** Vittor.

**Victor Almeida Jeremias:** ó. Pode falar. Eh,

**André L.A. Bastos:** Tá lá.

**Victor Almeida Jeremias:** tá aqui. Então é o aplicativo, seria a homepage do aplicativo.

**André L.A. Bastos:** Aham.

**Victor Almeida Jeremias:** Eh,

**André L.A. Bastos:** Beleza.

**Victor Almeida Jeremias:** ter aqui algumas informaçãozinha. Dá para eh aqui umas informaçãozinha.

**André L.A. Bastos:** Aham. Depois eu mudo algumas informações ali.

**Victor Almeida Jeremias:** Isso, isso. Eu peguei do site aqui, tal, ações rápidas,

**André L.A. Bastos:** Beleza.

**Victor Almeida Jeremias:** vai ter uns atalhos aqui. Eh, aqui a ideia seria do crax aqui seria para para gerar a conexão lá entre o

**André L.A. Bastos:** Aham.

**Victor Almeida Jeremias:** pessoal

**André L.A. Bastos:** Aham. Ali o lead ali é é para eu me conectar com outras pessoas.

**Victor Almeida Jeremias:** e

**André L.A. Bastos:** É isso.

**Victor Almeida Jeremias:** isso é aqui já o os conectado.

**André L.A. Bastos:** Ah,

**Victor Almeida Jeremias:** Vou salvar.

**André L.A. Bastos:** legal.

### **00:25:53**

**André L.A. Bastos:** Que legal. Que legal. Muito bom. Aí eu posso me conectar com outras pessoas

**Victor Almeida Jeremias:** Isso aí,

**André L.A. Bastos:** ali.

**Victor Almeida Jeremias:** pega aqui os contatos que a pessoa fez na feira, já fica meio que organizado,

**André L.A. Bastos:** Aham.

**Victor Almeida Jeremias:** não fica lá solto no WhatsApp.

**André L.A. Bastos:** Aham. Sim,

**Victor Almeida Jeremias:** Eh,

**André L.A. Bastos:** sim, sim. Mas a pessoa lá precisa aceitar, né? a conexão,

**Victor Almeida Jeremias:** inso

**André L.A. Bastos:** porque tipo assim, ó, porque tem a lista ali CSV, significa que o cara vai ter acesso à lista de dos contatos que ele conectar. É isso,

**Victor Almeida Jeremias:** que ele conectar. Aham.

**André L.A. Bastos:** tá? Mas eh então, mas a pessoa tem que permitir, né, ou não?

**Victor Almeida Jeremias:** Eh, eu eu botei não, mas a gente pode botar aqui que

**André L.A. Bastos:** É porque senão porque tipo assim, ó, eh por exemplo,

### **00:26:35**

**Victor Almeida Jeremias:** sim.

**André L.A. Bastos:** ah, eu não quero compartilhar meus lados. Eh, vamos falou: "Tu quis conectar comigo, mas eu não quero conectar contigo. Te acho chato, não quero." Entendeu?

**Victor Almeida Jeremias:** Ah, tá. Aham.

**André L.A. Bastos:** Você tá entendendo?

**Victor Almeida Jeremias:** De boa.

**André L.A. Bastos:** Eh, então, às vezes, ah, não necessariamente vai rolar esse, tipo assim, a menos que OK, eu vou conectar. Aí se eu conectar aí eu passo os dados.

**Victor Almeida Jeremias:** Uhum. Legal. Legal. É o que tu tiver de pontuação, tu vai falando que depois já transcreve aqui as coisas,

**André L.A. Bastos:** É, é isso.

**Victor Almeida Jeremias:** já fico sabendo.

**André L.A. Bastos:** Tem um link em que eu posso baixar já o aplicativo para para olhar esses cantos e te passar pra gente corrigir,

**Victor Almeida Jeremias:** Sim, sim, claro.

**André L.A. Bastos:** tá?

**Victor Almeida Jeremias:** Ó, aqui seria a página de networking que a gente ficou de que eu fiquei de passar ali. É, então tá aqui no no aqui no último última parte aqui de networking.

### **00:27:37**

**Victor Almeida Jeremias:** Aqui a pessoa vai vai ter um como funciona o o matchm match matchmaking. Eh,

**André L.A. Bastos:** Matchmaking.

**Victor Almeida Jeremias:** nosso sistema analisa os perfis para ajudar você em aproveitar o máximo do evento. Tem a tem duas opções. A indicação de estantes, estandes.

**André L.A. Bastos:** Uhum.

**Victor Almeida Jeremias:** Cruzamos seus interesses e gargalos para indicar stands úteis no pavilhão. E tem a outra opção que é networking de pessoas.

**André L.A. Bastos:** Угу.

**Victor Almeida Jeremias:** Sugerimos conexões com outros profissionais da feira para trocar para troca de contatos. Eh, participar do networ de pessoas. Se desativados. Ah, aqui ficou tem um negocinho aqui. Eh, se se a pessoa deseja compartilhar os dados dela para outras pessoas verem tal,

**André L.A. Bastos:** Sim.

**Victor Almeida Jeremias:** se ela ela belita.

**André L.A. Bastos:** Aí no eh default, né? O no default deixa ele não autorizado,

**Victor Almeida Jeremias:** Aham. Certo.

**André L.A. Bastos:** entendeu?

**Victor Almeida Jeremias:** Boa. Hã, aqui acho que tem uns exemplos aqui.

### **00:28:38**

**Victor Almeida Jeremias:** Aqui seria já das pessoas para solicitar conexão.

**André L.A. Bastos:** Mhm.

**Victor Almeida Jeremias:** E é isso que tem que botar porque não deveria aparecer aqui. E sim depois pr informações industrial. botar aqui qualquer coisa só para mostrar

**André L.A. Bastos:** Mhm.

**Victor Almeida Jeremias:** depois. Prcer no match de pessoas permite que outros visitantes encontrem seu perfil sugestões. Revisar dados de contato compartilhar. Ah, isso que também é legal, ó, para aparecer sem divulgar ou divulgar já os dados da pessoa. Aí fez ali, já vai aparecer uma outra página.

**André L.A. Bastos:** Ó, caiu, caiu a visualização aqui. M.

**Victor Almeida Jeremias:** Foi aí que já apareceu a

**André L.A. Bastos:** Voltou.

**Victor Almeida Jeremias:** a as indicações aqui, ó, recomendadas. Eh, no caso são informações fictícias. Aqui ele indicou a vega automação, né? Não sei porquê.

**André L.A. Bastos:** Aham.

**Victor Almeida Jeremias:** Aí tá aqui quais são as áreas que ela, enfim. Aí tem a opção ver no mapa,

**André L.A. Bastos:** Legal.

### **00:30:27** {#00:30:27}

**Victor Almeida Jeremias:** ver o expositor, daí abrir aqui a página dela. Daí a página do do perfil do expositor,

**André L.A. Bastos:** Угуm.

**Victor Almeida Jeremias:** eh, acho que tu tinha falado para tirar o vídeo. E e será que a gente deixa outra? O que que a gente pode deixar aqui na página? Tens alguma sugestão ou só deixar aqui a a apresentação dela?

**André L.A. Bastos:** Eh, eh, no expositor quem vai preencher ele,

**Victor Almeida Jeremias:** Acho que é isso.

**André L.A. Bastos:** né? Quem vai preencher ele?

**Victor Almeida Jeremias:** Aham.

**André L.A. Bastos:** Eu acho que o site, cara, tá de bom tamanho,

**Victor Almeida Jeremias:** É, né? Tá. Deixar sóar o site,

**André L.A. Bastos:** entendeu?

**Victor Almeida Jeremias:** a apresentação dela.

**André L.A. Bastos:** É, deixa o site,

**Victor Almeida Jeremias:** É

**André L.A. Bastos:** é, ou o perfil no LinkedIn ou LinkedIn é site,

**Victor Almeida Jeremias:** OK.

**André L.A. Bastos:** perfil no LinkedIn e Instagram acho de excelente tamanho,

**Victor Almeida Jeremias:** Fechou.

**André L.A. Bastos:** entendeu?

### **00:31:19** {#00:31:19}

**Victor Almeida Jeremias:** Ah, eu botei também aqui um um salvar para futuramente a gente botar uma uma função de ver stands eh favoritos,

**André L.A. Bastos:** Aham. Ah,

**Victor Almeida Jeremias:** enfim,

**André L.A. Bastos:** legal.

**Victor Almeida Jeremias:** tá? Aí teria, teria esse aqui seria o aplicativo. Aí teria a área de gestão e então o

**André L.A. Bastos:** E a e o mapa, onde é que entra o mapa ali?

**Victor Almeida Jeremias:** mapa tô desenvolvendo aqui ainda. Eu vi ali pelo aplicativo que tu mandaste ali para mim que a que o mapa lá era bem era era mais fajuto ali. Lembra que tu mandasse um aplicativo de outra de uma de uma outra feira aqui em Bniar o Camburiu.

**André L.A. Bastos:** Ah, sim, sim, sim,

**Victor Almeida Jeremias:** Eu não lembro agora que era uma que era laranja ali.

**André L.A. Bastos:** sim. De construir, construo aí um AI.

**Victor Almeida Jeremias:** Isso é daí era o mapa 2D mesmo.

**André L.A. Bastos:** Aham. Aham. Sim,

**Victor Almeida Jeremias:** Era o mapa.

### **00:32:19**

**André L.A. Bastos:** pode ser também. Não tem. Se tiver, se 3D também é legal, né,

**Victor Almeida Jeremias:** Será que a aí uma coisa aqui que a a Ia falou é a questão da da

**André L.A. Bastos:** cara?

**Victor Almeida Jeremias:** internet? Será que sabe se lá o 3G lá, o 4G tem Wi-Fi lá na feira?

**André L.A. Bastos:** 4G tem. 4G tem.

**Victor Almeida Jeremias:** Pega bem lá, pega normal assim. Não, não tem

**André L.A. Bastos:** É, 4G tem.

**Victor Almeida Jeremias:** muita.

**André L.A. Bastos:** Agora nos stands geralmente o pessoal pega com pega uma internet bem que 4G funciona funciona funciona bem lá funciona

**Victor Almeida Jeremias:** Ah, é pessoal leva, né? Ah, não.

**André L.A. Bastos:** 4G funciona funciona Ah.

**Victor Almeida Jeremias:** Então tá. Ei. É, então tá melhor. Daí que a pessoa teria uma visão do mapa. Pressionei tudo aqui agora,

**André L.A. Bastos:** Opa, cai, caiu, caiu a, caiu a visualização.

### **00:33:09** {#00:33:09}

**Victor Almeida Jeremias:** pô. Porque tá caindo direto, cara.

**André L.A. Bastos:** Pois é. Por que que cai isso,

**Victor Almeida Jeremias:** Janela, tela inteira.

**André L.A. Bastos:** Vitor?

**Victor Almeida Jeremias:** Partear. Então, ah, teria aqui a função do mapa. A do mapa aqui, a pessoa com padrão estaria entrada.

**André L.A. Bastos:** Aham.

**Victor Almeida Jeremias:** E as stands aqui é ao clicar na stand aparece um um modal aqui, tá? Tá atrás do menu.

**André L.A. Bastos:** Угу.

**Victor Almeida Jeremias:** Tem que consertar isso aí. Eh, já aparece aqui atrás do já aparece um modal aqui com informação da feira, não sei o quê, abrir página. Aí você abrir página, vai lá paraa coisa da, enfim. E essas confirmações aqui, eh, já que tu vai fornecer o número da da da stand, eh, botei lá no no painel admin para te cadastrar a cadastrar associar as empresas cadastradas com stand.

**André L.A. Bastos:** Legal, legal, perfeito.

**Victor Almeida Jeremias:** Ah, uma vou te mostrar daí agora.

**André L.A. Bastos:** Так.

**Victor Almeida Jeremias:** Tem te mostrar agora duas páginas, a página do admin e a página do pro expositor ali conferir.

### **00:34:22**

**Victor Almeida Jeremias:** Deixa eu ver com minha

**André L.A. Bastos:** Sim.

**Victor Almeida Jeremias:** อ É uma coisa legal que também, claro que aqui é tudo eh perfumaria, é botar aqui as tagzinhas de acordo com a da área da da stand da empresa. Botar aqui automação, é serviço, não sei o quê.

**André L.A. Bastos:** Ah,

**Victor Almeida Jeremias:** Aí já,

**André L.A. Bastos:** sim. Acho,

**Victor Almeida Jeremias:** aí a ideia já é

**André L.A. Bastos:** acho meio desnecessário, Vitor. Acho que não é muito,

**Victor Almeida Jeremias:** perfumaria.

**André L.A. Bastos:** não agrega muito também, não.

**Victor Almeida Jeremias:** Vamos garantir aqui o arroz com feijão,

**André L.A. Bastos:** É,

**Victor Almeida Jeremias:** né? Ah, eu sou bem assim,

**André L.A. Bastos:** é.

**Victor Almeida Jeremias:** cara. Vou inventando no final acabo perdendo um pouco aí. É pinho. M.

**André L.A. Bastos:** Isso é programado em quê, Vitor?

**Victor Almeida Jeremias:** Essa aqui é um pouco de tudo. Eh,

### **00:36:01**

**André L.A. Bastos:** pouco de

**Victor Almeida Jeremias:** mas a maioria é em

**André L.A. Bastos:** tudo.

**Victor Almeida Jeremias:** React,

**André L.A. Bastos:** E tu programa desde quando, cara?

**Victor Almeida Jeremias:** cara, faz uns 3, 4 anos.

**André L.A. Bastos:** Ah, não é muito

**Victor Almeida Jeremias:** Não, não.

**André L.A. Bastos:** tempo.

**Victor Almeida Jeremias:** Eh, eu sempre gostei de de automação, de encontrar outros caminhos e ver coisa

**André L.A. Bastos:** E e a tua formação foi em que área?

**Victor Almeida Jeremias:** mais, cara, eu comecei a DM, cara, mas te dizer que eu não que eu não terminei.

**André L.A. Bastos:** Não, não

**Victor Almeida Jeremias:** É.

**André L.A. Bastos:** curtiu.

**Victor Almeida Jeremias:** E daí eu comecei a mexer com essas coisas de de investimento na época, tavaado.

**André L.A. Bastos:** Uhum.

**Victor Almeida Jeremias:** Aí eu fiquei nessa cara do investimento, fiquei um tempo na cuidando de investimento da da família

**André L.A. Bastos:** Uhum.

**Victor Almeida Jeremias:** também. E mas eu comecei mesmo essa parte da digital de uns dois anos para cá.

**André L.A. Bastos:** E e e pois aí, programação tu tu aprendeu onde?

### **00:37:08**

**Victor Almeida Jeremias:** Cara, aprendi bastante coisa no YouTube.

**André L.A. Bastos:** É mesmo?

**Victor Almeida Jeremias:** YouTube e Instagram.

**André L.A. Bastos:** É mesmo, né? Então, então tu gosta do assunto, né? Aí vai fuçando, né?

**Victor Almeida Jeremias:** Isso é. Ah, meu, o Instagram só oferece, só mostra essas coisas aí. Então, pegando as dicas. Acho que eu acho que eu te mandei os links, né? Deixa eu ver aqui na conversa.

**André L.A. Bastos:** Ка.

**Victor Almeida Jeremias:** Sacanagem. Só um segundo, André que Ah, tá. Eu te mandei no contato pessoal, acho. Deixa eu botar aqui André. Vamos pegar o link. Andra, por acaso tu tens o link que uma enviei uma vez para ti, não tô mais achando aqui.

**André L.A. Bastos:** Deixa, deixa eu ver aqui, Vitor.

**Victor Almeida Jeremias:** He.

**André L.A. Bastos:** Tinha aqui um painel do organizador. Não é isso não, né?

**Victor Almeida Jeremias:** Isso.

**André L.A. Bastos:** Painel do organizador é esse.

### **00:39:48**

**Victor Almeida Jeremias:** Acho que é consegue mandar de novo aí

**André L.A. Bastos:** Deixa eu, deixa eu ver se eu te

**Victor Almeida Jeremias:** no

**André L.A. Bastos:** mando.

**Victor Almeida Jeremias:** aqui.

**André L.A. Bastos:** É isso mesmo.

**Victor Almeida Jeremias:** aí deu. Obrigado pela pela paciência. Então, nesse link aqui, tu teria acesso aqui a ao aplicativo. Tá desatualizado. Vou atualizar aqui, botar nova versão. Seria aqui o acesso ao painel do expositor, que é onde ele vai preencher com os dados e teria acesso também. Ah, é o teu painel.

**André L.A. Bastos:** que é o que é onde onde entrariam os

**Victor Almeida Jeremias:** Isso. Portal do

**André L.A. Bastos:** conteúdos.

**Victor Almeida Jeremias:** expositor. Que aí o login ass tão aqui. Admin exp 2026\. 26\. Aí, aí o que tu tiver também de que seria teu painel para te organizar a feira e organizar o aplicativo. É, então que tu tiver informação também, quais informações tu acha que seria importante botar aqui que a gente já consegue botar eh aqui seria a página inicial board com os dados mais importantes, diria.

### **00:42:27** {#00:42:27}

**Victor Almeida Jeremias:** Aqui seria o mapa da da feira e é isso.

**André L.A. Bastos:** Esse isso. Só quem tem sou eu.

**Victor Almeida Jeremias:** Só quem tem acesso é tu para te organizar o aplicativo. Daí aqui tu botaria vai ter as empresas aqui,

**André L.A. Bastos:** Uhum.

**Victor Almeida Jeremias:** ó, sem imposição. Então, por aqui eu vou botar também um pouco mais. Eh, aqui a gente tá falando de de uma coisa ainda que não tá lapidada ainda, não tá 100% pronta assim. Então, tu vai ter aqui na parte do mapa aqui para te botar as empresas, botar aqui referente ao número delas. Então, por exemplo,

**André L.A. Bastos:** Certo.

**Victor Almeida Jeremias:** aqui empresa testes aí botar stand aqui e é só o número da stand. Tu vai aparecer aqui os numerozinhos, tu vai clicar nela e já vai salvar aqui.

**André L.A. Bastos:** Legal. Legal.

**Victor Almeida Jeremias:** Aí a pessoa no aplicativo já vai de forma automática, já vai aparecer lá naquele numerozinho, aquela essa loja, essa stand.

**André L.A. Bastos:** Legal.

**Victor Almeida Jeremias:** Então, para por aqui tu vai organizar isso aqui, vai aparecer as empresas que não tão tão sem stand, tu vai selecionar aqui e botar a stand dela aqui na

### **00:43:30**

**André L.A. Bastos:** Угу.

**Victor Almeida Jeremias:** agenda. Tem que ver, tem alguma que tá certo aqui. Acho que eh tem alguma que tá certo aqui, André? Consegue?

**André L.A. Bastos:** Ah, de cabeça eu não sei. De cabeça não vou saber.

**Victor Almeida Jeremias:** Tá. Então, por aqui tu vai botar se tiver outra.

**André L.A. Bastos:** Da onde tu tirou isso?

**Victor Almeida Jeremias:** Ah, a a Iá fez,

**André L.A. Bastos:** Ah,

**Victor Almeida Jeremias:** a Ia fez e mas depois eu peguei das reais também,

**André L.A. Bastos:** tá, tá,

**Victor Almeida Jeremias:** daí misturou tudo aqui. Enfim,

**André L.A. Bastos:** tá.

**Victor Almeida Jeremias:** aqui vai ter as informações para editar lá lá da página se mudar alguma coisa, mas também como a gente já conseguiu integrar lá com com R gestor, eh, possivelmente as informações de lá vai aparecer aqui já. eh patrocinadores aqui só para mudar ali na no aplicativo para te selecionar aqui a a a logotipo. O nome texto eh eh eu vou que antes era só o texto e o nome,

**André L.A. Bastos:** Mhm.

**Victor Almeida Jeremias:** mas eu vou tirar ali.

### **00:44:41**

**Victor Almeida Jeremias:** Então aqui tu vai botar aqui as fotos e materiais para disponibilizar no aplicativo geral.

**André L.A. Bastos:** Caiu, caiu a a

**Victor Almeida Jeremias:** Eh,

**André L.A. Bastos:** visualização. Hum. M. M.

**Victor Almeida Jeremias:** Aí aqui a gente botaria lá os materiais para download ou fazer algum carrocel. Ó, já apareceu que os patrocinadores,

**André L.A. Bastos:** Угуm.

**Victor Almeida Jeremias:** ó, a imagem que eu botei lá. Aí a ideia é que fique um carrocel aparecendo, girando sintomaticamente. Eh, expositores em destaque. Será que a gente deixa aqui?

**André L.A. Bastos:** Pode deixar, pode deixar.

**Victor Almeida Jeremias:** Tá.

**André L.A. Bastos:** Vai aparecer lá pro camarada, né? pro pro visitante,

**Victor Almeida Jeremias:** Aham. É. Aham.

**André L.A. Bastos:** né?

**Victor Almeida Jeremias:** Eh, daí então eu também deixo esses materiais para download no aplicativo, tá?

**André L.A. Bastos:** Sim.

**Victor Almeida Jeremias:** Daí também tudo aqui no novo material. E deixa eu ver se já tá aí, já tá integrado integrado.

### **00:45:58** {#00:45:58}

**Victor Almeida Jeremias:** Então aqui a gente vai fazer o download do material pro usuário poder baixar lá. e tá excluir visitantes. Vai ser aqui o painel para captar os leads, que aqui vai ter as informações aqui. A gente vai poder também depois eh baixar em CSV, baixar em planilha. Eh, todas as informações do que a gente coletou aqui. A página de aviso seria para enviar notificação pra pessoa. Então,

**André L.A. Bastos:** Ah, esse esse é um ponto

**Victor Almeida Jeremias:** a gente bota, é,

**André L.A. Bastos:** importante.

**Victor Almeida Jeremias:** é, daí botaria aqui o título da da mensagem aqui, a mensagenzinha, os emojes ali,

**André L.A. Bastos:** Aham.

**Victor Almeida Jeremias:** enviar aviso que já deve aparecer pro automaticamente pra pessoa.

**André L.A. Bastos:** Sim.

**Victor Almeida Jeremias:** Daria também pra gente botar aqui programa Viso. É, faltam 10 dias, faltam 5 dias também.

**André L.A. Bastos:** Ótimo,

**Victor Almeida Jeremias:** É legal,

**André L.A. Bastos:** ótimo,

**Victor Almeida Jeremias:** né?

**André L.A. Bastos:** ótimo,

**Victor Almeida Jeremias:** Vou botar isso aqui então.

**André L.A. Bastos:** ótimo.

### **00:46:56**

**Victor Almeida Jeremias:** Então,

**André L.A. Bastos:** Mas aí é

**Victor Almeida Jeremias:** deixa. É,

**André L.A. Bastos:** pré-programado.

**Victor Almeida Jeremias:** dá pra gente botar pr préprogramado para já disparar no momento pré-definido.

**André L.A. Bastos:** Seria legal.

**Victor Almeida Jeremias:** Beleza.

**André L.A. Bastos:** E seria muito legal.

**Victor Almeida Jeremias:** Deixa eu falar aqui para irá, então, para ela na página de organizador, administrador do evento em avisos. Habilitar eh o habilitar as notificações pré realizadas, botar lá um horário para disparar aquela mensagem, o título dela e a mensagem. Deu isso aí. E cara, seria basicamente isso. Tá tudo ali já no no documento que eu te enviei. Só vou atualizar porque tá desatualizado com as informações. vai est aqui. Uma coisa que também eh uma coisa que eu queria ver contigo, a questão ali do login, mas já ficou um pouco mais claro para mim. E se no R gestor lá a pessoa pagando, tem como botar um link já para ela preencher lá, tipo, ela pagou lá do do evento. É do evento também.

### **00:48:19** {#00:48:19}

**Victor Almeida Jeremias:** O expositor paga no registor.

**André L.A. Bastos:** do o o expositor, não, só os participantes pagam no regestor.

**Victor Almeida Jeremias:** Ah, onde que o expositor paga?

**André L.A. Bastos:** Aí é via contrato comigo, é feito um contrato,

**Victor Almeida Jeremias:** Ah,

**André L.A. Bastos:** porque como são poucos,

**Victor Almeida Jeremias:** tá,

**André L.A. Bastos:** a gente administra um a um meio que no contrato,

**Victor Almeida Jeremias:** entendi. Ah, então quando a pessoa fazer lá o cadastro com vocês,

**André L.A. Bastos:** entendeu?

**Victor Almeida Jeremias:** finalizar lá e tudo certo o cadastro aí, eh, já envia esse link paraa pessoa preencher com os dados da empresa.

**André L.A. Bastos:** Exato.

**Victor Almeida Jeremias:** Pode ser?

**André L.A. Bastos:** Exato. Aham.

**Victor Almeida Jeremias:** Ah, tá legal. Esse era outro problema que eu queria ver. tá selecionado. Eh, então tá, André. Não sei se tem alguma dúvida

**André L.A. Bastos:** Não, cara,

**Victor Almeida Jeremias:** aí.

**André L.A. Bastos:** eu acho que é isso aí. Só botar esse negócio para funcionar.

### **00:49:09** {#00:49:09}

**Victor Almeida Jeremias:** Não tá. Eh, aí quando tu fala que dá para botar lá para na Apple Store lá para para testar e tal, é, eh, eu já boto,

**André L.A. Bastos:** Hã,

**Victor Almeida Jeremias:** eu já consigo

**André L.A. Bastos:** é,

**Victor Almeida Jeremias:** botar.

**André L.A. Bastos:** deixa eu só tu tá aquele link que você mandou para aquele link que eu te mandei agora, que você tinha me mandado, eu consigo visualizar tudo isso aí. É isso,

**Victor Almeida Jeremias:** Uhum.

**André L.A. Bastos:** tá?

**Victor Almeida Jeremias:** Uhum.

**André L.A. Bastos:** Para a gente ver aí o que que a gente precisa alterar pra gente poder disponibilizar,

**Victor Almeida Jeremias:** Tá,

**André L.A. Bastos:** tá?

**Victor Almeida Jeremias:** eu vou eu vou botar também aqui na nessa página aqui, botar aqui o que que tem que tem o que que tem que ser feito ainda e e tentar botar lá uma área para te botar também alguma coisa que você quiser

**André L.A. Bastos:** Tá,

**Victor Almeida Jeremias:** e tal ou falar.

**André L.A. Bastos:** tá.

**Victor Almeida Jeremias:** Mas isso aí também só para pontuar isso Maria.

**André L.A. Bastos:** É, é. Vamos ver se a gente sente falta também, né?

### **00:50:05**

**André L.A. Bastos:** Porque não adianta ficar colocando muitas funcionalidades, Vitor, sem que depois a gente utilize, entendeu?

**Victor Almeida Jeremias:** Угуm.

**André L.A. Bastos:** Se a gente tiver alguma demanda, ó, Vitor, pô, precisava fazer isso aqui assim, cara. Entendeu? Eu acho que era importante, como você falou, vamos botar o feijão com arroz aí. Eu acho que o que tem aí já tá legal. Eu acho que o que a gente precisaria fazer agora é a alteração das da das informações, né? Informações corretas, entendeu? E aí eu preciso fazer isso,

**Victor Almeida Jeremias:** Угу.

**André L.A. Bastos:** preciso validar as informações,

**Victor Almeida Jeremias:** Угу.

**André L.A. Bastos:** tá? Eu vou eu vou fazer isso, vou gravando um áudio para ti e aí você vai ajeitando aí.

**Victor Almeida Jeremias:** Uhum. Uhum.

**André L.A. Bastos:** Ajeitando isso aí, a gente coloca no A e depois esses detalhes a gente pode ir ajustando depois,

**Victor Almeida Jeremias:** Uhum.

**André L.A. Bastos:** entendeu?

### **00:50:46**

**Victor Almeida Jeremias:** Tranquilo. Então tá.

**André L.A. Bastos:** Tá?

**Victor Almeida Jeremias:** Eu vou te mandar o link aí. Aí tu vai testando, tu vai falando aí se teve alguma coisa.

**André L.A. Bastos:** Isso.

**Victor Almeida Jeremias:** E e essa página aqui também vai ter algumas informações, eh eh algumas dúvidas que tu pode e tal. Então vai testando aí e vai

**André L.A. Bastos:** Legal. Fechou.

**Victor Almeida Jeremias:** falando.

**André L.A. Bastos:** Fechou. Eu vou dar uma visualizada ali e e te digo o que que a gente precisaria alterar.

**Victor Almeida Jeremias:** Fechou. Beleza, André.

**André L.A. Bastos:** Valeu, querido.

**Victor Almeida Jeremias:** Conversamos com

**André L.A. Bastos:** Tá. Deixa eu só ver só uma questão de praticidade.

**Victor Almeida Jeremias:** ele.

**André L.A. Bastos:** Eh, o camarada vai bcar vai vai baixar na Apple Store ou eu consigo um link para eu encaminhar por e-mail pro cara baixar? Como é que pode? Como é que pode ser isso?

**Victor Almeida Jeremias:** Também inclusive, inclusive dá para pegar pelo do R gestor lá,

### **00:51:30**

**André L.A. Bastos:** É,

**Victor Almeida Jeremias:** não sei como é que é. Tu falar uma integração com e-mail e enviar lá.

**André L.A. Bastos:** sim, sim, tem.

**Victor Almeida Jeremias:** Dá para dá para fazer meio que automático também. A pessoa ela, a pessoa fez o cadastro no Simple, ela pagou não, não, mas fez a inscrição lá no Simpla, já a gente já envia um e-mail para ela automaticamente,

**André L.A. Bastos:** Pô, isso seria

**Victor Almeida Jeremias:** entende? Eh, baixa aqui junto com a confirmação aqui seu ingresso não sei o que do Simpla que vai automático,

**André L.A. Bastos:** legal.

**Victor Almeida Jeremias:** já gera um, a gente faz o e-mail e envia paraa pessoa. Aqui isso é o abaixo explicativo da feira e não sei, confira informações, tal.

**André L.A. Bastos:** E seria legal. Isso seria muito legal. Isso seria muito legal,

**Victor Almeida Jeremias:** Então tá, já vou ver isso também.

**André L.A. Bastos:** tá? Fechou? Tá,

**Victor Almeida Jeremias:** Fechou?

**André L.A. Bastos:** eu vou dar uma olhadinha nas informações pra gente corrigir o que que tá ali de eh inconsistente para gente seguir.

**Victor Almeida Jeremias:** Uhum. Então tá.

**André L.A. Bastos:** Então,

**Victor Almeida Jeremias:** Eu vou fazer ali o deploy, o envio das atualizações. Tá um pouco desatualizado ali o link do do e-mail do coiso,

**André L.A. Bastos:** tá legal,

**Victor Almeida Jeremias:** mas questão de 10 minutos já tá funcionando ali.

**André L.A. Bastos:** fechou. Valeu, Vitor.

**Victor Almeida Jeremias:** Valeu. Bora lá.

**André L.A. Bastos:** Abraço, querido.

**Victor Almeida Jeremias:** N.

**André L.A. Bastos:** Tchau, tchau. Tchau.

**Victor Almeida Jeremias:** Abraço.

### **A transcrição foi encerrada após 00:52:52**

*Esta transcrição editável foi gerada por computador e pode conter erros. As pessoas também podem alterar o texto depois que ele for criado.*