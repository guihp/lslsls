"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatActivityAction } from "@/lib/activity";
import type { ActivityLog } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export type AdminLogRow = {
  log: ActivityLog;
  actorName: string;
  clientName: string | null;
  clientId: string | null;
};

export type AdminLogsFilters = {
  client: string;
  user: string;
  q: string;
};

function formatWhen(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildLogsHref(
  page: number,
  filters: AdminLogsFilters,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filters.client) params.set("client", filters.client);
  if (filters.user) params.set("user", filters.user);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return qs ? `/admin/logs?${qs}` : "/admin/logs";
}

const selectClassName =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-orange-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white";

function LogsFilterBar({
  filters,
  clients,
  users,
}: {
  filters: AdminLogsFilters;
  clients: { id: string; name: string }[];
  users: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);

  useEffect(() => {
    setQ(filters.q);
  }, [filters.q]);

  function navigate(next: Partial<AdminLogsFilters>) {
    router.push(
      buildLogsHref(1, {
        client: next.client ?? filters.client,
        user: next.user ?? filters.user,
        q: next.q ?? filters.q,
      }),
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    navigate({ q: q.trim() });
  }

  const hasFilters = Boolean(filters.client || filters.user || filters.q);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[10rem]">
        <span className="text-xs font-medium text-zinc-500">Cliente</span>
        <select
          className={selectClassName}
          value={filters.client}
          onChange={(e) => navigate({ client: e.target.value })}
          aria-label="Filtrar por cliente"
        >
          <option value="">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[10rem]">
        <span className="text-xs font-medium text-zinc-500">Usuário</span>
        <select
          className={selectClassName}
          value={filters.user}
          onChange={(e) => navigate({ user: e.target.value })}
          aria-label="Filtrar por usuário"
        >
          <option value="">Todos os usuários</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>
      </label>

      <label className="relative flex min-w-0 flex-[1.4] flex-col gap-1 sm:min-w-[12rem]">
        <span className="text-xs font-medium text-zinc-500">Busca</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            type="search"
            placeholder="Ação, cliente ou usuário..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar nos logs"
          />
        </div>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className="min-h-10">
          Filtrar
        </Button>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-10"
            onClick={() => router.push("/admin/logs")}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function AdminLogsView({
  rows,
  page,
  totalPages,
  filters,
  clients,
  users,
  hasFilters,
}: {
  rows: AdminLogRow[];
  page: number;
  totalPages: number;
  filters: AdminLogsFilters;
  clients: { id: string; name: string }[];
  users: { id: string; full_name: string }[];
  hasFilters: boolean;
}) {
  return (
    <div className="space-y-4">
      <LogsFilterBar filters={filters} clients={clients} users={users} />

      {rows.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
          {hasFilters
            ? "Nenhum log encontrado com esses filtros."
            : "Nenhuma atividade registrada ainda."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-900 dark:border-zinc-800">
          {rows.map(({ log, actorName, clientName, clientId }) => {
            const formatted = formatActivityAction(log, actorName);
            return (
              <li
                key={log.id}
                className="bg-white px-4 py-3 dark:bg-zinc-950 sm:px-5"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatted.headline}
                    </p>
                    {formatted.detail ? (
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatted.detail}
                      </p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>
                        <span className="text-zinc-400">Quem · </span>
                        {actorName}
                      </span>
                      {clientId && clientName ? (
                        <span>
                          <span className="text-zinc-400">Cliente · </span>
                          <Link
                            href={`/clientes/${clientId}`}
                            className="font-medium text-orange-600 hover:underline dark:text-orange-400"
                          >
                            {clientName}
                          </Link>
                        </span>
                      ) : clientId ? (
                        <Link
                          href={`/clientes/${clientId}`}
                          className="font-medium text-orange-600 hover:underline dark:text-orange-400"
                        >
                          Ver cliente
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <time
                    dateTime={log.created_at}
                    className="shrink-0 text-xs text-zinc-500 sm:text-right"
                    title={log.created_at}
                  >
                    <span className="block">{formatWhen(log.created_at)}</span>
                    <span className="text-zinc-400">
                      {relativeTime(log.created_at)}
                    </span>
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-between gap-3 text-sm"
          aria-label="Paginação dos logs"
        >
          {page > 1 ? (
            <Link
              href={buildLogsHref(page - 1, filters)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:text-orange-400"
            >
              Anterior
            </Link>
          ) : (
            <span className="px-3 py-1.5 text-zinc-300 dark:text-zinc-700">
              Anterior
            </span>
          )}
          <span className="text-zinc-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildLogsHref(page + 1, filters)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:text-orange-400"
            >
              Próxima
            </Link>
          ) : (
            <span className="px-3 py-1.5 text-zinc-300 dark:text-zinc-700">
              Próxima
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
