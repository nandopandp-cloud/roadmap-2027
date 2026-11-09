"use client";

import { ExternalLink, FolderGit2, GitBranch, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SubHeading } from "@/components/initiatives/drawer/parts";
import { Button, buttonClass } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { useCanEdit, useRoadmap } from "@/lib/client/store";
import { parseGithubBranch, parseGithubRepo } from "@/lib/domain/github";
import type { Initiative, RepositoryLink } from "@/lib/domain/types";
import { fieldErrors, planningPatchSchema } from "@/lib/validation/schemas";

const MAX_REPOSITORIES = 10;
const NEW = "novo";

type Draft = { url: string; branchUrl: string; note: string };
type Errors = Partial<Record<keyof Draft, string>>;

/** Formulário em linha para vincular ou editar um repositório. */
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
  const start: Draft = { url: initial?.url ?? "", branchUrl: initial?.branchUrl ?? "", note: initial?.note ?? "" };
  const [draft, setDraft] = useState<Draft>(start);
  const [errors, setErrors] = useState<Errors>({});
  const dirty = draft.url !== start.url || draft.branchUrl !== start.branchUrl || draft.note !== start.note;

  const set = (key: keyof Draft) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      // Colou primeiro o link da branch: o repositório é deduzido dele.
      if (key === "branchUrl" && !prev.url.trim()) {
        const branch = parseGithubBranch(value);
        if (branch) next.url = branch.url;
      }
      return next;
    });
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
        onChange={set("url")}
        error={errors.url}
        hint="Endereço do repositório no GitHub."
      />
      <TextField
        label="Link da branch do projeto"
        type="url"
        inputMode="url"
        placeholder="https://github.com/organização/repositório/tree/nome-da-branch"
        value={draft.branchUrl}
        onChange={set("branchUrl")}
        error={errors.branchUrl}
        hint="Abra a branch no GitHub e copie o link da barra de endereço. Opcional."
      />
      <TextField
        label="Observação"
        placeholder="Ex.: front-end do aplicativo do estudante"
        maxLength={200}
        value={draft.note}
        onChange={set("note")}
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
  const branch = repo.branchUrl ? parseGithubBranch(repo.branchUrl) : null;
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
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {branch ? (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#eaf1fe] px-2.5 py-1 text-[12.5px] font-bold text-[#1f55c4]">
                <GitBranch size={14} className="shrink-0" aria-hidden />
                <span className="sr-only">Branch: </span>
                <span className="truncate font-mono">{branch.branch}</span>
              </span>
            ) : (
              <span className="text-[13px] italic text-subtle">Branch do projeto não informada.</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {branch && (
          <a href={branch.branchUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "sm")}>
            <GitBranch size={15} aria-hidden /> Abrir branch
          </a>
        )}
        <a href={parsed?.url ?? repo.url} target="_blank" rel="noopener noreferrer" className={buttonClass(branch ? "secondary" : "primary", "sm")}>
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
    const branch = parseGithubBranch(draft.branchUrl);
    const entry: RepositoryLink = {
      id: current?.id ?? `repo-${Date.now().toString(36)}`,
      // Grava os endereços canônicos (sem barra final nem .git) quando reconhecidos.
      url: repo?.url ?? draft.url.trim(),
      branchUrl: branch?.branchUrl ?? draft.branchUrl.trim(),
      note: draft.note.trim(),
    };
    const next = current ? repos.map((r) => (r.id === current.id ? entry : r)) : [...repos, entry];
    const parsed = planningPatchSchema.safeParse({ repositories: next });
    if (!parsed.success) {
      const idx = next.indexOf(entry);
      const all = fieldErrors(parsed.error);
      const errors: Errors = {
        url: all[`repositories.${idx}.url`],
        branchUrl: all[`repositories.${idx}.branchUrl`],
        note: all[`repositories.${idx}.note`],
      };
      if (!errors.url && !errors.branchUrl && !errors.note) notify("error", all.repositories ?? "Revise os dados do repositório.");
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
            ? "Vincule o repositório do GitHub e o link da branch em que o projeto está sendo desenvolvido."
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
