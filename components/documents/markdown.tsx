"use client";

import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/validation/paths";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return textOf(child.props.children);
      return "";
    })
    .join("");
}

const stripInline = (s: string) => s.replace(/[*_`~]|\[(.*?)\]\(.*?\)/g, "$1").trim();

/** Gera ids únicos e estáveis para os títulos, na ordem do documento. */
function idFactory() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text) || "secao";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

/** Extrai o sumário (títulos de nível 2 e 3), ignorando blocos de código. */
export function extractToc(markdown: string): TocItem[] {
  const nextId = idFactory();
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const level = match[1].length;
    const text = stripInline(match[2]);
    const id = nextId(text);
    if (level === 2 || level === 3) items.push({ id, text, level });
  }
  return items;
}

/** Renderização de leitura (títulos, listas, tabelas, tarefas) com âncoras por seção. */
export function MarkdownView({ content }: { content: string }) {
  const nextId = idFactory();
  const heading =
    (Tag: "h1" | "h2" | "h3") =>
    // eslint-disable-next-line react/display-name
    ({ children }: { children?: ReactNode }) => {
      const id = nextId(stripInline(textOf(children)));
      return Tag === "h1" ? <h1 id={id}>{children}</h1> : Tag === "h2" ? <h2 id={id}>{children}</h2> : <h3 id={id}>{children}</h3>;
    };

  const components: Components = {
    h1: heading("h1"),
    h2: heading("h2"),
    h3: heading("h3"),
    table: ({ children }) => (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    ),
    a: ({ href, children }) => {
      const external = href?.startsWith("http");
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
    // Imagens externas não são carregadas automaticamente em documentos.
    img: ({ alt }) => <span className="text-subtle">[imagem: {alt}]</span>,
  };

  return (
    <div className="prose-doc">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}
