"use client";

import { createTask, toggleTaskStatus } from "@/app/actions/tasks";
import { ClientDetailDrawer } from "@/components/clients/client-detail-drawer";
import { EmptyState } from "@/components/empty-state";
import { ProgressGauge } from "@/components/progress-gauge";
import {
  TaskStatusIcon,
  taskTitleClassName,
} from "@/components/task-status-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProgressSnapshot } from "@/lib/progress";
import {
  nextTaskStatus,
  TASK_STATUS_LABEL,
  type Client,
  type Profile,
  type Task,
} from "@/lib/types";
import { formatDateBR } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Plus,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function DashboardView({
  clients,
  allClients,
  tasks,
  profiles,
  canCreate,
  weekLabel,
  dayLabel,
  weekly,
  currentUserId,
}: {
  clients: Client[];
  allClients: Client[];
  tasks: Task[];
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url" | "job_title">[];
  canCreate: boolean;
  weekLabel: string;
  dayLabel: string;
  daily: ProgressSnapshot;
  weekly: ProgressSnapshot;
  currentUserId: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const byClient = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const list = map.get(t.client_id) || [];
      list.push(t);
      map.set(t.client_id, list);
    }
    return map;
  }, [tasks]);

  const totalPoints = tasks.reduce((s, t) => s + t.points, 0);
  const donePoints = tasks
    .filter((t) => t.status === "done")
    .reduce((s, t) => s + t.points, 0);

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Dev Dashboard</h1>
        <span className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-500 dark:border-zinc-700">
          {weekLabel}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">
          {dayLabel}
        </span>
        {canCreate ? (
          <Button
            type="button"
            className="ml-auto"
            onClick={() => {
              setError(null);
              setShowNewTask((prev) => !prev);
            }}
          >
            <Plus className="h-4 w-4" /> Nova demanda
          </Button>
        ) : null}
      </div>

      {canCreate && showNewTask ? (
        <form
          className="mb-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await createTask(fd);
              if (res.error) setError(res.error);
              else {
                setShowNewTask(false);
                router.refresh();
              }
            });
          }}
        >
          <h2 className="text-lg font-semibold">Nova demanda</h2>
          {allClients.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Cadastre um cliente em{" "}
              <Link href="/clientes" className="text-orange-600 underline">
                Clientes
              </Link>{" "}
              para poder criar demandas.
            </p>
          ) : (
            <>
              <Input name="title" placeholder="Título da demanda" required />
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  name="client_id"
                  required
                  className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                >
                  {allClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  name="assignee_id"
                  defaultValue={currentUserId}
                  className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} · {p.job_title}
                    </option>
                  ))}
                </select>
                <Input
                  name="points"
                  type="number"
                  min={0}
                  defaultValue={1}
                  placeholder="Pontos"
                />
                <Input name="due_date" type="date" />
              </div>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewTask(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  Criar demanda
                </Button>
              </div>
            </>
          )}
        </form>
      ) : null}

      <div className="grid gap-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Minhas Tarefas da Semana</h2>
            <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
              <span>{clients.length} clientes</span>
              <span>{tasks.length} tasks</span>
              <span>
                {donePoints}/{totalPoints} pts
              </span>
            </div>
          </div>

          {clients.length === 0 ? (
            <EmptyState
              title="Nenhuma demanda atribuída"
              description={
                canCreate
                  ? "Crie a primeira demanda e direcione para alguém do time."
                  : "Quando um ADMIN criar e direcionar demandas para você, elas aparecem aqui."
              }
              action={
                canCreate ? (
                  <Button type="button" onClick={() => setShowNewTask(true)}>
                    <Plus className="h-4 w-4" /> Nova demanda
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {clients.map((client) => {
                const clientTasks = byClient.get(client.id) || [];
                const done = clientTasks.filter((t) => t.status === "done").length;
                const total = clientTasks.length;
                const complete = total > 0 && done === total;
                const isOpen = expanded[client.id] ?? true;

                return (
                  <div
                    key={client.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3 px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [client.id]: !isOpen,
                          }))
                        }
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        )}
                      </button>
                      {complete ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-amber-400" />
                      )}
                      <button
                        type="button"
                        className="flex-1 text-left font-medium hover:underline"
                        onClick={() => setDrawerClientId(client.id)}
                      >
                        {client.name}{" "}
                        <span className="text-zinc-500">
                          ({total} task{total === 1 ? "" : "s"})
                        </span>
                      </button>
                      <span className="inline-flex items-center gap-1 text-sm text-zinc-500">
                        <Rocket className="h-3.5 w-3.5" />
                        {done}/{total || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-zinc-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateBR(
                          client.deadline || client.created_at.slice(0, 10),
                        )}
                      </span>
                    </div>

                    {isOpen ? (
                      <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-900">
                        {clientTasks.map((task, idx) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          >
                            <button
                              type="button"
                              disabled={pending}
                              title={TASK_STATUS_LABEL[task.status]}
                              aria-label={TASK_STATUS_LABEL[task.status]}
                              onClick={() =>
                                startTransition(async () => {
                                  await toggleTaskStatus(
                                    task.id,
                                    nextTaskStatus(task.status),
                                  );
                                  router.refresh();
                                })
                              }
                            >
                              <TaskStatusIcon
                                status={task.status}
                                className="h-5 w-5"
                              />
                            </button>
                            <span className={taskTitleClassName(task.status)}>
                              {String(idx + 1).padStart(2, "0")}. {task.title}
                            </span>
                            <span className="ml-auto text-xs text-zinc-500">
                              {task.points} pts
                            </span>
                          </div>
                        ))}

                        {canCreate ? (
                          addingFor === client.id ? (
                            <form
                              className="mt-2 space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                fd.set("client_id", client.id);
                                startTransition(async () => {
                                  const res = await createTask(fd);
                                  if (res.error) setError(res.error);
                                  else {
                                    setAddingFor(null);
                                    router.refresh();
                                  }
                                });
                              }}
                            >
                              <Input
                                name="title"
                                placeholder="Título da demanda"
                                required
                              />
                              <input
                                type="hidden"
                                name="assignee_id"
                                value={currentUserId}
                              />
                              <input type="hidden" name="points" value="1" />
                              {error ? (
                                <p className="text-sm text-red-500">{error}</p>
                              ) : null}
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setAddingFor(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button type="submit" disabled={pending}>
                                  Salvar
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              className="mt-1 inline-flex items-center gap-1 px-2 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                              onClick={() => setAddingFor(client.id)}
                            >
                              <Plus className="h-4 w-4" /> Adicionar tarefa
                            </button>
                          )
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <ProgressGauge
          percent={weekly.percent}
          completed={weekly.completed}
          expected={weekly.expected}
        />
      </div>

      {drawerClientId ? (
        <ClientDetailDrawer
          key={drawerClientId}
          clientId={drawerClientId}
          onClose={() => setDrawerClientId(null)}
          canCreate={canCreate}
          currentUserId={currentUserId}
        />
      ) : null}
    </div>
  );
}
