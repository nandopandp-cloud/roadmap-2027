import { defaultPhases } from "@/lib/domain/progress";
import type { Initiative, PhaseState } from "@/lib/domain/types";

/**
 * Iniciativas iniciais (ambientes novos). As iniciativas de demonstração originais foram
 * removidas por serem fictícias; ficam a 001 (Login simplificado) e a 002 (Batalhas), ambas
 * com quarter e prioridade "a validar" (planningValidated: false).
 *
 * A JG-2027-001 (Login simplificado do estudante) usa como fonte o PRD recebido em 16/10/2026
 * (initiatives/JG-2027-001-autenticacao-estudante/prd.md).
 */
const SEEDED_AT = "2026-10-16T12:00:00.000Z";

const base = {
  createdAt: SEEDED_AT,
  updatedAt: SEEDED_AT,
  planningValidated: false,
  owner: "",
  priority: null,
  tags: [],
  milestones: [],
  dependsOn: [],
  relatedInitiativeIds: [],
  risks: [],
  pendingDecisions: [],
  platformNotes: {},
  journeys: [],
  userProfiles: [],
  areas: [],
  technicalDependencies: [],
  operationalImpacts: [],
  evidence: [],
  documents: [],
  prototypes: [],
  metrics: [],
  currentContext: "",
  userPain: "",
  hypothesis: "",
  audience: "",
  objectives: [],
  deliverables: [],
  customImage: null,
} satisfies Partial<Initiative>;

/** Etapas padrão, com a primeira no estado indicado (nenhuma etapa está concluída nos dados iniciais). */
const phases = (first: PhaseState) => defaultPhases().map((p, idx) => (idx === 0 ? { ...p, state: first } : p));

const created = (id: string) => ({
  id: `${id}-h1`,
  at: SEEDED_AT,
  description: "Iniciativa cadastrada como conteúdo inicial de demonstração.",
});

export const seedInitiatives: Initiative[] = [
  {
    ...base,
    id: "JG-2027-001",
    repoFolder: "initiatives/JG-2027-001-autenticacao-estudante",
    title: "Login simplificado do estudante",
    summary: "Permitir que estudantes acessem a plataforma por QR Code ou código de ícones, além de e-mail e senha.",
    category: "Acesso e identidade",
    tags: ["Acesso", "Experiência do estudante", "Segurança"],
    illustration: "login-qr",
    objectives: [
      "Oferecer acesso por QR Code e por código de ícones espaciais.",
      "Manter o login por e-mail e senha.",
      "Permitir emissão e reemissão de credenciais no Admins.",
      "Garantir segurança e continuidade dos cadastros existentes.",
    ],
    deliverables: [
      "Login por QR Code",
      "Login por código de ícones espaciais",
      "Emissão e reemissão de credenciais no Admins",
      "Controle de permissão de acesso",
      "Histórico de uso e alterações",
    ],
    phases: phases("em_andamento"),
    problem:
      "Estudantes em fase de alfabetização podem enfrentar dificuldades para realizar login com e-mail e senha, aumentando a dependência de professores e responsáveis.",
    currentContext:
      "O Admins é a plataforma central de cadastro e gerenciamento de usuários. O acesso convencional do estudante é feito por e-mail e senha, exigindo que a criança saiba identificar, digitar e, eventualmente, recuperar suas credenciais. A dificuldade envolve também emissão e distribuição de credenciais, troca de usuários em dispositivos compartilhados e procedimentos administrativos.",
    audience:
      "Estudantes do Ensino Fundamental I, especialmente crianças em fase de alfabetização. Também afeta professores, gestores escolares e a equipe de suporte.",
    userPain:
      "Não conseguir entrar sozinho na plataforma por depender da leitura e digitação de credenciais textuais.",
    motivator:
      "Estudantes em fase de alfabetização enfrentam barreiras para entrar usando e-mail e senha. A iniciativa busca ampliar a autonomia e reduzir a dependência de professores.",
    hypothesis:
      "Se oferecermos acesso por QR Code individual e por código visual espacial, mantendo o login por e-mail e senha e o cadastro centralizado no Admins, estudantes em alfabetização conseguirão acessar o Exploradores com mais autonomia, sem comprometer a segurança nem os cadastros existentes.",
    expectedOutcome: "Mais acessos bem-sucedidos e menos fricção no início da jornada.",
    quarter: "Q1",
    status: "definicao",
    milestones: [
      { id: "m1", title: "Descoberta e definição", quarter: "Q1", date: "", done: false },
      { id: "m2", title: "Construção do MVP", quarter: "Q2", date: "", done: false },
      { id: "m3", title: "Piloto e validação", quarter: "Q3", date: "", done: false },
      { id: "m4", title: "Expansão progressiva", quarter: "Q4", date: "", done: false },
    ],
    risks: [
      "Compartilhamento do cartão: o QR Code impresso pode ser fotografado ou emprestado.",
      "Baixa segurança do código visual: sequências curtas podem ser adivinhadas ou observadas.",
      "Duplicação de estudantes ao associar credenciais a cadastros existentes.",
      "Falhas de distribuição: cartões entregues ao estudante errado ou em circulação após reemissão.",
      "Inconsistência entre plataformas: Admins e serviço de autenticação divergindo sobre a credencial.",
      "Impacto em usuários existentes: mudanças de autenticação interrompendo acessos atuais.",
      "Complexidade operacional: emissão em massa sem distribuição efetiva dos cartões.",
    ],
    pendingDecisions: [
      "Emissão automática ou manual de credenciais para novos estudantes.",
      "Emissão em lote como requisito do MVP ou após o piloto.",
      "Comprimento da sequência e conjunto definitivo de ícones do código visual.",
      "Política de validade, reemissão e proteção do QR Code.",
      "Comportamento das sessões ativas quando o acesso for bloqueado.",
      "Perfis do Admins que podem emitir, reemitir, revogar e bloquear em cada nível da hierarquia.",
      "Mecanismo de habilitação dos estudantes já cadastrados.",
      "Política de saída e troca de estudante em dispositivos compartilhados.",
      "Formato da carteirinha e dados que podem aparecer nela.",
      "Ferramentas e padrões de instrumentação e análise.",
    ],
    platformIds: ["admins", "exploradores"],
    platformNotes: {
      admins: "Gestão de credenciais, permissões e operação.",
      exploradores: "Experiência de acesso do estudante.",
    },
    journeys: [
      "Entrada do estudante no Exploradores",
      "Emissão, reemissão e revogação de credenciais no Admins",
      "Troca de estudante em dispositivo compartilhado",
      "Habilitação de estudantes já cadastrados",
    ],
    userProfiles: [
      "Estudante em fase de alfabetização",
      "Estudante que usa e-mail e senha",
      "Professor ou responsável pela turma",
      "Administrador ou gestor escolar",
      "Equipe de suporte e operação",
    ],
    areas: ["Produto", "UX", "Engenharia", "Segurança", "Dados"],
    technicalDependencies: [
      "Levantamento do fluxo atual de autenticação do Exploradores.",
      "Mapeamento do modelo de usuário e das relações cadastrais do Admins.",
      "Identificação dos endpoints de autenticação existentes.",
      "Definição do modelo de armazenamento e validação das credenciais.",
      "Instrumentação dos eventos analíticos.",
    ],
    operationalImpacts: [
      "Definição do processo de geração, impressão e distribuição de carteirinhas.",
      "Revisão da matriz de permissões do Admins.",
      "Plano de migração e ativação gradual dos métodos simplificados.",
      "Revisão de segurança e privacidade antes da produção.",
    ],
    documents: [
      {
        id: "prd",
        title: "Login simplificado do estudante",
        kind: "prd",
        source: "repo",
        path: "initiatives/JG-2027-001-autenticacao-estudante/prd.md",
        url: "",
        version: "1.0",
        status: "em_revisao",
        updatedAt: "2026-10-16",
        versions: [
          { version: "1.0", date: "2026-10-16", note: "PRD recebido e importado para o repositório." },
        ],
      },
      {
        id: "decisoes",
        title: "Decisões e dependências",
        kind: "decisoes",
        source: "repo",
        path: "initiatives/JG-2027-001-autenticacao-estudante/decisions.md",
        url: "",
        version: "",
        status: "rascunho",
        updatedAt: "2026-10-16",
        versions: [],
      },
      {
        id: "contexto",
        title: "Contexto da iniciativa",
        kind: "contexto",
        source: "repo",
        path: "initiatives/JG-2027-001-autenticacao-estudante/initiative.md",
        url: "",
        version: "",
        status: "rascunho",
        updatedAt: "2026-10-16",
        versions: [],
      },
    ],
    prototypes: [
      {
        id: "credenciais",
        name: "Protótipo navegável",
        description:
          "Protótipo conceitual com a gestão de credenciais no Admins e a entrada do estudante. A leitura de QR Code, a validação de credenciais e a criação de sessão são simuladas.",
        source: "repo",
        path: "initiatives/JG-2027-001-autenticacao-estudante/prototype/index.html",
        url: "",
        platformIds: ["admins", "exploradores"],
        flows: [
          "Admins — lista de credenciais dos estudantes com filtros por escola e status.",
          "Admins — gerenciar acesso: emitir, reemitir, revogar e gerar cartão para impressão.",
          "Admins — histórico de uso e histórico administrativo.",
          "Estudante — escolha entre ler o cartão (QR Code) ou usar o código.",
          "Estudante — feedback de sucesso e de falha na validação.",
        ],
        status: "conceito",
      },
    ],
    metrics: [
      {
        id: "taxa-sucesso",
        indicator: "Taxa de acesso simplificado bem-sucedido",
        baseline: "",
        baselineState: "pendente",
        target: "",
        targetState: "pendente",
        method:
          "Autenticações simplificadas bem-sucedidas ÷ tentativas de autenticação simplificada × 100, por método, plataforma e contexto de uso.",
        observed: "",
        lastEvaluatedAt: "",
      },
      {
        id: "tempo-mediano",
        indicator: "Tempo mediano entre o início do fluxo e a autenticação",
        baseline: "",
        baselineState: "pendente",
        target: "",
        targetState: "pendente",
        method: "Eventos de instrumentação do fluxo de entrada, sem registrar credenciais.",
        observed: "",
        lastEvaluatedAt: "",
      },
      {
        id: "intervencao-professor",
        indicator: "Proporção de acessos que exigem intervenção do professor",
        baseline: "",
        baselineState: "pendente",
        target: "",
        targetState: "pendente",
        method: "Testes de usabilidade ou observação em contexto escolar.",
        observed: "",
        lastEvaluatedAt: "",
      },
    ],
    history: [created("JG-2027-001")],
  },
  {
    ...base,
    "title": "Batalhas Solo e Versus (VS)",
    "summary": "Transformar a prática de questões em desafios: enfrente o Nexo (Solo) ou desafie um colega (VS) em 10 questões.",
    "category": "Engajamento e gamificação",
    "tags": [
      "Gamificação",
      "Batalhas",
      "Engajamento"
    ],
    "illustration": "nexo",
    "problem": "A resolução tradicional de questões pode ser percebida como repetitiva, individual e pouco estimulante. O estudante nem sempre encontra motivos para continuar praticando conteúdos além das atividades obrigatórias, e a ausência de desafios entre colegas reduz as oportunidades de transformar a prática em uma experiência social e competitiva.",
    "currentContext": "A Geniex ainda não possui uma experiência competitiva de prática. O PRD (v2.0, outubro de 2026) propõe a área de Batalhas com duas modalidades: Solo, contra o Nexo (personagem oficial), e Versus, entre estudantes elegíveis da mesma sala ou escola e do mesmo ano escolar. Cada rodada tem 10 questões e até 10 minutos; no VS, o desafiado tem até 24 horas para responder.",
    "audience": "Estudantes da plataforma Geniex (o Nexo representa a cara do Ensino Médio).",
    "userPain": "Prática de questões repetitiva e individual, sem motivo para continuar além do que a escola exige e sem oportunidade de desafiar colegas.",
    "motivator": "Aumentar o engajamento, a frequência de acesso e a recorrência de uso na Geniex, o volume de questões respondidas voluntariamente e a prática de diferentes disciplinas e tópicos, estimulando a competição saudável entre estudantes e criando uma base para futuras mecânicas de gamificação.",
    "evidence": [],
    "hypothesis": "Se o estudante puder escolher o que praticar e disputar 10 questões em até 10 minutos contra o Nexo ou contra um colega, com nota imediata, gabarito, revanche e histórico, ele praticará mais e com maior recorrência. (Hipótese a validar: ainda não há dados de adesão ou linha de base.)",
    "expectedOutcome": "Uma experiência de aprendizagem competitiva, personalizada e dinâmica: o estudante escolhe os conteúdos, responde a 10 questões em até 10 minutos e recebe feedback imediato sobre seu desempenho.",
    "objectives": [
      "Aumentar o engajamento e a recorrência de uso dos estudantes na Geniex.",
      "Aumentar o volume de questões respondidas voluntariamente.",
      "Estimular a competição saudável entre estudantes da mesma etapa escolar.",
      "Incentivar a prática de diferentes disciplinas e tópicos.",
      "Criar uma base para futuras mecânicas de gamificação e reconhecimento."
    ],
    "deliverables": [
      "Área de Batalhas (entrada e escolha da modalidade)",
      "Batalha Solo contra o Nexo",
      "Batalha Versus (desafio assíncrono)",
      "Seleção de 1 a 3 disciplinas com 1 tópico por disciplina",
      "Cronômetro de 10 minutos, nota e gabarito",
      "Prazo de 24 horas e encerramento por W.O.",
      "Revanche e histórico (P1, a confirmar no MVP)"
    ],
    "quarter": null,
    "priority": null,
    "status": "definicao",
    "planningValidated": false,
    "owner": "",
    "milestones": [],
    "phases": [
      {
        "id": "fase-1",
        "title": "Fase 1 — Validação de regras",
        "state": "em_andamento"
      },
      {
        "id": "fase-2",
        "title": "Fase 2 — UX/UI e especificação",
        "state": "pendente"
      },
      {
        "id": "fase-3",
        "title": "Fase 3 — Núcleo da Batalha Solo",
        "state": "pendente"
      },
      {
        "id": "fase-4",
        "title": "Fase 4 — Batalha Versus",
        "state": "pendente"
      },
      {
        "id": "fase-5",
        "title": "Fase 5 — Revanche e histórico",
        "state": "pendente"
      },
      {
        "id": "fase-6",
        "title": "Fase 6 — QA e lançamento",
        "state": "pendente"
      }
    ],
    "dependsOn": [],
    "relatedInitiativeIds": [],
    "risks": [
      "Questões insuficientes em algum tópico impedirem a geração de uma rodada válida.",
      "Rodadas VS sem equivalência de conteúdo e dificuldade gerarem comparações injustas.",
      "Falha de conexão durante a rodada causar perda de respostas ou do tempo.",
      "Mudança de vínculo escolar durante uma disputa em andamento.",
      "Estudantes interpretarem o resultado competitivo como valor acadêmico (a comunicação deve evitar essa associação)."
    ],
    "pendingDecisions": [
      "Distribuição aleatória: pelo menos 3 questões por tópico e restantes aleatórias (Produto + Pedagógico + Engenharia).",
      "Equivalência das rodadas VS: conjuntos distintos, equivalentes em conteúdo e dificuldade (Produto + Pedagógico).",
      "Início do cronômetro: quando o estudante começar efetivamente o quiz (Produto + Engenharia).",
      "Falha de conexão: preservar respostas registradas e respeitar o limite de tempo (Engenharia).",
      "Prazo de 24 horas: contado a partir do registro válido do desafio (Produto + Engenharia).",
      "Conclusão da rodada: após a décima resposta ou encerramento por tempo (Produto + Engenharia).",
      "Disponibilidade de questões: impedir o início se a configuração não gerar uma rodada válida (Engenharia + Pedagógico).",
      "Revanche e histórico: confirmar inclusão no MVP ou em release subsequente (Produto).",
      "Mudança de vínculo escolar: preservar a disputa registrada e definir exceções (Produto + Engenharia)."
    ],
    "platformIds": [
      "geniex"
    ],
    "platformNotes": {
      "geniex": "Funcionalidade exclusiva: Batalhas Solo e VS na experiência do estudante."
    },
    "journeys": [
      "Entrada na área de Batalhas",
      "Escolha de disciplinas e tópicos",
      "Rodada de 10 questões com cronômetro",
      "Resultado e gabarito",
      "Desafio VS (desafiante e desafiado)",
      "Revanche e histórico"
    ],
    "userProfiles": [
      "Estudantes da Geniex (Ensino Médio)"
    ],
    "areas": [
      "Produto",
      "Design",
      "Engenharia",
      "Pedagógico"
    ],
    "technicalDependencies": [
      "Autenticação e identificação de estudantes.",
      "Dados de vínculo escolar, sala e ano escolar.",
      "Catálogo de disciplinas e tópicos.",
      "Banco de questões com gabaritos e metadados de disciplina e tópico.",
      "Infraestrutura de persistência de respostas.",
      "Controle de tempo e encerramento automático (cronômetro validado no servidor).",
      "Mecanismo de expiração de desafios e W.O. (funciona sem participantes conectados).",
      "Sistema de notificações, caso disponível.",
      "Design system vigente da Geniex."
    ],
    "operationalImpacts": [
      "Regras pedagógicas para distribuição e equivalência de questões.",
      "Lançamento controlado com amostra de estudantes ou escolas.",
      "Monitoramento de métricas e ocorrências técnicas após o lançamento."
    ],
    "documents": [
      {
        "id": "prd",
        "title": "Batalhas Solo e Versus (VS) | Geniex",
        "kind": "prd",
        "source": "repo",
        "path": "initiatives/JG-2027-002-batalhas-solo-e-versus-vs/prd.md",
        "url": "",
        "version": "2.0",
        "status": "em_revisao",
        "updatedAt": "2026-10-16",
        "versions": [
          {
            "version": "2.0",
            "date": "2026-10-16",
            "note": "PRD v2.0 (outubro de 2026) importado para o repositório."
          }
        ]
      },
      {
        "id": "decisoes",
        "title": "Decisões e pendências",
        "kind": "decisoes",
        "source": "repo",
        "path": "initiatives/JG-2027-002-batalhas-solo-e-versus-vs/decisions.md",
        "url": "",
        "version": "",
        "status": "rascunho",
        "updatedAt": "2026-10-16",
        "versions": []
      },
      {
        "id": "contexto",
        "title": "Contexto da iniciativa",
        "kind": "contexto",
        "source": "repo",
        "path": "initiatives/JG-2027-002-batalhas-solo-e-versus-vs/initiative.md",
        "url": "",
        "version": "",
        "status": "rascunho",
        "updatedAt": "2026-10-16",
        "versions": []
      }
    ],
    "prototypes": [
      {
        "id": "telas",
        "name": "Telas de referência do fluxo",
        "description": "Galeria navegável com 12 mockups do fluxo de Batalhas (área de batalhas, introdução Solo e VS, escolha de oponente, seleção de disciplinas e tópicos, quiz com cronômetro, resultados, gabarito, histórico) e a ficha do Nexo. Não há lógica de quiz nem dados reais.",
        "source": "repo",
        "path": "initiatives/JG-2027-002-batalhas-solo-e-versus-vs/prototype/index.html",
        "url": "",
        "platformIds": [
          "geniex"
        ],
        "flows": [
          "Área de Batalhas e escolha da modalidade (Solo ou VS).",
          "Introdução da Batalha Solo com o Nexo e da Batalha VS.",
          "Escolha do oponente e confirmação do desafio.",
          "Seleção de 1 a 3 disciplinas com 1 tópico cada.",
          "Quiz de 10 questões com cronômetro de 10 minutos.",
          "Resultado Solo (vitória, empate, derrota) e resultado VS.",
          "Gabarito e histórico de batalhas.",
          "Ficha do personagem Nexo."
        ],
        "status": "conceito"
      }
    ],
    "metrics": [
      {
        "id": "taxa-adesao",
        "indicator": "Taxa de adesão",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Estudantes elegíveis que iniciam pelo menos uma batalha ÷ estudantes elegíveis.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "batalhas-iniciadas",
        "indicator": "Batalhas iniciadas",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Quantidade de batalhas iniciadas por período.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "taxa-conclusao",
        "indicator": "Taxa de conclusão",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Rodadas finalizadas (no prazo ou antecipadamente) ÷ rodadas iniciadas.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "estouro-tempo",
        "indicator": "Taxa de estouro de tempo",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Rodadas encerradas pelo limite de 10 minutos ÷ rodadas iniciadas.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "resposta-desafios",
        "indicator": "Taxa de resposta aos desafios",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Desafios VS respondidos em até 24 horas ÷ desafios VS enviados.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "taxa-wo",
        "indicator": "Taxa de W.O.",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Desafios VS encerrados por ausência de resposta ÷ desafios VS enviados.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "taxa-revanche",
        "indicator": "Taxa de revanche",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Disputas elegíveis que geram uma nova batalha ÷ disputas elegíveis.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "diversidade",
        "indicator": "Diversidade de conteúdos",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Distribuição de batalhas entre disciplinas e tópicos disponíveis.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "taxa-acerto",
        "indicator": "Taxa de acerto",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Respostas corretas ÷ respostas nas rodadas.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "uso-gabarito",
        "indicator": "Uso do gabarito",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Estudantes que consultam o gabarito após a rodada ÷ estudantes que concluíram rodadas.",
        "observed": "",
        "lastEvaluatedAt": ""
      },
      {
        "id": "recorrencia",
        "indicator": "Recorrência",
        "baseline": "",
        "baselineState": "pendente",
        "target": "",
        "targetState": "pendente",
        "method": "Estudantes que participam de batalhas em mais de um dia ou período de análise.",
        "observed": "",
        "lastEvaluatedAt": ""
      }
    ],
    "id": "JG-2027-002",
    "repoFolder": "initiatives/JG-2027-002-batalhas-solo-e-versus-vs",
    "createdAt": "2026-10-16T16:00:00.000Z",
    "updatedAt": "2026-10-16T16:00:00.000Z",
    "history": [
      {
        "id": "JG-2027-002-h1",
        "at": "2026-10-16T16:00:00.000Z",
        "description": "Iniciativa criada a partir do PRD de Batalhas Solo e Versus (v2.0)."
      }
    ]
  },
];
