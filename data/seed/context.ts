import type { StrategyContext } from "@/lib/domain/types";

/** Junta blocos de Markdown separados por linha em branco. */
const md = (...blocks: string[]) => blocks.join("\n\n");

/**
 * Contexto estratégico do Roadmap 2027, como apresentado pelo time de Produto.
 * Os textos são preservados na íntegra (Markdown). As metas aparecem como
 * "propostas" até serem aprovadas.
 */
export const seedContext: StrategyContext = {
  intro: md(
    "O Roadmap 2027 representa uma mudança na forma como pensamos, priorizamos e entregamos valor nas plataformas da Jovens Gênios.",
    "Mais do que definir quais funcionalidades serão desenvolvidas ao longo do próximo ano, queremos estabelecer uma direção clara para nossos produtos, conectando as necessidades reais dos usuários aos objetivos estratégicos da companhia.",
    "Nosso principal objetivo é evoluir de um modelo orientado à entrega de funcionalidades para um modelo orientado à resolução de problemas, geração de valor e resultados mensuráveis.",
  ),

  proposal: [
    {
      id: "nova-forma-de-pensar-produto",
      title: "Uma nova forma de pensar produto",
      subtitle: "De entregas de funcionalidades para geração de valor",
      body: md(
        "Historicamente, boa parte da nossa construção de produto esteve concentrada em atender demandas pontuais, implementar funcionalidades e responder a solicitações que surgiam ao longo da operação.",
        "Embora esse modelo tenha permitido evoluir nossas plataformas, precisamos avançar.",
        "Em 2027, queremos mudar essa lógica: em vez de simplesmente perguntar quais funcionalidades precisamos desenvolver, devemos começar identificando quais são os principais problemas dos nossos usuários, quais oportunidades temos de negócio e quais resultados esperamos alcançar.",
        "Essa mudança significa priorizar iniciativas a partir de seu valor real, dando preferência àquelas que já possuem evidências de necessidade, histórico de reclamações, solicitações recorrentes ou hipóteses validadas.",
        "Um exemplo claro dessa necessidade é o **login simplificado**. Durante anos, recebemos reclamações e solicitações relacionadas às dificuldades de acesso às nossas plataformas. Mesmo sendo um problema conhecido, ele permaneceu como uma barreira importante, principalmente para estudantes dos anos iniciais, que possuem limitações naturais de leitura e escrita.",
        "Esse é o tipo de problema que queremos deixar de postergar.",
        "Não queremos construir funcionalidades apenas porque parecem interessantes ou porque estão na fila de desenvolvimento. Queremos construir soluções que removam barreiras, melhorem experiências, aumentem o engajamento, fortaleçam a estabilidade e contribuam diretamente para os resultados da companhia.",
      ),
      highlight: "A prioridade deixa de ser quantas funcionalidades entregamos e passa a ser quanto valor conseguimos gerar com aquilo que construímos.",
    },
    {
      id: "novo-modelo-de-planejamento",
      title: "Um novo modelo de planejamento e execução",
      subtitle: "Planejamento anual, entregas trimestrais",
      body: md(
        "Outra mudança importante está na forma como organizamos nosso horizonte de planejamento.",
        "Em vez de trabalhar com um planejamento de 12 meses no qual todas as entregas são distribuídas antecipadamente, queremos estabelecer objetivos claros para cada quarter do ano.",
        "A proposta é trabalhar com ciclos de entrega de três meses, garantindo que, a cada trimestre, nossas plataformas recebam evoluções relevantes e direcionadas a objetivos específicos.",
        "Isso não significa deixar de pensar no ano inteiro. Continuaremos identificando e organizando as iniciativas que consideramos importantes para 2027, mas a execução será orientada por ciclos mais curtos, com prioridades, objetivos e compromissos mais claros.",
        "### Como funcionará na prática?",
        [
          "- **Planejamento anual:** identificação das principais iniciativas e oportunidades que queremos trabalhar ao longo de 2027.",
          "- **Planejamento trimestral:** definição dos objetivos, iniciativas prioritárias e entregas esperadas para cada quarter.",
          "- **Execução:** concentração dos times nas prioridades estabelecidas para o trimestre, evitando dispersão e mudanças constantes de direção.",
          "- **Revisão semestral:** após os primeiros seis meses, reavaliação das prioridades para decidir se devemos manter as iniciativas previstas para o segundo semestre ou reorganizar nossa estratégia de acordo com os resultados e aprendizados obtidos.",
        ].join("\n"),
        "Essa dinâmica nos permite ter uma visão de longo prazo sem perder a capacidade de adaptação.",
        "Queremos mais clareza sobre o que será entregue nos próximos três meses, maior previsibilidade para os times e mais autonomia para tomar decisões com base em resultados concretos.",
      ),
      highlight: "Nosso compromisso é transformar o roadmap em um instrumento de direcionamento e execução, e não apenas em uma lista de funcionalidades planejadas para o ano.",
    },
    {
      id: "iniciativas-preparadas",
      title: "Iniciativas preparadas para execução",
      subtitle: "Menos incerteza, mais previsibilidade",
      body: md(
        "Uma das principais preocupações para 2027 é garantir que as iniciativas priorizadas tenham maturidade suficiente antes de entrarem em desenvolvimento.",
        "Por isso, as iniciativas apresentadas neste roadmap já contam com seus respectivos PRDs (Product Requirements Documents) e jornadas conceituais desenvolvidas.",
        "Esse trabalho foi realizado para antecipar discussões, esclarecer regras de negócio, mapear comportamentos esperados e apresentar uma visão mais completa das experiências que queremos construir.",
        "As jornadas conceituais também servem como referência para os times de Design e, principalmente, Engenharia, permitindo que as equipes compreendam a dimensão das soluções antes de estimar sua implementação.",
        "Nossa expectativa é que esse processo permita:",
        [
          "- Reduzir dúvidas e ambiguidades durante o desenvolvimento.",
          "- Antecipar dependências técnicas e complexidades de implementação.",
          "- Identificar necessidades de infraestrutura e integrações.",
          "- Estimar com maior precisão o esforço e o tempo necessário para cada iniciativa.",
          "- Planejar a capacidade dos times de acordo com o escopo real das entregas.",
        ].join("\n"),
        "Queremos que cada iniciativa tenha uma estimativa de execução fundamentada, com previsão de semanas e capacidade necessária para entregar a experiência integralmente especificada.",
        "Isso significa evitar um cenário recorrente: iniciar uma iniciativa com uma expectativa de entrega e, por falta de planejamento ou estimativa adequada, precisar reduzir o escopo, remover etapas importantes ou comprometer a experiência final.",
        "**Não queremos estimar o tempo necessário para entregar uma versão reduzida da solução. Queremos entender quanto tempo precisamos para entregar aquilo que efetivamente planejamos construir.**",
        "A previsibilidade deve vir de um entendimento compartilhado entre Produto, Design e Engenharia, respeitando as particularidades e complexidades de cada iniciativa.",
      ),
      highlight: "",
    },
    {
      id: "compromisso-2027",
      title: "Nosso compromisso para 2027",
      subtitle: "",
      body: md(
        "Queremos construir um modelo de desenvolvimento de produto mais maduro, previsível e orientado a resultados.",
        "Isso exige uma mudança de comportamento de todos os envolvidos no processo.",
        "Produto precisa priorizar problemas relevantes e defender iniciativas com objetivos claros. Design precisa traduzir essas necessidades em experiências completas e consistentes. Engenharia precisa participar antecipadamente das discussões, contribuindo com viabilidade técnica, dimensionamento e previsibilidade.",
        "Trabalharemos com prioridades claras, ciclos trimestrais, revisões semestrais e indicadores que demonstrem o impacto das nossas decisões.",
      ),
      highlight:
        "2027 não deve ser lembrado como o ano em que entregamos mais funcionalidades, mas como o ano em que começamos a entregar mais valor, com maior qualidade, previsibilidade e impacto para nossos usuários e para a Jovens Gênios.",
    },
  ],

  platformsIntro: md(
    "As prioridades do primeiro semestre de 2027 foram organizadas a partir dos principais desafios identificados em cada plataforma.",
    "Cada produto possui uma realidade diferente, com necessidades específicas de evolução. Por isso, não devemos utilizar o mesmo direcionamento estratégico para todas as plataformas.",
    "Nosso foco será concentrar esforços nos indicadores que representam os maiores problemas e oportunidades de cada produto.",
  ),

  platformStrategies: [
    {
      id: "exploradores-estabilidade",
      platformId: "exploradores",
      focus: "Estabilidade e confiabilidade",
      statement: "Proteger e fortalecer a experiência que já construímos.",
      narrative: md(
        "O Exploradores passou por uma transformação importante. Em 2026, avançamos na modernização tecnológica da plataforma, concluindo a migração em agosto, e também trabalhamos em uma nova experiência, com evolução de interface, usabilidade e compatibilidade, cuja entrega está prevista para janeiro de 2027.",
        "Essa evolução resolveu importantes limitações históricas, principalmente relacionadas à experiência de navegação e à distribuição adequada entre dispositivos.",
        "Um dado importante reforça essa decisão: em 2026, aproximadamente 66% dos acessos considerados no levantamento de dispositivos foram realizados por computadores, enquanto 28% vieram de dispositivos móveis e 6% de tablets.",
        "Isso demonstra a importância de manter uma experiência desktop consistente, sem negligenciar os demais dispositivos.",
        "Entretanto, a evolução visual e tecnológica não resolve, sozinha, os problemas estruturais de estabilidade que ainda enfrentamos.",
        "Atualmente, o Exploradores concentra **14.169 chamados de suporte**, representando aproximadamente **73% de todos os chamados atendidos pelo time de suporte**.",
        "Quando comparamos esse cenário com a Geniex, a diferença fica ainda mais evidente.",
        [
          "| Indicador | Exploradores | Geniex |",
          "|---|---:|---:|",
          "| Estudantes ativos mensais | 32.342 | 168.283 |",
          "| Participação nos chamados de suporte | 73% | 11% |",
        ].join("\n"),
        "A Geniex possui aproximadamente 5,2 vezes mais estudantes ativos mensalmente que o Exploradores e, mesmo assim, representa uma parcela significativamente menor dos chamados de suporte.",
        "Esse cenário demonstra que nosso principal desafio no Exploradores não está necessariamente na ausência de novas funcionalidades, mas na necessidade de garantir que aquilo que já existe funcione de maneira consistente.",
      ),
      indicators: [
        { id: "chamados", label: "Chamados de suporte", value: "14.169", detail: "≈73% de todos os chamados atendidos pelo time de suporte." },
        { id: "estudantes-ativos", label: "Estudantes ativos mensais", value: "32.342", detail: "A Geniex tem ≈5,2 vezes mais estudantes ativos por mês." },
        { id: "acessos-computador", label: "Acessos por computador", value: "≈66%", detail: "Levantamento de dispositivos de 2026: 28% em dispositivos móveis e 6% em tablets." },
      ],
      goals: [],
      outcomes: [
        "Reduzir significativamente os problemas de estabilidade e performance.",
        "Diminuir a incidência de bugs e falhas que comprometem a jornada dos estudantes.",
        "Melhorar a confiabilidade dos principais fluxos da plataforma.",
        "Garantir compatibilidade e consistência entre desktop, mobile e tablet.",
        "Reduzir a dependência do suporte para resolver problemas recorrentes de utilização.",
      ],
      closing: md(
        "Nosso direcionamento é claro: novas funcionalidades devem ser criteriosas, enquanto a estabilidade precisa ser tratada como prioridade estratégica.",
        "O Exploradores precisa deixar de consumir uma parcela desproporcional da capacidade de suporte e passar a oferecer uma experiência confiável, consistente e sustentável.",
      ),
    },
    {
      id: "geniex-engajamento",
      platformId: "geniex",
      focus: "Engajamento e retenção",
      statement: "Transformar acessos pontuais em utilização recorrente.",
      narrative: md(
        "A Geniex apresenta um cenário diferente do Exploradores.",
        "Atualmente, a plataforma possui aproximadamente **168.283 estudantes ativos por mês** e um tempo médio de utilização de aproximadamente **10 minutos por sessão**.",
        "Esse tempo demonstra que, quando o estudante acessa a plataforma, existe potencial de consumo e interação com o conteúdo.",
        "Entretanto, ainda temos um desafio importante relacionado à recorrência.",
        "Em 2026, apenas 11% da base total de usuários retornou à plataforma dentro do mesmo mês, enquanto o indicador de aderência atual está em aproximadamente 5%.",
        "Isso significa que precisamos ir além de atrair estudantes para a plataforma. Precisamos criar motivos para que eles retornem, explorem novos conteúdos e incorporem a Geniex à sua rotina de aprendizagem.",
        "As iniciativas previstas para a plataforma devem atuar diretamente nesse comportamento, ampliando as oportunidades de interação, descoberta e continuidade da experiência educacional.",
        "**Nosso principal objetivo é elevar a aderência de 5% para pelo menos 15%.**",
        "Isso representa triplicar o indicador atual e estabelecer um novo patamar de utilização recorrente.",
        "Além disso, queremos ampliar significativamente o volume de estudantes ativos mensalmente, saindo dos atuais **168.283 para aproximadamente 550.000 estudantes por mês**.",
        "Essa evolução representa um crescimento de aproximadamente **227% na base mensal de estudantes ativos**, chegando a uma quantidade 3,27 vezes maior que a atual.",
      ),
      indicators: [
        { id: "estudantes-ativos", label: "Estudantes ativos mensais", value: "168.283", detail: "" },
        { id: "tempo-sessao", label: "Tempo médio por sessão", value: "≈10 min", detail: "Indica potencial de consumo e interação quando o estudante acessa." },
        { id: "retorno-mes", label: "Retorno no mesmo mês", value: "11%", detail: "Parcela da base total de usuários que retornou dentro do mesmo mês, em 2026." },
        { id: "aderencia", label: "Aderência atual", value: "≈5%", detail: "" },
        { id: "chamados", label: "Participação nos chamados de suporte", value: "11%", detail: "" },
      ],
      goals: [
        { id: "aderencia", label: "Aderência", current: "5%", target: "≥ 15%", detail: "Triplicar o indicador atual.", state: "proposta" },
        {
          id: "estudantes-ativos",
          label: "Estudantes ativos mensais",
          current: "168.283",
          target: "≈550.000",
          detail: "Crescimento de ≈227% na base mensal (3,27 vezes a atual).",
          state: "proposta",
        },
      ],
      outcomes: [
        "Aumentar a frequência de acesso dos estudantes.",
        "Melhorar a retenção e o retorno dos usuários à plataforma.",
        "Ampliar o tempo total de utilização ao longo do mês.",
        "Criar experiências que estimulem a continuidade da aprendizagem.",
        "Aumentar a aderência das funcionalidades e conteúdos disponíveis.",
        "Ampliar a base de estudantes ativos mensais para aproximadamente 550 mil.",
        "Contribuir diretamente para o crescimento da utilização e da receita mensal da companhia.",
      ],
      closing: md(
        "A Geniex já possui uma base expressiva e um tempo médio de sessão relevante. Agora, precisamos fazer com que muito mais estudantes aproveitem esse potencial de forma recorrente.",
        "**Nossa expectativa é transformar o engajamento em crescimento de utilização e, consequentemente, em aumento de receita mensal para a companhia.**",
      ),
    },
    {
      id: "educadores-engajamento-eficiencia",
      platformId: "educadores",
      focus: "Engajamento e eficiência operacional",
      statement: "Tornar a plataforma mais relevante, simples e eficiente para os educadores.",
      narrative: md(
        "O Educadores também apresenta uma oportunidade importante de evolução.",
        "Atualmente, temos aproximadamente **6 mil educadores ativos por mês**, com aderência (WAU/MAU) de 40% e tempo médio de utilização de apenas 3 minutos e 40 segundos.",
        "Esses indicadores demonstram que precisamos aumentar a presença da plataforma na rotina dos educadores e oferecer experiências que justifiquem seu retorno frequente.",
        "Mas esse desafio não está relacionado somente à criação de novas funcionalidades.",
        "Também precisamos revitalizar a experiência atual, modernizando a interface, simplificando jornadas e reduzindo o esforço necessário para executar atividades importantes do dia a dia.",
        "Um exemplo é a criação de uma Prova Genial.",
        "Historicamente, esse processo chegou a levar aproximadamente 11 minutos. Após melhorias, conseguimos reduzir esse tempo para cerca de 5 minutos. Apesar da evolução, ainda existe uma oportunidade significativa de otimização.",
        "**Nossa meta é reduzir em pelo menos 50% o tempo médio de criação de uma Prova Genial, chegando a aproximadamente 2 minutos e 30 segundos.**",
        "Essa evolução representa uma experiência mais direta, intuitiva e eficiente, sem comprometer a completude do processo.",
      ),
      indicators: [
        { id: "educadores-ativos", label: "Educadores ativos mensais", value: "≈6 mil", detail: "" },
        { id: "aderencia", label: "Aderência (WAU/MAU)", value: "40%", detail: "" },
        { id: "tempo-uso", label: "Tempo médio de utilização", value: "3min40s", detail: "" },
        { id: "prova-genial", label: "Criação de uma Prova Genial", value: "≈5 min", detail: "Historicamente chegou a levar ≈11 minutos." },
      ],
      goals: [
        {
          id: "prova-genial",
          label: "Tempo médio de criação de uma Prova Genial",
          current: "≈5 min",
          target: "≈2min30s",
          detail: "Redução de pelo menos 50%, sem comprometer a completude do processo.",
          state: "proposta",
        },
      ],
      outcomes: [
        "Aumentar a aderência e a frequência de utilização da plataforma.",
        "Ampliar o tempo de utilização por meio de experiências relevantes.",
        "Modernizar a interface e a arquitetura de navegação.",
        "Simplificar os fluxos mais utilizados pelos educadores.",
        "Reduzir o tempo necessário para executar tarefas recorrentes.",
        "Criar novas funcionalidades e visões adequadas aos diferentes perfis de usuários.",
        "Tornar o Educadores uma ferramenta presente e relevante na rotina escolar.",
      ],
      closing:
        "O objetivo é deixar de oferecer uma plataforma utilizada apenas quando existe uma necessidade pontual e construir uma experiência que faça parte da rotina dos educadores.",
    },
  ],

  measurement: md(
    "O sucesso do Roadmap 2027 não será medido pela quantidade de iniciativas concluídas ou funcionalidades publicadas.",
    "Nosso principal critério será a capacidade de transformar as iniciativas em resultados observáveis.",
    "Para isso, cada plataforma terá indicadores prioritários, que deverão orientar as decisões de Produto, Design e Engenharia durante os ciclos trimestrais.",
    [
      "| Plataforma | Principal direcionador | Resultado esperado |",
      "|---|---|---|",
      "| Exploradores | Estabilidade | Menos falhas, bugs e chamados de suporte |",
      "| Geniex | Engajamento e retenção | Mais estudantes retornando e utilizando a plataforma |",
      "| Educadores | Engajamento e eficiência | Mais utilização, jornadas melhores e menor esforço operacional |",
    ].join("\n"),
    "Os indicadores devem ser acompanhados continuamente, permitindo entender se as iniciativas estão produzindo os resultados esperados e se precisamos ajustar nossas prioridades.",
    "Mais do que entregar o que foi planejado, queremos garantir que cada entrega tenha um propósito claro e contribua para a evolução do negócio.",
  ),

  problems: [
    {
      id: "barreira-acesso-alfabetizacao",
      name: "Barreiras de acesso para estudantes em alfabetização",
      description:
        "O acesso convencional por e-mail e senha pressupõe que o estudante consiga identificar, digitar e recuperar credenciais textuais, premissa que não corresponde à realidade de parte dos estudantes do Ensino Fundamental I.",
      audience: "Estudantes do Ensino Fundamental I em fase de alfabetização e seus professores.",
      evidence: [],
      consequences:
        "Dependência do professor para iniciar a sessão, interrupções nas atividades pedagógicas e uso menos autônomo do Exploradores.",
      relatedInitiativeIds: ["JG-2027-001"],
      validation: "em_validacao",
    },
    {
      id: "falhas-acesso-uso-simultaneo",
      name: "Falhas de acesso em uso simultâneo na escola",
      description:
        "Em situações de uso simultâneo, como uma turma inteira acessando pela mesma rede, estudantes encontraram erros de acesso que interrompem a jornada de entrada.",
      audience: "Estudantes e professores em uso coletivo em sala de aula.",
      evidence: [
        "Relato interno “Problemas de acesso – SJC”: bloqueios por limite de requisições (HTTP 429) quando vários estudantes acessavam pela mesma rede com IP compartilhado.",
        "O mesmo relato registra acesso indevido a páginas de validação indexadas e uma migração antecipada de senhas que gerou falhas de login.",
      ],
      consequences:
        "Mensagens de erro genéricas para o estudante, interrupção de atividades em sala e necessidade de intervenção da equipe técnica.",
      relatedInitiativeIds: ["JG-2027-001"],
      validation: "confirmado",
    },
    {
      id: "inconsistencia-cadastral",
      name: "Inconsistência de cadastros e vínculos escolares",
      description:
        "Possíveis divergências entre estudantes, escolas, turmas e identificadores nos fluxos de cadastro e atualização.",
      audience: "Equipes administrativas, gestores escolares e, indiretamente, estudantes.",
      evidence: [],
      consequences: "Correções manuais, retrabalho operacional e risco de acessos ou relatórios incorretos.",
      relatedInitiativeIds: [],
      validation: "hipotese",
    },
    {
      id: "continuidade-aprendizagem",
      name: "Baixa autonomia e continuidade na jornada do estudante",
      description:
        "Hipótese de que a experiência atual do Exploradores ainda depende de mediação para que o estudante descubra, retome e conclua suas atividades.",
      audience: "Estudantes usuários do Exploradores.",
      evidence: [],
      consequences: "Menor continuidade da aprendizagem e maior dependência de professores.",
      relatedInitiativeIds: [],
      validation: "hipotese",
    },
  ],
};
