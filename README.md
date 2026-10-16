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

A navegação tem exatamente três seções:

| Seção | Rota | Conteúdo |
| --- | --- | --- |
| **Contexto** | `/contexto` | Texto introdutório, direcionadores estratégicos, problemas estruturais (confirmados × hipóteses), princípios de planejamento e catálogo de plataformas — tudo editável. |
| **Iniciativas** | `/iniciativas` | Catálogo com busca (atalho ⌘K/Ctrl+K), abas de status com contadores, filtros combináveis (quarter, plataforma, categoria), ordenação, visualização em lista ou grade e criação/edição. Clicar em um card abre o **drawer lateral** de detalhes. |
| **Roadmap** | `/roadmap` | Quatro colunas (Q1–Q4) com as iniciativas, seus marcos em outros quarters, dependências e iniciativas sem quarter. |

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
| Com `DATABASE_URL` / `POSTGRES_URL` (produção na Vercel, banco **Neon "Roadmap-JG"**) | **Postgres** — iniciativas, plataformas, contexto, histórico e conteúdo dos documentos Markdown |
| Sem variável de banco (desenvolvimento) | Arquivo JSON `data/local/db.json` + documentos em `initiatives/` |

### Postgres (Neon)

- Tabelas (criadas automaticamente na primeira conexão): `initiatives`, `platforms`, `strategy_context`, `documents` e `roadmap_meta`. Cada iniciativa/plataforma é um registro JSONB validado pelos schemas Zod.
- **Importação inicial**: com o banco vazio, o app importa os dados existentes (`data/local/db.json`, se houver, ou os dados iniciais de `data/seed/`) e o conteúdo de todos os `.md` de `initiatives/`. Isso acontece uma única vez (`roadmap_meta.schema_version`).
- Alterações rodam em transação com lock consultivo (`pg_advisory_xact_lock`), gravando apenas os registros alterados.
- Documentos: o conteúdo salvo pela interface fica na tabela `documents`. Os arquivos em `initiatives/` são a versão inicial versionada no git; editar pela interface **não** altera o arquivo do repositório.
- Para trabalhar localmente no mesmo banco, coloque a `DATABASE_URL` da Neon em `.env.local` (nunca no código).

### Arquivo local

Sem banco configurado, os dados ficam em `data/local/db.json` (gitignored), com escrita atômica. Em ambientes com disco somente leitura e sem banco, o app funciona apenas para leitura, mostra um aviso no topo e responde 503 às edições.

## PRDs e protótipos

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

- **Sem autenticação**: a aplicação não possui login. Qualquer pessoa com acesso à URL pode ler e editar. Use apenas em rede/ambiente controlado até que a autenticação seja adicionada (não há login fictício). O ponto natural para isso é um middleware do Next.js + verificação nas rotas de API.
- **Protótipos isolados**: servidos com CSP `sandbox` e exibidos em iframe `sandbox` sem `allow-same-origin` — não acessam cookies, armazenamento nem o DOM da aplicação.
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
