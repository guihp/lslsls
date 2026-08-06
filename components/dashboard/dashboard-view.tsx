"use client";

import {
  createTask,
  deleteTask,
  toggleTaskStatus,
  updateTask,
} from "@/app/actions/tasks";
import { ClientDetailDrawer } from "@/components/clients/client-detail-drawer";
import { EmptyState } from "@/components/empty-state";
import { ProgressGauge } from "@/components/progress-gauge";
import { TaskStatusMenu } from "@/components/task-status-menu";
import { taskTitleClassName } from "@/components/task-status-icon";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import type { ProgressSnapshot } from "@/lib/progress";
import { weekEndDateISO } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";
import {
  type Client,
  type Profile,
  type Sprint,
  type Task,
} from "@/lib/types";
import { cn, formatDateBR } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

type ProfileLite = Pick<
  Profile,
  "id" | "full_name" | "avatar_url" | "job_title"
>;

function profileById(profiles: ProfileLite[], id: string | null) {
  if (!id) return null;
  return profiles.find((p) => p.id === id) || null;
}

/** Prefer majority assignee in the group, then client responsible, then fallback. */
function resolveDefaultAssigneeId(
  clientTasks: Task[],
  client: Client,
  fallbackUserId: string,
): string {
  const counts = new Map<string, number>();
  for (const t of clientTasks) {
    if (!t.assignee_id) continue;
    counts.set(t.assignee_id, (counts.get(t.assignee_id) || 0) + 1);
  }
  let bestId: string | null = null;
  let bestCount = 0;
  for (const [id, n] of counts) {
    if (n > bestCount) {
      bestId = id;
      bestCount = n;
    }
  }
  if (bestId) return bestId;
  if (client.responsible_id) return client.responsible_id;
  return fallbackUserId;
}

function AssigneeChip({ profile }: { profile: ProfileLite | null }) {
  if (!profile) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
        <User className="h-3.5 w-3.5" />
        Sem responsável
      </span>
    );
  }
  return (
    <span
      className="inline-flex max-w-[9rem] items-center gap-1 truncate text-xs text-zinc-500"
      title={profile.full_name}
    >
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt=""
          className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <User className="h-3 w-3 text-zinc-400" />
        </span>
      )}
      <span className="truncate">{profile.full_name.split(" ")[0]}</span>
    </span>
  );
}

function TaskEditForm({
  task,
  profiles,
  pending,
  startTransition,
  onCancel,
  onSaved,
  canReassign,
}: {
  task: Task;
  profiles: ProfileLite[];
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onCancel: () => void;
  onSaved: () => void;
  canReassign: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-1 w-full space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const title = String(fd.get("title") || "").trim();
        const points = Number(fd.get("points") || 1);
        const dueDate = String(fd.get("due_date") || "") || null;
        const assigneeId = String(fd.get("assignee_id") || "") || null;
        if (!title) {
          setError("Título obrigatório");
          return;
        }
        setError(null);
        startTransition(() => {
          void (async () => {
            const res = await updateTask(task.id, {
              title,
              points: Number.isFinite(points) ? points : 1,
              due_date: dueDate,
              ...(canReassign ? { assignee_id: assigneeId } : {}),
            });
            if (res.error) setError(res.error);
            else onSaved();
          })();
        });
      }}
    >
      <Input name="title" defaultValue={task.title} required />
      <div className={cn("grid gap-2", canReassign ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <Input
          name="points"
          type="number"
          min={0}
          defaultValue={task.points}
          placeholder="Pontos"
        />
        <Input
          name="due_date"
          type="date"
          defaultValue={task.due_date || ""}
        />
        {canReassign ? (
          <select
            name="assignee_id"
            defaultValue={task.assignee_id || ""}
            className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          >
            <option value="">Sem responsável</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} · {p.job_title}
              </option>
            ))}
          </select>
        ) : (
          <input type="hidden" name="assignee_id" value={task.assignee_id || ""} />
        )}
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}

function ClientTaskGroup({
  client,
  clientTasks,
  sprint,
  profiles,
  canCreate,
  canManageTasks,
  showAssignee,
  currentUserId,
  defaultAssigneeId,
  defaultDueDate,
  pending,
  startTransition,
  editingId,
  setEditingId,
  addingFor,
  setAddingFor,
  error,
  setError,
  router,
  onOpenClient,
  onRequestDelete,
}: {
  client: Client;
  clientTasks: Task[];
  sprint: Sprint | null;
  profiles: ProfileLite[];
  canCreate: boolean;
  /** Add/edit tasks on this group; delete stays on canCreate. */
  canManageTasks: boolean;
  showAssignee: boolean;
  currentUserId: string;
  /** Who new tasks in this group are assigned to (group owner / majority assignee). */
  defaultAssigneeId: string;
  defaultDueDate: string;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  addingFor: string | null;
  setAddingFor: (id: string | null) => void;
  error: string | null;
  setError: (v: string | null) => void;
  router: ReturnType<typeof useRouter>;
  onOpenClient: () => void;
  onRequestDelete: (task: Task) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const done = clientTasks.filter((t) => t.status === "done").length;
  const total = clientTasks.length;
  const complete = total > 0 && done === total;
  const assigneeForNew = defaultAssigneeId || currentUserId;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          )}
        </button>
        {complete ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 shrink-0 text-amber-400" />
        )}
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer text-left font-medium hover:underline"
          onClick={onOpenClient}
        >
          {client.name}{" "}
          <span className="text-zinc-500">
            ({total} task{total === 1 ? "" : "s"})
          </span>
        </button>
        {sprint ? (
          <span
            className="inline-flex max-w-[14rem] items-center gap-1 truncate rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
            title={sprint.name}
          >
            <Rocket className="h-3 w-3 shrink-0" />
            Sprint
            <span className="truncate font-normal text-orange-600/80 dark:text-orange-400/80">
              · {sprint.name}
            </span>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500">
          <Rocket className="h-3.5 w-3.5" />
          {done}/{total || 0}
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateBR(client.deadline || client.created_at.slice(0, 10))}
        </span>
      </div>

      {expanded ? (
        <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-900">
          {clientTasks.map((task, idx) => {
            const assignee = profileById(profiles, task.assignee_id);
            const isEditing = editingId === task.id;
            const canEditThis =
              canCreate || task.assignee_id === currentUserId;

            return (
              <div key={task.id} className="rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <TaskStatusMenu
                    status={task.status}
                    disabled={pending}
                    onSelect={(next) =>
                      startTransition(() => {
                        void (async () => {
                          await toggleTaskStatus(task.id, next);
                          router.refresh();
                        })();
                      })
                    }
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 break-words",
                      taskTitleClassName(task.status),
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}. {task.title}
                  </span>
                  {showAssignee ? <AssigneeChip profile={assignee} /> : null}
                  <span className="shrink-0 text-xs text-zinc-500">
                    {task.points} pts
                  </span>
                  {canEditThis ? (
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-orange-600 dark:hover:bg-zinc-800"
                      title="Editar tarefa"
                      aria-label="Editar tarefa"
                      onClick={() =>
                        setEditingId(isEditing ? null : task.id)
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  {canCreate ? (
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                      title="Excluir demanda"
                      aria-label="Excluir demanda"
                      disabled={pending}
                      onClick={() => onRequestDelete(task)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                {isEditing ? (
                  <TaskEditForm
                    task={task}
                    profiles={profiles}
                    pending={pending}
                    startTransition={startTransition}
                    canReassign={canCreate}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      startTransition(() => {
                        router.refresh();
                      });
                    }}
                  />
                ) : null}
              </div>
            );
          })}

          {canManageTasks ? (
            addingFor === client.id ? (
              <form
                className="mt-2 space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("client_id", client.id);
                  startTransition(() => {
                    void (async () => {
                      const res = await createTask(fd);
                      if (res.error) setError(res.error);
                      else {
                        setAddingFor(null);
                        router.refresh();
                      }
                    })();
                  });
                }}
              >
                <Input name="title" placeholder="Título da tarefa" required />
                <input type="hidden" name="assignee_id" value={assigneeForNew} />
                <Input
                  name="due_date"
                  type="date"
                  defaultValue={defaultDueDate}
                />
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
}

export function DashboardView({
  clients,
  allClients,
  tasks,
  sprints,
  profiles,
  canCreate,
  isAdmin = false,
  weekLabel,
  dayLabel,
  weekly,
  currentUserId,
}: {
  clients: Client[];
  allClients: Client[];
  tasks: Task[];
  sprints: Sprint[];
  profiles: ProfileLite[];
  canCreate: boolean;
  isAdmin?: boolean;
  weekLabel: string;
  dayLabel: string;
  weekly: ProgressSnapshot;
  currentUserId: string;
}) {
  const router = useRouter();
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const defaultDueDate = weekEndDateISO();

  const localTasks = useMemo(
    () => tasks.filter((t) => !removedIds.has(t.id)),
    [tasks, removedIds],
  );

  // Assignees see new/updated demands promptly without a manual refresh.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    const task = deleteTarget;
    setDeleting(true);
    setError(null);
    setRemovedIds((prev) => new Set(prev).add(task.id));
    if (editingId === task.id) setEditingId(null);
    setDeleteTarget(null);

    const res = await deleteTask(task.id);
    setDeleting(false);
    if (res.error) {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      setError(res.error);
      return;
    }
    void router.refresh();
  }

  const sprintById = useMemo(() => {
    const map = new Map<string, Sprint>();
    for (const s of sprints) map.set(s.id, s);
    return map;
  }, [sprints]);

  function sprintForTasks(list: Task[]): Sprint | null {
    const counts = new Map<string, number>();
    for (const t of list) {
      if (!t.sprint_id) continue;
      counts.set(t.sprint_id, (counts.get(t.sprint_id) || 0) + 1);
    }
    let bestId: string | null = null;
    let bestCount = 0;
    for (const [id, n] of counts) {
      if (n > bestCount) {
        bestId = id;
        bestCount = n;
      }
    }
    return bestId ? sprintById.get(bestId) || null : null;
  }

  const myTasks = useMemo(
    () => localTasks.filter((t) => t.assignee_id === currentUserId),
    [localTasks, currentUserId],
  );
  const otherTasks = useMemo(
    () =>
      isAdmin
        ? localTasks.filter((t) => t.assignee_id !== currentUserId)
        : [],
    [localTasks, currentUserId, isAdmin],
  );

  const byClientMine = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of myTasks) {
      const list = map.get(t.client_id) || [];
      list.push(t);
      map.set(t.client_id, list);
    }
    return map;
  }, [myTasks]);

  const byClientOther = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of otherTasks) {
      const list = map.get(t.client_id) || [];
      list.push(t);
      map.set(t.client_id, list);
    }
    return map;
  }, [otherTasks]);

  const myClients = clients.filter((c) => byClientMine.has(c.id));
  const otherClients = clients.filter((c) => byClientOther.has(c.id));

  const totalPoints = myTasks.reduce((s, t) => s + t.points, 0);
  const donePoints = myTasks
    .filter((t) => t.status === "done")
    .reduce((s, t) => s + t.points, 0);

  const sharedRowProps = {
    profiles,
    canCreate,
    currentUserId,
    defaultDueDate,
    pending,
    startTransition,
    editingId,
    setEditingId,
    addingFor,
    setAddingFor,
    error,
    setError,
    router,
    onRequestDelete: (task: Task) => {
      setError(null);
      setDeleteTarget(task);
    },
  };

  return (
    <div className="overflow-x-hidden px-4 py-6 sm:px-6">
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
            className="w-full sm:ml-auto sm:w-auto"
            onClick={() => {
              setError(null);
              setShowNewTask((prev) => !prev);
            }}
          >
            <Plus className="h-4 w-4" /> Nova demanda
          </Button>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {canCreate && showNewTask ? (
        <form
          className="mb-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => {
              void (async () => {
                const res = await createTask(fd);
                if (res.error) setError(res.error);
                else {
                  setShowNewTask(false);
                  router.refresh();
                }
              })();
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
                  className="w-full max-w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
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
                  className="w-full max-w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} · {p.job_title}
                    </option>
                  ))}
                </select>
                <Input
                  name="due_date"
                  type="date"
                  defaultValue={defaultDueDate}
                  className="sm:col-span-2"
                />
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
        {isAdmin ? (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Minhas demandas</h2>
                <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
                  <span>{myClients.length} clientes</span>
                  <span>{myTasks.length} tasks</span>
                  <span>
                    {donePoints}/{totalPoints} pts
                  </span>
                </div>
              </div>
              {myClients.length === 0 ? (
                <EmptyState
                  title="Nenhuma demanda sua nesta lista"
                  description="Crie uma demanda e atribua a você, ou veja a seção do time abaixo."
                  action={
                    canCreate ? (
                      <Button
                        type="button"
                        onClick={() => setShowNewTask(true)}
                      >
                        <Plus className="h-4 w-4" /> Nova demanda
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-2">
                  {myClients.map((client) => {
                    const groupTasks = byClientMine.get(client.id) || [];
                    return (
                    <ClientTaskGroup
                      key={client.id}
                      client={client}
                      clientTasks={groupTasks}
                      sprint={sprintForTasks(groupTasks)}
                      showAssignee={false}
                      canManageTasks
                      defaultAssigneeId={currentUserId}
                      onOpenClient={() => setDrawerClientId(client.id)}
                      {...sharedRowProps}
                    />
                    );
                  })}
                </div>
              )}
            </section>

            {otherClients.length > 0 ? (
              <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 p-5 dark:border-zinc-700 dark:bg-zinc-950/40">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Demandas do time</h2>
                  <span className="text-sm text-zinc-500">
                    {otherTasks.length} task{otherTasks.length === 1 ? "" : "s"}{" "}
                    de outras pessoas
                  </span>
                </div>
                <div className="space-y-2">
                  {otherClients.map((client) => {
                    const groupTasks = byClientOther.get(client.id) || [];
                    return (
                    <ClientTaskGroup
                      key={client.id}
                      client={client}
                      clientTasks={groupTasks}
                      sprint={sprintForTasks(groupTasks)}
                      showAssignee
                      canManageTasks={canCreate}
                      defaultAssigneeId={resolveDefaultAssigneeId(
                        groupTasks,
                        client,
                        currentUserId,
                      )}
                      onOpenClient={() => setDrawerClientId(client.id)}
                      {...sharedRowProps}
                    />
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Minhas Tarefas da Semana</h2>
              <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
                <span>{clients.length} clientes</span>
                <span>{myTasks.length} tasks</span>
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
                    <Button
                      type="button"
                      onClick={() => setShowNewTask(true)}
                    >
                      <Plus className="h-4 w-4" /> Nova demanda
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-2">
                {clients.map((client) => {
                  const groupTasks = byClientMine.get(client.id) || [];
                  return (
                  <ClientTaskGroup
                    key={client.id}
                    client={client}
                    clientTasks={groupTasks}
                    sprint={sprintForTasks(groupTasks)}
                    showAssignee={false}
                    canManageTasks
                    defaultAssigneeId={currentUserId}
                    onOpenClient={() => setDrawerClientId(client.id)}
                    {...sharedRowProps}
                  />
                  );
                })}
              </div>
            )}
          </section>
        )}

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
          canManageTasks={
            canCreate ||
            localTasks.some(
              (t) =>
                t.client_id === drawerClientId &&
                t.assignee_id === currentUserId,
            )
          }
          currentUserId={currentUserId}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir demanda"
        message={
          deleteTarget
            ? `Excluir a demanda "${deleteTarget.title}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        pending={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}
