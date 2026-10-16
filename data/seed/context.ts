import type { StrategyContext } from "@/lib/domain/types";

/**
 * Contexto estratégico inicial. Direcionadores e problemas são pontos de partida
 * para discussão — não são metas ou compromissos aprovados.
 */
export const seedContext: StrategyContext = {
  intro:
    "Este roadmap organiza as iniciativas de Produto da Jovens Gênios para 2027 a partir de problemas reais, e não de listas de funcionalidades. Cada iniciativa conecta um problema a um motivador, a uma experiência proposta, a uma documentação rastreável e a um resultado que possa ser validado.\n\nPriorizamos iniciativas transversais — que atravessam Admins, Exploradores e as demais plataformas — para evitar soluções isoladas por produto. Os direcionadores, problemas e iniciativas aqui registrados estão em construção e devem ser validados continuamente.",
  drivers: [
    {
      id: "experiencia-acessibilidade",
      title: "Experiência e acessibilidade",
      description:
        "Reduzir barreiras de uso e tornar as plataformas mais acessíveis aos diferentes perfis de estudantes e educadores.",
    },
    {
      id: "confiabilidade-qualidade",
      title: "Confiabilidade e qualidade",
      description:
        "Resolver problemas recorrentes que comprometem a estabilidade, a previsibilidade e a conclusão das principais jornadas.",
    },
    {
      id: "autonomia-estudante",
      title: "Autonomia do estudante",
      description: "Facilitar a descoberta, o acesso e a continuidade das experiências de aprendizagem.",
    },
    {
      id: "eficiencia-operacional",
      title: "Eficiência operacional",
      description: "Reduzir trabalho manual, inconsistências cadastrais e dependência de intervenções administrativas.",
    },
  ],
  principles: [
    {
      id: "problemas-antes",
      title: "Problemas antes de funcionalidades",
      description: "Toda iniciativa começa pelo problema que resolve e por quem é afetado, não pela solução.",
    },
    {
      id: "transversais-antes",
      title: "Iniciativas transversais antes de silos por plataforma",
      description: "Uma mesma iniciativa pode impactar várias plataformas sem ser duplicada.",
    },
    {
      id: "resultados-antes",
      title: "Resultados mensuráveis antes de volume de entregas",
      description: "O sucesso é medido pela mudança observada, não pela quantidade de entregas.",
    },
    {
      id: "validacao-antes",
      title: "Validação contínua antes de expansão",
      description: "Hipóteses são testadas em pequena escala antes de serem ampliadas.",
    },
  ],
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
      relatedInitiativeIds: ["JG-2027-004", "JG-2027-001"],
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
      relatedInitiativeIds: ["JG-2027-002"],
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
      relatedInitiativeIds: ["JG-2027-003"],
      validation: "hipotese",
    },
  ],
};
