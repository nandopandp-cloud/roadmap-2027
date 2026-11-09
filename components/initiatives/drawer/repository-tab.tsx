"use client";

import { ExternalLink, FolderGit2, GitBranch, Pencil, Plus, RefreshCw, Search, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SubHeading } from "@/components/initiatives/drawer/parts";
import { StateTag } from "@/components/ui/badges";
import { Button, buttonClass, IconButton, Spinner } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/client/api";
import { useCanEdit, useRoadmap } from "@/lib/client/store";
import { parseGithubBranch, parseGithubRepo } from "@/lib/domain/github";
import type { Initiative, RepositoryBranch, RepositoryLink } from "@/lib/domain/types";
import type { GithubBranchList } from "@/lib/services/github-service";
import { fieldErrors, planningPatchSchema } from "@/lib/validation/schemas";

const MAX_REPOSITORIES = 10;
const MAX_BRANCHES = 20;
const NEW = "novo";

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

type Draft = { url: string; branches: RepositoryBranch[]; note: string };
type Errors = { url?: string; note?: string; branchList?: string; branches?: Record<string, string> };

const hasErrors = (e: Errors) => !!(e.url || e.note || e.branchList || Object.keys(e.branches ?? {}).length);

/** Link de uma branch no GitHub (cada parte do nome codificada, mantendo as barras). */
const branchLink = (repoUrl: string, name: string) => `${repoUrl}/tree/${name.split("/").map(encodeURIComponent).join("/")}`;

type RemoteBranches =
  | { status: "idle"; reload: () => void }
  | { status: "loading"; reload: () => void }
  | { status: "ok"; data: GithubBranchList; reload: () => void }
  | { status: "error"; error: string; reload: () => void };

/** Consulta (com pausa de digitação e cache por repositório) as branches do repositório informado. */
function useGithubBranches(link: string): RemoteBranches {
  const repo = parseGithubRepo(link);
  const key = repo ? `${repo.owner}/${repo.repo}`.toLowerCase() : null;
  const cache = useRef(new Map<string, GithubBranchList>());
  const [state, setState] = useState<{ key: string; data?: GithubBranchList; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key || !repo) return;
    const cached = cache.current.get(key);
    if (cached) {
      setState({ key, data: cached });
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setState({ key });
      try {
        const data = await api.githubBranches(repo.url);
        cache.current.set(key, data);
        if (!cancelled) setState({ key, data });
      } catch (error) {
        if (!cancelled) setState({ key, error: error instanceof ApiError ? error.message : "Não foi possível consultar o GitHub agora." });
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `repo` é derivado de `key`: a consulta só se repete quando o repositório muda ou em "Atualizar lista".
  }, [key, attempt]);

  const reload = () => {
    if (key) cache.current.delete(key);
    setAttempt((n) => n + 1);
  };
  if (!key) return { status: "idle", reload };
  if (!state || state.key !== key || (!state.data && !state.error)) return { status: "loading", reload };
  if (state.error) return { status: "error", error: state.error, reload };
  return { status: "ok", data: state.data!, reload };
}

/** Lista de branches do GitHub para marcar as que pertencem ao projeto. */
function BranchChecklist({
  data,
  selected,
  onToggle,
  onReload,
  error,
}: {
  data: GithubBranchList;
  selected: string[];
  onToggle: (name: string) => void;
  onReload: () => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  // Branches já marcadas que não existem mais no GitHub continuam visíveis para poder desmarcar.
  const missing = selected.filter((n) => !data.branches.includes(n));
  const shown = [...missing, ...data.branches].filter((n) => !q || n.toLowerCase().includes(q));
  const showFilter = data.branches.length > 6;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-relaxed text-muted">
          {data.branches.length === 0
            ? `O repositório ${data.owner}/${data.repo} não tem branches.`
            : `Marque as branches deste projeto · ${selected.length} de ${data.branches.length} selecionada${selected.length === 1 ? "" : "s"}.`}
        </p>
        <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={onReload}>
          Atualizar lista
        </Button>
      </div>
      {(data.branches.length > 0 || missing.length > 0) && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface" aria-invalid={!!error}>
          {showFilter && (
            <div className="relative border-b border-line">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar branches"
                aria-label="Filtrar branches"
                className="h-10 w-full bg-transparent pl-10 pr-3 text-[14px] text-ink placeholder:text-subtle focus:outline-none focus-visible:bg-[#fafbff]"
              />
            </div>
          )}
          <ul className="max-h-64 overflow-y-auto py-1">
            {shown.length === 0 && <li className="px-3.5 py-3 text-[13px] italic text-subtle">Nenhuma branch encontrada para “{query}”.</li>}
            {shown.map((name) => {
              const checked = selected.includes(name);
              return (
                <li key={name}>
                  <label className="flex cursor-pointer items-center gap-3 px-3.5 py-2 transition-colors hover:bg-[#f5f7fd] has-[:focus-visible]:bg-[#f5f7fd]">
                    <input type="checkbox" checked={checked} onChange={() => onToggle(name)} className="h-[18px] w-[18px] shrink-0 accent-[#00857c]" />
                    <GitBranch size={15} className={checked ? "shrink-0 text-[#1f55c4]" : "shrink-0 text-subtle"} aria-hidden />
                    <span className={`min-w-0 flex-1 truncate font-mono text-[13px] ${checked ? "font-bold text-navy" : "text-ink"}`}>{name}</span>
                    {name === data.defaultBranch && <StateTag>padrão</StateTag>}
                    {missing.includes(name) && <StateTag tone="warn">não encontrada no GitHub</StateTag>}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {data.truncated && <p className="text-xs text-muted">Mostrando as primeiras {data.branches.length} branches do repositório.</p>}
      {error && <p className="text-xs font-semibold text-[#c42b3a]">{error}</p>}
    </div>
  );
}

/** Formulário em linha para vincular ou editar um repositório e suas branches. */
function RepositoryForm({
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  initial?: RepositoryLink;
  saving: boolean;
  onCancel: (dirty: boolean) => void;
  /** Devolve os erros por campo, ou null quando salvou. */
  onSubmit: (draft: Draft) => Promise<Errors | null>;
}) {
  const [start] = useState<Draft>(() => ({
    url: initial?.url ?? "",
    branches: initial?.branches ?? [],
    note: initial?.note ?? "",
  }));
  const [draft, setDraft] = useState<Draft>(start);
  const [errors, setErrors] = useState<Errors>({});
  const [focusId, setFocusId] = useState<string | null>(null);
  const remote = useGithubBranches(draft.url);
  const repo = parseGithubRepo(draft.url);
  const selectedNames = draft.branches.map((b) => parseGithubBranch(b.url)?.branch).filter((n): n is string => !!n);

  /** Marca ou desmarca uma branch da lista do GitHub. */
  const toggleBranch = (name: string) => {
    if (!repo) return;
    setErrors((prev) => ({ ...prev, branchList: undefined, branches: {} }));
    setDraft((prev) => {
      const existing = prev.branches.find((b) => parseGithubBranch(b.url)?.branch === name);
      if (existing) return { ...prev, branches: prev.branches.filter((b) => b !== existing) };
      return { ...prev, branches: [...prev.branches.filter((b) => b.url.trim()), { id: newId("branch"), url: branchLink(repo.url, name) }] };
    });
  };
  const dirty = JSON.stringify(draft) !== JSON.stringify(start);

  const setField = (key: "url" | "note") => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const setBranch = (id: string, value: string) => {
    setErrors((prev) => ({ ...prev, branchList: undefined, branches: { ...prev.branches, [id]: "" } }));
    setDraft((prev) => {
      const next = { ...prev, branches: prev.branches.map((b) => (b.id === id ? { ...b, url: value } : b)) };
      // Colou primeiro o link de uma branch: o repositório é deduzido dele.
      if (!prev.url.trim()) {
        const branch = parseGithubBranch(value);
        if (branch) next.url = branch.url;
      }
      return next;
    });
  };

  const addBranch = () => {
    const id = newId("branch");
    setDraft((prev) => ({ ...prev, branches: [...prev.branches, { id, url: "" }] }));
    setFocusId(id);
  };

  const removeBranch = (id: string) => {
    setErrors((prev) => ({ ...prev, branches: { ...prev.branches, [id]: "" } }));
    setDraft((prev) => ({ ...prev, branches: prev.branches.filter((b) => b.id !== id) }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = await onSubmit(draft);
    if (result) setErrors(result);
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel(dirty);
        }
      }}
      className="flex flex-col gap-4 rounded-[18px] border border-[#d9def0] bg-surface p-5 shadow-[0_1px_2px_rgba(23,27,77,0.03)]"
      aria-label={initial ? "Editar repositório" : "Vincular repositório"}
      noValidate
    >
      <TextField
        label="Link do repositório"
        required
        type="url"
        inputMode="url"
        autoFocus
        placeholder="https://github.com/organização/repositório"
        value={draft.url}
        onChange={setField("url")}
        error={errors.url}
        hint="Endereço do repositório no GitHub."
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-[13px] font-bold text-navy">Branches do projeto</legend>
        {remote.status === "ok" ? (
          <BranchChecklist
            data={remote.data}
            selected={selectedNames}
            onToggle={toggleBranch}
            onReload={remote.reload}
            error={errors.branchList ?? Object.values(errors.branches ?? {}).find(Boolean)}
          />
        ) : remote.status === "loading" ? (
          <p className="flex items-center gap-2 rounded-xl border border-line bg-[#fafbfe] px-3.5 py-3 text-[13.5px] font-semibold text-muted" role="status">
            <Spinner className="h-4 w-4" /> Buscando branches de {repo ? `${repo.owner}/${repo.repo}` : "repositório"} no GitHub…
          </p>
        ) : remote.status === "idle" ? (
          <p className="-mt-1.5 text-xs leading-relaxed text-muted">Informe o link do repositório: as branches serão listadas automaticamente para você marcar.</p>
        ) : (
          <>
            <div role="alert" className="flex flex-wrap items-start gap-2 rounded-xl bg-[#fff6e5] px-3 py-2.5 text-[13px] font-semibold text-[#7a4b00]">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                {remote.error} Você pode informar os links das branches abaixo.
              </span>
              <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={remote.reload}>
                Tentar de novo
              </Button>
            </div>
            {draft.branches.map((b, idx) => (
              <div key={b.id} className="flex items-start gap-2">
                <TextField
                  className="min-w-0 flex-1"
                  label={`Branch ${idx + 1}`}
                  type="url"
                  inputMode="url"
                  autoFocus={focusId === b.id}
                  placeholder="https://github.com/organização/repositório/tree/nome-da-branch"
                  value={b.url}
                  onChange={(e) => setBranch(b.id, e.target.value)}
                  error={errors.branches?.[b.id] || undefined}
                />
                <IconButton label={`Remover branch ${idx + 1}`} onClick={() => removeBranch(b.id)} className="mt-[30px] h-11 w-11 hover:!bg-[#fdf1f2] hover:!text-[#b3242f]">
                  <Trash2 size={17} />
                </IconButton>
              </div>
            ))}
            {errors.branchList && <p className="text-xs font-semibold text-[#c42b3a]">{errors.branchList}</p>}
            {draft.branches.length < MAX_BRANCHES && (
              <div>
                <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={addBranch}>
                  {draft.branches.length ? "Adicionar outra branch" : "Adicionar branch pelo link"}
                </Button>
              </div>
            )}
          </>
        )}
      </fieldset>

      <TextField
        label="Observação"
        placeholder="Ex.: front-end do aplicativo do estudante"
        maxLength={200}
        value={draft.note}
        onChange={setField("note")}
        error={errors.note}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onCancel(dirty)} disabled={saving}>
          Cancelar
        </Button>
        <Button size="sm" variant="primary" type="submit" loading={saving}>
          {initial ? "Salvar alterações" : "Vincular repositório"}
        </Button>
      </div>
    </form>
  );
}

function RepositoryCard({ repo, onEdit, onRemove }: { repo: RepositoryLink; onEdit?: () => void; onRemove?: () => void }) {
  const parsed = parseGithubRepo(repo.url);
  return (
    <li className="rounded-[18px] border border-[#e6ebf5] bg-surface p-5">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef0f8] text-navy" aria-hidden>
          <FolderGit2 size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-wide text-subtle">{parsed?.owner ?? "GitHub"}</p>
          <p className="break-all text-[16px] font-extrabold text-navy">{parsed?.repo ?? repo.url}</p>
          {repo.note && <p className="mt-1 text-[14px] leading-relaxed text-muted">{repo.note}</p>}
          <div className="mt-3">
            <p className="text-[13px] font-bold text-navy">
              {repo.branches.length > 1 ? `Branches do projeto (${repo.branches.length})` : "Branch do projeto"}
            </p>
            {repo.branches.length === 0 ? (
              <p className="mt-1 text-[13px] italic text-subtle">Nenhuma branch informada.</p>
            ) : (
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {repo.branches.map((b) => {
                  const branch = parseGithubBranch(b.url);
                  return (
                    <li key={b.id}>
                      <a
                        href={branch?.branchUrl ?? b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 rounded-xl border border-[#dbe5fb] bg-[#f3f7ff] px-3 py-2 text-[#1f55c4] transition-colors hover:border-[#b9cdf6] hover:bg-[#eaf1fe]"
                      >
                        <GitBranch size={15} className="shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-bold">{branch?.branch ?? b.url}</span>
                        <ExternalLink size={14} className="shrink-0 opacity-60 group-hover:opacity-100" aria-hidden />
                        <span className="sr-only">(abrir branch no GitHub em nova aba)</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <a href={parsed?.url ?? repo.url} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
          <ExternalLink size={15} aria-hidden /> Abrir repositório
        </a>
        {onEdit && (
          <Button size="sm" variant="ghost" icon={<Pencil size={15} />} onClick={onEdit}>
            Editar
          </Button>
        )}
        {onRemove && (
          <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} onClick={onRemove} className="hover:!bg-[#fdf1f2] hover:!text-[#b3242f]">
            Desvincular
          </Button>
        )}
      </div>
    </li>
  );
}

/** Aba Repositório: repositórios do GitHub e branch do projeto vinculados à iniciativa. */
export function RepositoryTab({ initiative: i }: { initiative: Initiative }) {
  const { patchPlanning } = useRoadmap();
  const canEdit = useCanEdit();
  const notify = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const repos = i.repositories;

  async function persist(next: RepositoryLink[], message: string): Promise<boolean> {
    setSaving(true);
    try {
      await patchPlanning(i.id, { repositories: next });
      notify("success", message);
      return true;
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar o repositório.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submit(draft: Draft, current?: RepositoryLink): Promise<Errors | null> {
    const repo = parseGithubRepo(draft.url);
    // Linhas de branch em branco são ignoradas; links reconhecidos são gravados no formato canônico.
    const branches = draft.branches
      .filter((b) => b.url.trim())
      .map((b) => ({ id: b.id, url: parseGithubBranch(b.url)?.branchUrl ?? b.url.trim() }));
    const entry: RepositoryLink = {
      id: current?.id ?? newId("repo"),
      url: repo?.url ?? draft.url.trim(),
      branches,
      note: draft.note.trim(),
    };
    const next = current ? repos.map((r) => (r.id === current.id ? entry : r)) : [...repos, entry];
    const parsed = planningPatchSchema.safeParse({ repositories: next });
    if (!parsed.success) {
      const prefix = `repositories.${next.indexOf(entry)}`;
      const all = fieldErrors(parsed.error);
      const errors: Errors = {
        url: all[`${prefix}.url`],
        note: all[`${prefix}.note`],
        branchList: all[`${prefix}.branches`],
        branches: Object.fromEntries(
          branches.flatMap((b, idx) => (all[`${prefix}.branches.${idx}.url`] ? [[b.id, all[`${prefix}.branches.${idx}.url`]]] : [])),
        ),
      };
      if (!hasErrors(errors)) notify("error", all.repositories ?? "Revise os dados do repositório.");
      return errors;
    }
    const ok = await persist(next, current ? "Repositório atualizado." : "Repositório vinculado à iniciativa.");
    if (ok) setEditing(null);
    return null;
  }

  async function cancel(dirty: boolean) {
    if (dirty) {
      const ok = await confirm({
        title: "Descartar alterações?",
        message: "Os dados preenchidos para o repositório serão perdidos.",
        confirmLabel: "Descartar",
        tone: "danger",
      });
      if (!ok) return;
    }
    setEditing(null);
  }

  async function remove(repo: RepositoryLink) {
    const name = parseGithubRepo(repo.url);
    const ok = await confirm({
      title: "Desvincular repositório?",
      message: (
        <>
          <strong>{name ? `${name.owner}/${name.repo}` : repo.url}</strong> deixará de aparecer nesta iniciativa. Nada é alterado no GitHub.
        </>
      ),
      confirmLabel: "Desvincular",
      tone: "danger",
    });
    if (!ok) return;
    await persist(
      repos.filter((r) => r.id !== repo.id),
      "Repositório desvinculado.",
    );
  }

  const adding = editing === NEW;
  const canAdd = canEdit && !editing && repos.length < MAX_REPOSITORIES;

  if (repos.length === 0 && !adding) {
    return (
      <EmptyState
        icon={<FolderGit2 size={22} />}
        title="Nenhum repositório vinculado a esta iniciativa."
        description={
          canEdit
            ? "Vincule o repositório do GitHub e os links das branches em que o projeto está sendo desenvolvido."
            : "Quando o time vincular o repositório do GitHub, ele aparecerá aqui."
        }
        action={
          canEdit && (
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setEditing(NEW)}>
              Vincular repositório
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SubHeading>Repositórios no GitHub</SubHeading>
      {repos.length > 0 && (
        <ul className="flex flex-col gap-3">
          {repos.map((r) =>
            editing === r.id ? (
              <li key={r.id}>
                <RepositoryForm initial={r} saving={saving} onCancel={cancel} onSubmit={(d) => submit(d, r)} />
              </li>
            ) : (
              <RepositoryCard
                key={r.id}
                repo={r}
                onEdit={canEdit && !editing ? () => setEditing(r.id) : undefined}
                onRemove={canEdit && !editing ? () => remove(r) : undefined}
              />
            ),
          )}
        </ul>
      )}
      {adding && <RepositoryForm saving={saving} onCancel={cancel} onSubmit={(d) => submit(d)} />}
      {canAdd && (
        <div>
          <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => setEditing(NEW)}>
            Vincular outro repositório
          </Button>
        </div>
      )}
    </div>
  );
}
