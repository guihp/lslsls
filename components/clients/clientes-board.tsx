"use client";

import { createClientRecord, updateClient } from "@/app/actions/clients";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isOverdue } from "@/lib/progress";
import {
  boardClientStatus,
  CLIENT_STATUS_META,
  CLIENT_STATUS_ORDER,
  type Client,
  type ClientStatus,
  type Profile,
  type Task,
} from "@/lib/types";
import { cn, formatDateBR } from "@/lib/utils";
import {
  Check,
  Filter,
  FlaskConical,
  Folder,
  Plus,
  Rocket,
  Search,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useTransition,
  type DragEvent,
} from "react";

const ICONS = {
  rocket: Rocket,
  folder: Folder,
  flask: FlaskConical,
  settings: Settings,
  check: Check,
  x: X,
} as const;

export function ClientesBoard({
  clients,
  profiles,
  canCreate,
}: {
  clients: Client[];
  tasks: Task[];
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url" | "job_title">[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ClientStatus | null>(
    null,
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
    for (const c of visibleClients) {
      map[boardClientStatus(c.status)].push(c);
    }
    return map;
  }, [visibleClients]);

  function moveClient(clientId: string, status: ClientStatus) {
    if (!canCreate) return;
    const client = clients.find((c) => c.id === clientId);
    if (!client || boardClientStatus(client.status) === status) return;
    startTransition(async () => {
      await updateClient(clientId, { status });
      router.refresh();
    });
  }

  function onCardDragStart(e: DragEvent, clientId: string) {
    if (!canCreate) return;
    e.dataTransfer.setData("text/plain", clientId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(clientId);
  }

  function onCardDragEnd() {
    setDraggingId(null);
    setDragOverStatus(null);
  }

  function onColumnDragOver(e: DragEvent, status: ClientStatus) {
    if (!canCreate) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStatus !== status) setDragOverStatus(status);
  }

  function onColumnDrop(e: DragEvent, status: ClientStatus) {
    if (!canCreate) return;
    e.preventDefault();
    const clientId = e.dataTransfer.getData("text/plain");
    setDragOverStatus(null);
    setDraggingId(null);
    if (clientId) moveClient(clientId, status);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-zinc-500">
          Listas &gt;{" "}
          <span className="font-medium text-zinc-900 dark:text-white">
            Clientes
          </span>
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
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" /> Novo Cliente
            </Button>
          ) : null}
        </div>
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
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          {CLIENT_STATUS_ORDER.map((status) => {
            const items = grouped[status];
            const meta = CLIENT_STATUS_META[status];
            const Icon = ICONS[meta.icon as keyof typeof ICONS] || Folder;
            const overdue = items.filter((c) =>
              isOverdue(c.deadline, c.status),
            ).length;
            const noResp = items.filter((c) => !c.responsible_id).length;
            const isDropTarget = dragOverStatus === status;

            return (
              <section
                key={status}
                className={cn(
                  "flex w-[min(85vw,280px)] shrink-0 flex-col rounded-2xl border bg-zinc-50/80 dark:bg-zinc-900/40",
                  isDropTarget
                    ? "border-orange-400 ring-2 ring-orange-400/30"
                    : "border-zinc-200 dark:border-zinc-800",
                )}
                onDragOver={(e) => onColumnDragOver(e, status)}
                onDragLeave={() => {
                  if (dragOverStatus === status) setDragOverStatus(null);
                }}
                onDrop={(e) => onColumnDrop(e, status)}
              >
                <header className="sticky top-0 z-[1] space-y-2 border-b border-zinc-200/80 px-3 py-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span className="text-sm tabular-nums text-zinc-500">
                      {items.length}
                    </span>
                  </div>
                  {(overdue > 0 || noResp > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {overdue > 0 ? (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-500">
                          {overdue} atrasado{overdue > 1 ? "s" : ""}
                        </span>
                      ) : null}
                      {noResp > 0 ? (
                        <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-[11px] text-zinc-400">
                          {noResp} sem resp.
                        </span>
                      ) : null}
                    </div>
                  )}
                </header>

                <div className="flex max-h-[min(70vh,720px)] flex-col gap-2 overflow-y-auto p-2">
                  {items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-zinc-400">
                      Nenhum cliente
                    </p>
                  ) : (
                    items.map((client) => {
                      const responsible = client.responsible_id
                        ? profileMap.get(client.responsible_id)
                        : null;
                      const overdueCard = isOverdue(
                        client.deadline,
                        client.status,
                      );
                      return (
                        <Link
                          key={client.id}
                          href={`/clientes/${client.id}`}
                          draggable={canCreate}
                          onDragStart={(e) => onCardDragStart(e, client.id)}
                          onDragEnd={onCardDragEnd}
                          className={cn(
                            "block rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700",
                            canCreate && "cursor-grab active:cursor-grabbing",
                            draggingId === client.id && "opacity-50",
                            overdueCard && "border-l-4 border-l-red-500",
                          )}
                        >
                          <p className="font-medium leading-snug text-zinc-900 dark:text-white">
                            {client.name}
                          </p>
                          <p className="mt-2 truncate text-xs text-zinc-500">
                            {responsible?.full_name || "Sem responsável"}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-zinc-400">
                              {formatDateBR(client.created_at.slice(0, 10))}
                            </span>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                              style={{ backgroundColor: meta.color }}
                            >
                              {meta.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </section>
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
