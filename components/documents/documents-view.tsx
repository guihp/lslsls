"use client";

import { createDocument, deleteDocument } from "@/app/actions/documents";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Document } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import {
  BookOpen,
  Eye,
  FileText,
  Plus,
  Rocket,
  Search,
  Terminal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const ICONS: Record<string, typeof FileText> = {
  file: FileText,
  rocket: Rocket,
  terminal: Terminal,
  book: BookOpen,
};

export function DocumentsView({
  documents,
  canCreate,
  query,
}: {
  documents: Document[];
  canCreate: boolean;
  query: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [showCreate, setShowCreate] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Documentos</h1>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {documents.length} documentos
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <form
            className="relative min-w-0 flex-1 sm:flex-none"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(
                search
                  ? `/documentos?q=${encodeURIComponent(search)}`
                  : "/documentos",
              );
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              className="w-full pl-9 sm:w-48"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          {canCreate ? (
            <Button type="button" className="w-full sm:w-auto" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Novo
            </Button>
          ) : null}
        </div>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="Nenhum documento"
          description="Guarde playbooks, tutoriais, SQL e links de melhorias aqui."
          action={
            canCreate ? (
              <Button type="button" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Adicionar documento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="hidden grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_2.5rem] gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-400 md:grid dark:border-zinc-800">
            <span>Nome</span>
            <span>Visibilidade</span>
            <span>Atualizado</span>
            <span />
          </div>
          {documents.map((doc) => {
            const Icon = ICONS[doc.icon] || FileText;
            return (
              <div
                key={doc.id}
                className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 last:border-0 md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_2.5rem] md:items-center dark:border-zinc-900"
              >
                <a
                  href={doc.url || "#"}
                  target={doc.url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-3 font-medium hover:underline"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 break-words">{doc.title}</span>
                </a>
                <div className="flex flex-wrap items-center justify-between gap-3 md:contents">
                  <span className="inline-flex items-center gap-1 text-sm text-zinc-500">
                    <Eye className="h-3.5 w-3.5 text-orange-600" />
                    {doc.visibility === "todos" ? "Todos" : "Admin"}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {relativeTime(doc.created_at)}
                  </span>
                  {canCreate ? (
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center text-zinc-400 hover:text-red-500 md:justify-self-end"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteDocument(doc.id);
                          router.refresh();
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-zinc-950"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await createDocument(fd);
                if (res.error) setError(res.error);
                else {
                  setShowCreate(false);
                  router.refresh();
                }
              });
            }}
          >
            <h2 className="text-lg font-semibold">Novo documento</h2>
            <Input name="title" placeholder="Título" required />
            <Input name="url" placeholder="Link (opcional)" />
            <Input name="file" type="file" />
            <select
              name="icon"
              className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700"
              defaultValue="file"
            >
              <option value="file">Arquivo</option>
              <option value="rocket">Melhorias</option>
              <option value="terminal">SQL / Código</option>
              <option value="book">Tutorial / Playbook</option>
            </select>
            <select
              name="category"
              className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700"
              defaultValue="geral"
            >
              <option value="geral">Geral</option>
              <option value="melhorias">Melhorias</option>
              <option value="sql">SQL</option>
              <option value="tutorial">Tutorial</option>
            </select>
            <select
              name="visibility"
              className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700"
              defaultValue="todos"
            >
              <option value="todos">Todos</option>
              <option value="admin">Admin</option>
            </select>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Salvar
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
