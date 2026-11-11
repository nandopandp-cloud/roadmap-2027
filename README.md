# Jovens Gênios — Roadmap 2027

Repositório central de planejamento, documentação e acompanhamento das iniciativas de Produto da Jovens Gênios.

Cada iniciativa conecta **um problema real** a **uma decisão de Produto**, **uma experiência proposta** (protótipo), **uma documentação rastreável** (PRD e decisões) e **um resultado que possa ser validado**.

> As quatro iniciativas iniciais (JG-2027-001 a 004) são conteúdo de demonstração. Quarters e prioridades estão marcados como **"a validar"** e não representam compromissos aprovados.

## Sumário

- [Como executar](#como-executar)
- [O que a aplicação faz](#o-que-a-aplicação-faz)
- [Arquitetura](#arquitetura)
- [Organização do repositório](#organização-do-repositório)
- [Persistência](#persistência)
- [PRDs e protótipos](#prds-e-protótipos)
- [Segurança e limitações](#segurança-e-limitações)
- [Decisões técnicas](#decisões-técnicas)

## Como executar

Requisitos: Node.js 20+ (testado com 22) e npm.

```bash
npm install
npm run dev          # http://localhost:3000 (desenvolvimento)

npm run build        # build de produção
npm start            # servidor de produção

npm run typecheck    # verificação de tipos
npm run db:reset     # apaga o banco local; ele é recriado a partir de data/seed
```

Variáveis de ambiente (opcionais) estão em [.env.example](.env.example). Nenhuma é obrigatória para rodar localmente.

## O que a aplicação faz

A navegação tem exatamente quatro seções:

| Seção | Rota | Conteúdo |
| --- | --- | --- |
| **Contexto** | `/contexto` | Duas abas (`?visao=`). **Proposta do Roadmap 2027**: abertura e seções com ilustração, resumo, etapas em cartões e “Ler texto completo” (texto original preservado). **Plataformas e indicadores** (`plataformas`): um card por plataforma com foco, resumo, números em destaque (indicadores/metas marcados como destaque), principais resultados e, ao expandir, todos os indicadores, metas (*proposta/aprovada/pendente*), o porquê e as iniciativas da plataforma (derivadas); depois “Como saberemos se estamos evoluindo?”. Tudo editável. Ilustrações: `contexto-*.svg` em `public/illustrations/`; um `contexto-<nome>.png` com o mesmo nome substitui o SVG automaticamente. |
| **Iniciativas** | `/iniciativas` | Catálogo com busca (atalho ⌘K/Ctrl+K), abas de status com contadores, filtros combináveis (quarter, plataforma, categoria), ordenação, visualização em lista ou grade e criação/edição. Clicar em um card abre o **drawer lateral** de detalhes. |
| **Roadmap** | `/roadmap` | Duas visões (`?visao=gantt`). **Cards**: quatro colunas (Q1–Q4) com as iniciativas, seus marcos em outros quarters, dependências e iniciativas sem quarter; os cards podem ser **arrastados** entre quarters e reordenados (mouse, toque longo no celular ou Alt + setas no teclado), com indicação do ponto exato de inserção. A ordem fica gravada (`roadmapOrder`) e a mudança entra no histórico. **Gantt**: linha do tempo mensal com a barra do quarter de cada iniciativa (status e progresso das etapas) e os marcos — na data, quando informada; sem data, em posição aproximada dentro do quarter. Abaixo da barra, o **esforço estimado** em semanas de Design (rosa) e de Engenharia (azul), informado pelos responsáveis no próprio Gantt ou na aba Roadmap do drawer (`effort`): design começa no início do quarter e engenharia logo após o design, salvo início em paralelo ou em data informada; quando a soma passa do quarter, o Gantt sinaliza quantas semanas. Cada frente tem sua **Justificativa** (`effortEvidence`): arquivos (imagem, PDF, Word, planilha, apresentação, .fig; até 10 MB, 20 por frente) e links (Figma, Google Docs…) que embasam as semanas, salvos assim que enviados e listados também no drawer. Na barra, os botões **Marcos** e **Esforço** (só no Gantt) ligam e desligam essas camadas. **Tela cheia**: as duas visões abrem ocupando a janela inteira (sem sidebar e banner), com os mesmos filtros e legenda; no Gantt, a coluna de iniciativas e o cabeçalho dos meses ficam fixos ao rolar. O drawer abre por cima e Esc sai da tela cheia. **Ano** (`?ano=2026`): o seletor no topo da página — *2026 · Execução e entregas* e *2027 · Planejamento e priorização* (versão compacta na tela cheia; setas no teclado) — troca o roadmap exibido, cada um com suas informações e comportamentos. O **Roadmap 2026** (julho/2026 a abril/2027) nasceu da planilha do time (“Roadmap - 2026/02”, aba *Cenário atual*; `data/seed/roadmap-2026.ts`), importada uma única vez para o banco (`roadmap_2026`) com o status inicial lido das cores. Cada iniciativa tem **status calculado**: Concluída só quando todas as frentes com responsável (ou já começadas) estão concluídas; senão Atrasada se o fim projetado passou, Em andamento se alguma frente começou, ou Planejada. E fases por tipo de trabalho (Design, Engenharia, QA ou não informada). Em Cards, cada uma fica no trimestre em que termina sua última semana; no Gantt, semana a semana (S1–S4) por squad, com as barras **arrastáveis** (mover) e **redimensionáveis** pela borda direita (setas e Shift + setas no teclado). A janela de edição (clique no card, no status ou clique duplo na barra) mostra o status calculado e o motivo e altera nome, subtítulo, squad, **responsáveis** (pessoas de Times & Squads por frente — Design, Engenharia e QA —, só dos squads da plataforma da iniciativa e com a função da frente (Design, Engenharia ou QA em Times & Squads), exibidas com avatar nos cards e no Gantt), backlog e as semanas de cada fase, e remove a iniciativa; tudo entra no histórico do item. Design e QA podem ser retirados da iniciativa quando não se aplicam (“Não se aplica”, `skippedTracks`): somem do card e do Gantt e não contam para a conclusão. O botão **Expandir todos / Recolher todos** (só no 2026) mostra ou oculta as frentes de cada iniciativa no Gantt e nos Cards; começa recolhido e a escolha fica no navegador. Cada frente (Design, Engenharia e QA) tem seu **andamento** (Não iniciado, Em andamento, Concluído), exibido em pílulas com os avatares no Gantt e nos cards; esse andamento é o que define o status da iniciativa. Ao lado da plataforma, o **status da iniciativa** é um conjunto de botões coloridos (liga/desliga, com contagens) e o filtro **Áreas** abre uma grade área × status da área (ex.: “Design em andamento”); a linha **Filtrando:** mostra os filtros ativos como etiquetas removíveis, com “Limpar filtros”, e o botão **“N atrasadas”** abre a lista das que passaram do fim projetado sem conclusão (com atalho para filtrar só elas). No Gantt, a coluna da iniciativa inteira abre a edição e a alça ⋮⋮ muda a ordem dentro do squad (arrastar, toque longo ou setas; `POST /api/roadmap/2026/<id>/ordem`). Rotas: `GET /api/roadmap/2026`, `PATCH`/`DELETE /api/roadmap/2026/<R26-NNN>`. |
| **Times & Squads** | `/times` | Organograma: lideranças → squads → colaboradores (um squad pode ter várias lideranças e uma pessoa pode participar de vários squads). Abas *Organograma* (modos organograma e lista, “Expandir todos”), *Squads*, *Colaboradores* e *Visão por áreas* (`?visao=`), com busca e filtros por área, squad e cargo. Criar, editar e remover colaboradores e squads; **realocar** arrastando o card (mouse ou toque longo) entre squads ou para o topo de um grupo (liderança) — com Alt/Option ao soltar, a pessoa é incluída no destino sem sair da origem — ou pela opção *Realocar*; **substituir** alguém (o substituto assume squads, posições, squads liderados, liderados e, opcionalmente, cargo e responsabilidades). Detalhes no painel lateral (`?colaborador=<id>`). Iniciativas relacionadas são derivadas das plataformas dos squads e do campo “responsável”. |

**Drawer de detalhes** — abre à direita sobre a página, com camada escura por trás (≈44% da largura no desktop, mín. 620px; 94% no tablet; tela cheia no celular). Esc ou clique na camada escura fecham. Abas: *Visão geral*, *PRD*, *Protótipo*, *Roadmap* (alteração rápida de quarter/prioridade/status, marcos, histórico) e *Dependências* (relações, riscos, decisões pendentes). A iniciativa e a aba ficam na URL — `/iniciativas?iniciativa=JG-2027-001&aba=prd` — para compartilhar links diretos.

**Documentos** — `/iniciativas/<id>/documentos/<docId>` exibe o Markdown com sumário por seções; `?editar=1` abre o editor com pré-visualização, registro de versão e nota de alteração. O conteúdo é gravado no arquivo do repositório.

**Protótipos** — `/iniciativas/<id>/prototipos/<protoId>` mostra o HTML local em um iframe isolado (com larguras desktop/tablet/celular) e permite abrir em nova aba.

## Arquitetura

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4. Dependências de runtime: `lucide-react` (ícones), `zod` (validação), `react-markdown` + `remark-gfm` (leitura de PRDs).

```text
Interface (components/, app/*/page.tsx)      ← componentes cliente
   │  lib/client/store.tsx  (estado compartilhado; recarrega do servidor após cada alteração)
   │  lib/client/api.ts     (fetch tipado)
   ▼
Rotas de API (app/api/**/route.ts)           ← finas: só convertem HTTP ⇄ serviço
   ▼
Serviços (lib/services/)                     ← regras de negócio
   │  roadmap-service.ts  IDs, duplicidade, integridade de relacionamentos, histórico
   │  artifacts.ts        leitura/escrita segura de arquivos em initiatives/
   ▼
Repositório (lib/repositories/)              ← persistência atrás de uma interface
      types.ts                 RoadmapRepository (contrato)
      json-file-repository.ts  implementação atual (arquivo JSON)
```

- **Validação centralizada**: [lib/validation/schemas.ts](lib/validation/schemas.ts) define os schemas Zod usados no servidor *e* nos formulários. Os tipos de domínio ([lib/domain/types.ts](lib/domain/types.ts)) são derivados deles.
- **Vocabulário controlado**: status, prioridades, quarters etc. em [lib/domain/constants.ts](lib/domain/constants.ts); rótulos em pt-BR em [lib/domain/labels.ts](lib/domain/labels.ts).
- **Tokens de design**: [app/globals.css](app/globals.css) (`@theme`). Tons de badges em [lib/client/tones.ts](lib/client/tones.ts).

### Regras de negócio implementadas

- IDs estáveis `JG-2027-NNN`, gerados no servidor (maior número existente + 1).
- Nomes de iniciativa únicos (comparação sem acentos/maiúsculas) — evita duplicação acidental; o formulário também bloqueia envio duplo.
- Dependências e relacionamentos só podem apontar para iniciativas existentes (e não para si mesma); plataformas precisam existir.
- Excluir uma iniciativa remove as referências a ela em outras iniciativas e problemas (registrado no histórico de cada uma). Os arquivos em `initiatives/` **não** são apagados.
- Plataformas vinculadas a iniciativas não podem ser excluídas.
- Mudanças relevantes (status, quarter, prioridade, nome, documentos, protótipos, dependências, plataformas, validação do planejamento) são registradas no histórico da iniciativa com data.
- Uma iniciativa com mais de uma plataforma é **transversal**: continua sendo um único registro; seus marcos aparecem nos quarters correspondentes do roadmap.
- Métricas distinguem valores *definidos / estimados / pendentes* e metas *aprovadas / propostas / pendentes*. Nada é calculado ou presumido.
- **Progresso** = etapas concluídas ÷ total de etapas (padrão: Discovery e levantamento, Design e protótipo, Desenvolvimento, Homologação, Lançamento — editáveis). O percentual nunca é digitado manualmente; nos dados iniciais nenhuma etapa está concluída.

## Organização do repositório

```text
app/                    rotas (páginas e API)
components/
  layout/               sidebar, shell, cabeçalhos, logo
  initiatives/          cards, drawer (abas), formulário em 6 etapas
  roadmap/              visão trimestral
  context/              tela de contexto e editores
  documents/            leitor/editor Markdown e visualizador de protótipos
  ui/                   botões, badges, campos, diálogos, toasts, estados vazios
  platforms/ illustrations/
lib/
  domain/  validation/  repositories/  services/  client/  http/
data/
  seed/                 dados iniciais (TypeScript, versionados)
  local/                banco local gerado (ignorado pelo git)
initiatives/
  JG-2027-001-autenticacao-estudante/
    initiative.md       narrativa da iniciativa
    prd.md              especificação detalhada
    decisions.md        decisões e justificativas
    prototype/index.html
  JG-2027-00X-…/
public/
  brand/                logo oficial (arquivo original)
  illustrations/        ilustrações (arte oficial do Exploradores + SVGs no mesmo estilo)
scripts/reset-db.mjs
```

**Associação registro ↔ arquivos**: cada iniciativa tem `repoFolder` (definido na criação e estável mesmo que o título mude). Documentos e protótipos guardam o caminho relativo à raiz (`initiatives/<pasta>/prd.md`). O banco é a fonte operacional (status, quarter, métricas…); os arquivos Markdown são a fonte do conteúdo longo e versionável. Não há pastas `roadmap/q1.md…q4.md`: o roadmap é derivado dos registros, para não duplicar informação.

## Persistência

A camada de persistência é escolhida automaticamente ([lib/repositories/index.ts](lib/repositories/index.ts)):

| Ambiente | Armazenamento |
| --- | --- |
| Com `DATABASE_URL` / `POSTGRES_URL` (produção na Vercel, banco **Neon "Roadmap-JG"**) | **Postgres** — iniciativas, plataformas, contexto, histórico, colaboradores e squads, e conteúdo dos documentos Markdown |
| Sem variável de banco (desenvolvimento) | Arquivo JSON `data/local/db.json` + documentos em `initiatives/` |

### Postgres (Neon)

- Tabelas (criadas automaticamente na primeira conexão): `initiatives`, `platforms`, `strategy_context`, `documents` e `roadmap_meta`. Cada iniciativa/plataforma é um registro JSONB validado pelos schemas Zod.
- **Importação inicial**: com o banco vazio, o app importa os dados existentes (`data/local/db.json`, se houver, ou os dados iniciais de `data/seed/`) e o conteúdo de todos os `.md` de `initiatives/`. Isso acontece uma única vez (`roadmap_meta.schema_version`).
- Alterações rodam em transação com lock consultivo (`pg_advisory_xact_lock`), gravando apenas os registros alterados.
- Documentos: o conteúdo salvo pela interface fica na tabela `documents`. Os arquivos em `initiatives/` são a versão inicial versionada no git; editar pela interface **não** altera o arquivo do repositório.
- **Imagens enviadas** (editor de imagem da iniciativa) ficam na tabela `images` (bytea); sem banco, em `data/local/images/`. Cada envio gera duas imagens: o recorte quadrado (800 px) e uma cópia original reduzida (1600 px) para permitir reeditar zoom, rotação, espelhamento e corte. Imagens substituídas não são apagadas automaticamente.
- Para trabalhar localmente no mesmo banco, coloque a `DATABASE_URL` da Neon em `.env.local` (nunca no código).

### Arquivo local

Sem banco configurado, os dados ficam em `data/local/db.json` (gitignored), com escrita atômica. Em ambientes com disco somente leitura e sem banco, o app funciona apenas para leitura, mostra um aviso no topo e responde 503 às edições.

## PRDs e protótipos

- **Criar iniciativa a partir do PRD**: *Iniciativas* → *Criar a partir do PRD* (ou a busca ⌘K). Cole o texto completo do PRD (ou carregue um `.md`/`.txt`); o servidor ([lib/services/prd-import.ts](lib/services/prd-import.ts)) localiza as seções pelo título — visão geral, cenário atual, problema principal, oportunidade, objetivos, público-alvo, requisitos funcionais, fluxos, métricas, riscos, dependências, decisões pendentes — e o cabeçalho (`**Status:**`, `**Prioridade:**`, `**Plataformas:**` ou tabela *Campo | Valor*) e preenche os campos das etapas, exceto protótipo. A extração copia trechos do próprio PRD (não resume nem inventa): o que não for encontrado fica vazio, métricas entram sem valores (pendentes) e status/plataformas não reconhecidos geram aviso. O usuário cria direto ou revisa nas 6 etapas; ao criar, o texto original é gravado sem alterações em `initiatives/<pasta>/prd.md` e associado como PRD — na mesma transação (se o PRD não puder ser gravado, a iniciativa não é criada).
- **Documento em texto no formulário**: na etapa *Documentação e protótipo*, a origem *Texto (escrever ou colar aqui)* — padrão para novos documentos — aceita o PRD (ou outro documento) em texto corrido. Ao salvar a iniciativa, o servidor grava o texto como Markdown na pasta da iniciativa (`prd.md`, `decisions.md`, `contexto.md` ou `documento.md`, com sufixo `-2`, `-3`… se o nome já existir) e guarda só a referência `repo`; o campo `content` nunca é persistido na iniciativa. Escolher *Texto* num documento já gravado carrega o conteúdo atual para edição e, ao salvar, substitui o arquivo (com entrada de versão e histórico).
- **Criar PRD**: aba *PRD* → *Criar PRD* gera `initiatives/<pasta>/prd.md` a partir de um modelo e o associa à iniciativa (nunca sobrescreve um arquivo existente).
- **Editar PRD**: *Editar* no documento → salvar grava o arquivo e registra versão, data e nota no histórico de versões.
- **Vincular existente**: *Editar iniciativa* → etapa *Documentação e protótipo* → caminho no repositório (`initiatives/…/*.md`) ou link externo.
- **Protótipos**: coloque o HTML em `initiatives/<pasta>/prototype/` e cadastre o caminho na mesma etapa. Arquivos ausentes aparecem como "Arquivo não encontrado" — nunca como disponíveis.

Caminhos são validados (precisam começar com `initiatives/`, sem `..`) e resolvidos no servidor por `/api/documents` e `/prototipos/…`; não são URLs públicas de arquivo.

## Ilustrações enviadas pelo time

Artes usadas pela interface (versões otimizadas em `public/illustrations/`; originais em alta resolução em `assets/ilustracoes-originais/`). Se um arquivo não existir, a arte de fallback é usada sem erro:

| Arquivo | Onde aparece | Fallback |
| --- | --- | --- |
| `hero-banner.jpg` | Banner do topo de Contexto, Iniciativas e Roadmap | `hero-ceu.svg` |
| `sidebar-espaco.jpg` | Fundo da sidebar | gradiente + cena em SVG |
| `login-astronauta-qr.jpg` | Card da JG-2027-001 | `astronauta.svg` |
| `login-astronauta-celular.jpg` | Cabeçalho do drawer da JG-2027-001 | `login-astronauta-qr.jpg` |
| `astronauta-acenando.jpg` | Ilustração "Astronauta" (cards e formulário) | `astronauta.svg` |

Para trocar uma arte, substitua o arquivo mantendo o nome. Para gerar a versão otimizada a partir de um PNG grande (macOS): `sips -s format jpeg -s formatOptions 85 -Z 1100 original.png --out public/illustrations/nome.jpg`. O mockup de referência visual está em `docs/referencias/`.

## Segurança e limitações

- **Acesso por Google (SSO)**: a única forma de entrar é "Continuar com o Google" em `/login`. Só contas verificadas do domínio `jovensgenios.com` (e-mail `@jovensgenios.com` e domínio Workspace `hd`) são aceitas. A sessão é um cookie `httpOnly` assinado com HMAC (`AUTH_SECRET`), válido por 7 dias. Configuração em [.env.example](.env.example).
- **Perfis**: os e-mails em `EDITOR_EMAILS` ([lib/auth/config.ts](lib/auth/config.ts)) podem criar, editar, mover e remover conteúdo; as demais contas do domínio entram em modo **somente consulta** (os controles de edição somem da interface). Para mudar quem edita, altere essa lista; vale no próximo carregamento, sem novo login.
- **Roadmap 2026**: só o **Head de Produto**, o **Head de Engenharia**, os **tech leads** e a **coordenação de design** alteram (status, semanas, dados e remoção), pelo cargo do colaborador cujo e-mail é o da conta Google ([lib/domain/effort-access.ts](lib/domain/effort-access.ts) → `canPlanRoadmap2026For`). O perfil de editor sozinho não basta. As rotas `PATCH`/`DELETE /api/roadmap/2026/<id>` passam pelo proxy para perfis de consulta e o serviço confere o cargo ([lib/services/roadmap-2026.ts](lib/services/roadmap-2026.ts)). Todos consultam.
- **Esforço estimado**: além dos editores, **tech leads** estimam a frente de Engenharia e a **coordenação de design** a de Design. A permissão vem do organograma: o colaborador cujo e-mail é o da conta Google e cujo cargo é de tech lead ("Tech Lead", "Líder técnico") ou de coordenação de design ([lib/domain/effort-access.ts](lib/domain/effort-access.ts)). A rota `PATCH /api/initiatives/<id>/esforco` é a única alteração liberada no proxy para perfis de consulta; ela confere a frente permitida e recusa (403) mudanças na outra. A **justificativa** (anexos) é segmentada por time: quem tem a função **Design** no organograma (ou é da coordenação de design) anexa e remove só os documentos de Design; a função **Engenharia** (ou tech lead), só os de Engenharia; editores, os dois. Todos que acessam o roadmap veem e baixam os documentos das duas frentes. Rotas liberadas no proxy para essas pessoas, com checagem por frente no serviço ([lib/services/effort-attachments.ts](lib/services/effort-attachments.ts)): `POST /api/initiatives/<id>/esforco/anexos`, `DELETE …/esforco/anexos/<anexo>` e `PUT /api/esforco/partes/<envio>/<n>` (arquivos sobem em partes de até 3 MB por causa do limite de corpo das funções da Vercel e são montados ao concluir). Os arquivos ficam no Postgres (`effort_attachments`; em desenvolvimento, `data/local/attachments`) e são servidos por `GET /api/esforco/anexos/<id>` só para quem está conectado, com tipo definido pela extensão (lista fechada, sem SVG/HTML), `nosniff` e CSP `sandbox` (exceto PDF); só imagens e PDFs abrem no navegador, o resto é baixado.
- **Duas barreiras no servidor**: [proxy.ts](proxy.ts) exige sessão em toda página, API e protótipo, e recusa (403) qualquer método diferente de GET/HEAD para quem não edita ou que venha de outra origem; as rotas de API que alteram dados usam `handleEdit()` ([lib/http/handle.ts](lib/http/handle.ts)), que repete a checagem.
- **Protótipos isolados**: servidos com CSP `sandbox` e exibidos em iframe `sandbox` sem `allow-same-origin` — não acessam cookies, armazenamento nem o DOM da aplicação.
- **GitHub (aba Repositório)**: ao informar o link de um repositório, o servidor lista as branches pela API do GitHub (`GET /api/github/branches`, só para quem edita). Repositórios privados exigem `GITHUB_TOKEN` (somente leitura) — ver [.env.example](.env.example). Sem acesso, as branches podem ser informadas pelo link.
- **Markdown**: HTML embutido é ignorado na leitura (`skipHtml`) e imagens externas não são carregadas.
- Dados de demonstração: veja o aviso no topo.

## Decisões técnicas

| Decisão | Motivo |
| --- | --- |
| Persistência atrás de `RoadmapRepository` | Postgres (Neon) em produção e JSON local no desenvolvimento, sem mudar o restante da aplicação. |
| Registros JSONB por entidade no Postgres | Mantém o formato validado pelo Zod e a evolução do modelo sem migrações de colunas a cada campo novo. |
| Estado no cliente via contexto React + API | Volume de dados pequeno; o drawer é compartilhado entre Iniciativas, Roadmap e Contexto sem bibliotecas extras. |
| Iniciativa selecionada na URL (`?iniciativa=&aba=`) | Links compartilháveis e navegação voltar/avançar preservando a lista. |
| Prioridade começa "A definir" | O briefing pede validação de prioridades; nenhuma pontuação automática. |
| Ilustrações em `public/illustrations/` | Foguete, satélite, planeta, ilha flutuante e Planeta da Tecnologia foram recortados da arte oficial do documento "Planetas e Narrativas" (Exploradores). Não havia astronauta em arquivo: `astronauta.svg`, `astronauta-recorte.svg` e o cenário `hero-ceu.svg` foram desenhados no mesmo estilo. Para trocar por arte nova, substitua o arquivo mantendo o nome. |
| Banco local com versão de esquema | `lib/repositories/migrations.ts` atualiza bancos antigos sem perder dados (v1 → v2: objetivos, entregas e etapas). |
| PRD da JG-2027-001 importado integralmente | Fornecido pelo time em 16/10/2026. Listas de RF/RN/riscos convertidas em tabelas apenas para leitura; três tabelas ausentes no texto recebido estão marcadas como pendentes no documento. |
