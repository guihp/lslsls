"use client";

import { createClientRecord } from "@/app/actions/clients";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isOverdue } from "@/lib/progress";
import {
  CLIENT_STATUS_META,
  CLIENT_STATUS_ORDER,
  type Client,
  type ClientStatus,
  type Profile,
  type Task,
} from "@/lib/types";
import { formatDateBR } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  FlaskConical,
  Folder,
  Megaphone,
  Plus,
  Rocket,
  Search,
  Settings,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const ICONS = {
  rocket: Rocket,
  megaphone: Megaphone,
  folder: Folder,
  wrench: Wrench,
  flask: FlaskConical,
  settings: Settings,
  check: Check,
  x: X,
} as const;

export function ClientesBoard({
  clients,
  tasks,
  profiles,
  canCreate,
}: {
  clients: Client[];
  tasks: Task[];
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url" | "job_title">[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const visibleClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(term));
  }, [clients, search]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(
      CLIENT_STATUS_ORDER.map((s) => [s, [] as Client[]]),
    ) as Record<ClientStatus, Client[]>;
    for (const c of visibleClients) map[c.status].push(c);
    return map;
  }, [visibleClients]);

  return (
    <div className="overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-zinc-500">
          Listas &gt; <span className="font-medium text-zinc-900 dark:text-white">Clientes</span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
          >
            <Filter className="h-4 w-4" /> Filtrar
          </button>
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              className="w-full pl-9 sm:w-56"
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canCreate ? (
            <Button type="button" className="w-full sm:w-auto" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Novo Cliente
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-3 hidden grid-cols-[1fr_180px_140px_140px] gap-3 px-4 text-xs font-medium uppercase tracking-wide text-zinc-400 lg:grid">
        <span>Cliente</span>
        <span>Responsável</span>
        <span>Criado em</span>
        <span>Status</span>
      </div>

      {visibleClients.length === 0 ? (
        <EmptyState
          title={search ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
          description={
            search
              ? "Ajuste a busca para encontrar o cliente."
              : "Cadastre o primeiro cliente para começar o pipeline."
          }
          action={
            canCreate ? (
              <Button type="button" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Novo Cliente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {CLIENT_STATUS_ORDER.map((status) => {
            const items = grouped[status];
            const meta = CLIENT_STATUS_META[status];
            const Icon = ICONS[meta.icon as keyof typeof ICONS] || Folder;
            const isOpen = open[status] ?? false;
            const overdue = items.filter((c) =>
              isOverdue(c.deadline, c.status),
            ).length;
            const noResp = items.filter((c) => !c.responsible_id).length;

            return (
              <div
                key={status}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, [status]: !isOpen }))
                  }
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  )}
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label.toUpperCase()}
                  </span>
                  <span className="text-sm text-zinc-500">{items.length}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {overdue > 0 ? (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-500">
                        {overdue} atrasado{overdue > 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {noResp > 0 ? (
                      <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs text-zinc-400">
                        {noResp} sem resp.
                      </span>
                    ) : null}
                  </div>
                </button>

                {isOpen ? (
                  items.length === 0 ? (
                    <p className="px-4 pb-4 text-sm text-zinc-500">
                      Nenhum item neste status.
                    </p>
                  ) : (
                    <div className="border-t border-zinc-100 dark:border-zinc-900">
                      {items.map((client) => {
                        const responsible = client.responsible_id
                          ? profileMap.get(client.responsible_id)
                          : null;
                        return (
                          <Link
                            key={client.id}
                            href={`/clientes/${client.id}`}
                            className="grid gap-2 border-b border-zinc-100 px-4 py-3 text-sm last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50 lg:grid-cols-[1fr_180px_140px_140px]"
                          >
                            <span className="font-medium">{client.name}</span>
                            <span className="text-zinc-500">
                              {responsible?.full_name || "—"}
                            </span>
                            <span className="text-zinc-500">
                              {formatDateBR(client.created_at.slice(0, 10))}
                            </span>
                            <span>
                              <span
                                className="rounded-full px-2 py-0.5 text-xs text-white"
                                style={{ backgroundColor: meta.color }}
                              >
                                {meta.label}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )
                ) : null}
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
                const res = await createClientRecord(fd);
                if (res.error) setError(res.error);
                else {
                  setShowCreate(false);
                  router.refresh();
                }
              });
            }}
          >
            <h2 className="text-lg font-semibold">Novo Cliente</h2>
            <Input name="name" placeholder="Nome do cliente" required />
            <select
              name="status"
              className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700"
              defaultValue="oportunidade"
            >
              {CLIENT_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {CLIENT_STATUS_META[s].label}
                </option>
              ))}
            </select>
            <select
              name="responsible_id"
              className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700"
              defaultValue=""
            >
              <option value="">Sem responsável</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} · {p.job_title}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">
              A data de criação é registrada automaticamente. Demandas (tasks)
              entram depois, no detalhe do cliente.
            </p>
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
                Criar
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
