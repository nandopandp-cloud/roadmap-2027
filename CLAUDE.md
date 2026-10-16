# CLAUDE.md — Jovens Gênios Roadmap 2027

Instruções permanentes para trabalhar neste repositório. Leia o [README](README.md) para arquitetura e execução.

## Produto

- Ferramenta interna de **gestão estratégica de iniciativas**, documentação e roadmap. Não é gestão de projetos: não adicionar sprints, tarefas, kanban de execução ou dashboards de gráficos.
- Toda a interface é em **português brasileiro**.
- A sidebar tem **exatamente três** itens: Contexto, Iniciativas, Roadmap. Não adicionar itens de primeiro nível; PRDs, protótipos e plataformas ficam vinculados às iniciativas ou ao contexto.
- Detalhes de iniciativa abrem no **drawer lateral sobreposto** com camada escura (`?iniciativa=<id>&aba=<aba>`), nunca em página própria. `/iniciativas/<id>` apenas redireciona.
- A referência visual aprovada é o layout com hero ilustrado, abas de status, cards com progresso e drawer com cabeçalho ilustrado. Mudanças visuais devem preservar essa composição.
- Progresso é sempre derivado das etapas (`lib/domain/progress.ts`); nunca aceitar percentual digitado.
- Nunca inventar métricas, metas, valores de referência, evidências ou compromissos. Hipóteses devem ser apresentadas como hipóteses. Campos ausentes recebem estados vazios explícitos.
- Não criar links fictícios nem mensagens de sucesso para arquivos inexistentes. Use `useArtifactStatus` para verificar arquivos.
- Iniciativas transversais (2+ plataformas) são **um único registro**; marcos em outros quarters aparecem no roadmap ligados ao mesmo ID.

## Identidade visual

- Logo oficial: `public/brand/jovens-genios-horizontal.png` (componente `BrandLogo`). Não redesenhar, não substituir por texto/iniciais. `app/icon.png` é um recorte do mesmo arquivo.
- Tokens em `app/globals.css` (`@theme`): `navy`, `brand`, `violet`, `blue`, `teal`, `action` (turquesa com contraste AA — use para ações primárias), `ink`, `muted`, `line`, `canvas`, `surface`.
- Badges usam tons suaves de `lib/client/tones.ts`; não usar cores fortes fora desses tons.
- Ilustrações: mapa `ILLUSTRATION_SRC` (lib/domain/labels.ts) → arquivos em `public/illustrations/`. As JPGs vêm da arte oficial do Exploradores; os SVGs (astronauta, cenário do hero) seguem o mesmo estilo.
- Ao mudar o formato dos dados persistidos, incremente `SCHEMA_VERSION` e escreva a migração em `lib/repositories/migrations.ts`.
- Fonte: Nunito (via `next/font`).

## Convenções de código

- TypeScript estrito. Rodar `npm run typecheck` e `npm run build` antes de concluir.
- **Validação**: todo formato de dado nasce em `lib/validation/schemas.ts`; tipos são `z.infer` em `lib/domain/types.ts`. Não duplicar regras em componentes.
- **Camadas**: componentes → `lib/client/api.ts` → `app/api/**/route.ts` (finas, usam `handle()`) → `lib/services/*` (regras) → `lib/repositories/*` (persistência). Componentes nunca acessam o repositório ou o sistema de arquivos.
- Erros de regra de negócio: lançar `DomainError(status, mensagem, campos?)`; as rotas convertem para JSON `{ error, fields }`.
- Feedback ao usuário: `useToast()` para sucesso/erro e `useConfirm()` para ações destrutivas e descarte de alterações. Nunca `alert()`/`confirm()`.
- Componentes reutilizáveis em `components/ui/` (Button, Badge, Field, Modal, EmptyState…). Reutilize antes de criar novos.
- Acessibilidade: rótulos em todos os campos (`Field`), foco visível, `aria-*` em abas/menus/diálogos, navegação por teclado (Esc fecha camadas, setas nas abas).
- Não adicionar dependências sem necessidade clara.

## Iniciativas e arquivos

- IDs `JG-2027-NNN`, gerados no servidor. Nunca reutilizar ou renumerar.
- Pasta de artefatos: `initiatives/<ID>-<slug>/` (campo `repoFolder`, estável). Conteúdo:
  - `initiative.md` — narrativa/contexto;
  - `prd.md` — especificação (preservar o texto original fornecido pelo time; não resumir);
  - `decisions.md` — decisões com situação (Proposta/Aprovada) e justificativa;
  - `prototype/index.html` — protótipo navegável autocontido.
- Caminhos de artefatos são sempre relativos à raiz, começam com `initiatives/` e são validados por `isSafeRepoPath`.
- Protótipos são servidos por `/prototipos/...` com CSP `sandbox`; o iframe não pode receber `allow-same-origin`.
- Dados iniciais ficam em `data/seed/`. O banco local (`data/local/db.json`) é gerado e ignorado pelo git; `npm run db:reset` recria a partir do seed.

## Critérios de qualidade

- Sem botões decorativos: toda ação tem comportamento real ou é removida.
- Estados de carregamento, vazio e erro em toda lista/painel que dependa de dados.
- Alterações relevantes de planejamento devem gerar entrada de histórico (`lib/services/history.ts`).
- Testar em 1536px (drawer lado a lado), 1024px (drawer sobreposto) e 390px (drawer em tela cheia).
- Sem autenticação por enquanto: não implementar login fictício; ver README → Segurança.
