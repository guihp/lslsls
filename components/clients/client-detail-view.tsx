"use client";

import {
  createSprint,
  updateClient,
  uploadAttachment,
} from "@/app/actions/clients";
import { createComment } from "@/app/actions/comments";
import { createTask, toggleTaskStatus } from "@/app/actions/tasks";
import {
  TaskStatusIcon,
  taskTitleClassName,
} from "@/components/task-status-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CLIENT_STATUS_META,
  CLIENT_STATUS_ORDER,
  nextTaskStatus,
  TASK_STATUS_LABEL,
  type ActivityLog,
  type Attachment,
  type Client,
  type ClientStatus,
  type Comment,
  type Profile,
  type Sprint,
  type Task,
} from "@/lib/types";
import { cn, formatDateBR, formatDateLong, relativeTime } from "@/lib/utils";
import {
  ChevronDown,
  Paperclip,
  Plus,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function ClientDetailView({
  client,
  sprints,
  tasks,
  comments,
  activity,
  attachments,
  profiles,
  canCreate,
  currentUserId,
  onRefresh,
  compact = false,
}: {
  client: Client;
  sprints: Sprint[];
  tasks: Task[];
  comments: Comment[];
  activity: ActivityLog[];
  attachments: Attachment[];
  profiles: Profile[];
  canCreate: boolean;
  currentUserId: string;
  onRefresh?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"comentarios" | "atividade">("comentarios");
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [addingSprint, setAddingSprint] = useState<string | null>(null);
  const [openSprints, setOpenSprints] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );
  const responsible = client.responsible_id
    ? profileMap.get(client.responsible_id)
    : null;
  const statusMeta = CLIENT_STATUS_META[client.status];

  const tasksBySprint = useMemo(() => {
    const map = new Map<string | null, Task[]>();
    for (const t of tasks) {
      const key = t.sprint_id;
      const list = map.get(key) || [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  function refresh() {
    router.refresh();
    onRefresh?.();
  }

  return (
    <div
      className={cn(
        "grid",
        compact
          ? "grid-cols-1"
          : "min-h-screen lg:grid-cols-[1fr_360px]",
      )}
    >
      <div className="px-6 py-6">
        <div className="mb-4 text-sm text-zinc-500">
          <Link href="/clientes" className="hover:underline">
            Projetos
          </Link>{" "}
          &gt;{" "}
          <Link href="/clientes" className="hover:underline">
            Clientes
          </Link>{" "}
          &gt; <span className="text-zinc-900 dark:text-white">{client.name}</span>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className={cn("font-semibold", compact ? "text-2xl" : "text-3xl")}>
            {client.name}
          </h1>
          {canCreate ? (
            <select
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: statusMeta.color }}
              value={client.status}
              onChange={(e) => {
                startTransition(async () => {
                  await updateClient(client.id, {
                    status: e.target.value as ClientStatus,
                  });
                  refresh();
                });
              }}
            >
              {CLIENT_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {CLIENT_STATUS_META[s].label}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-zinc-500">Responsável</p>
            <p className="mt-1 font-medium">
              {responsible?.full_name || "—"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Criado em</p>
            <p className="mt-1 font-medium">
              {formatDateLong(client.created_at)}
            </p>
          </div>
          {client.deadline ? (
            <div>
              <p className="text-zinc-500">Prazo do projeto</p>
              <p className="mt-1 font-medium">{formatDateBR(client.deadline)}</p>
            </div>
          ) : null}
        </div>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Descrição
          </h2>
          <Textarea
            defaultValue={client.description || ""}
            placeholder="Clique para adicionar descrição..."
            disabled={!canCreate || pending}
            onBlur={(e) => {
              if (!canCreate) return;
              const value = e.target.value;
              if (value === (client.description || "")) return;
              startTransition(async () => {
                await updateClient(client.id, { description: value });
                refresh();
              });
            }}
            rows={3}
          />
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Anexos
          </h2>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-sm text-zinc-500 dark:border-zinc-700">
            <Paperclip className="mb-2 h-5 w-5" />
            Arraste arquivos aqui ou clique para fazer upload
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.set("file", file);
                startTransition(async () => {
                  const res = await uploadAttachment(client.id, fd);
                  if (res.error) setError(res.error);
                  else refresh();
                });
              }}
            />
          </label>
          {attachments.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {attachments.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  {a.file_name}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Propriedades
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <PropField
              label="Etapa de Desenvolvimento"
              value={String(client.dev_stage)}
              editable={canCreate}
              onSave={(v) =>
                startTransition(async () => {
                  await updateClient(client.id, {
                    dev_stage: Number(v) || 1,
                  });
                  refresh();
                })
              }
            />
            <PropField
              label="Ponto Focal"
              value={client.focal_point || ""}
              editable={canCreate}
              onSave={(v) =>
                startTransition(async () => {
                  await updateClient(client.id, { focal_point: v || null });
                  refresh();
                })
              }
            />
            <PropField
              label="Prioridade da Semana"
              value={String(client.week_priority)}
              editable={canCreate}
              onSave={(v) =>
                startTransition(async () => {
                  await updateClient(client.id, {
                    week_priority: Number(v) || 1,
                  });
                  refresh();
                })
              }
            />
            <PropField
              label="Telefone do Ponto Focal"
              value={client.focal_phone || ""}
              editable={canCreate}
              onSave={(v) =>
                startTransition(async () => {
                  await updateClient(client.id, { focal_phone: v || null });
                  refresh();
                })
              }
            />
          </div>
        </section>

        <section className="space-y-3">
          {sprints.map((sprint) => {
            const sprintTasks = tasksBySprint.get(sprint.id) || [];
            const isOpen = openSprints[sprint.id] ?? true;
            return (
              <div
                key={sprint.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-left"
                  onClick={() =>
                    setOpenSprints((prev) => ({
                      ...prev,
                      [sprint.id]: !isOpen,
                    }))
                  }
                >
                  <ChevronDown
                    className={`h-4 w-4 transition ${isOpen ? "" : "-rotate-90"}`}
                  />
                  <span className="font-medium">
                    {sprint.name} ({sprintTasks.length} tasks)
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    Sprint
                  </span>
                </button>
                {isOpen ? (
                  <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-900">
                    {sprintTasks.map((task, idx) => {
                      const assignee = task.assignee_id
                        ? profileMap.get(task.assignee_id)
                        : null;
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-lg px-2 py-2"
                        >
                          <button
                            type="button"
                            title={TASK_STATUS_LABEL[task.status]}
                            aria-label={TASK_STATUS_LABEL[task.status]}
                            onClick={() =>
                              startTransition(async () => {
                                await toggleTaskStatus(
                                  task.id,
                                  nextTaskStatus(task.status),
                                );
                                refresh();
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
                          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
                            {assignee ? (
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {assignee.full_name.split(" ")[0]}
                              </span>
                            ) : null}
                            <span>{formatDateBR(task.due_date)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {canCreate ? (
                      addingSprint === sprint.id ? (
                        <form
                          className="mt-2 space-y-2 p-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            fd.set("client_id", client.id);
                            fd.set("sprint_id", sprint.id);
                            startTransition(async () => {
                              const res = await createTask(fd);
                              if (res.error) setError(res.error);
                              else {
                                setAddingSprint(null);
                                refresh();
                              }
                            });
                          }}
                        >
                          <Input name="title" placeholder="Nova tarefa" required />
                          <div className="grid grid-cols-2 gap-2">
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
                            />
                          </div>
                          <Input name="due_date" type="date" />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setAddingSprint(null)}
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
                          className="inline-flex items-center gap-1 px-2 py-2 text-sm text-zinc-500"
                          onClick={() => setAddingSprint(sprint.id)}
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

          {(tasksBySprint.get(null) || []).length > 0 ? (
            <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="mb-2 text-sm font-medium">Sem sprint</p>
              {(tasksBySprint.get(null) || []).map((task) => (
                <div key={task.id} className="flex items-center gap-2 py-1 text-sm">
                  <button
                    type="button"
                    title={TASK_STATUS_LABEL[task.status]}
                    aria-label={TASK_STATUS_LABEL[task.status]}
                    onClick={() =>
                      startTransition(async () => {
                        await toggleTaskStatus(
                          task.id,
                          nextTaskStatus(task.status),
                        );
                        refresh();
                      })
                    }
                  >
                    <TaskStatusIcon
                      status={task.status}
                      className="h-4 w-4"
                    />
                  </button>
                  {task.title}
                </div>
              ))}
            </div>
          ) : null}

          {canCreate ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await createSprint(
                    client.id,
                    `Sprint ${String(sprints.length + 1).padStart(2, "0")}`,
                  );
                  refresh();
                })
              }
            >
              <Plus className="h-4 w-4" /> Nova Sprint
            </Button>
          ) : null}
        </section>
        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
      </div>

      <aside
        className={cn(
          "bg-white dark:bg-zinc-950",
          compact
            ? "border-t border-zinc-200 dark:border-zinc-800"
            : "border-l border-zinc-200 dark:border-zinc-800",
        )}
      >        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              tab === "comentarios"
                ? "border-b-2 border-zinc-900 dark:border-white"
                : "text-zinc-500"
            }`}
            onClick={() => setTab("comentarios")}
          >
            Comentários
          </button>
          <button
            type="button"
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              tab === "atividade"
                ? "border-b-2 border-zinc-900 dark:border-white"
                : "text-zinc-500"
            }`}
            onClick={() => setTab("atividade")}
          >
            Atividade
          </button>
        </div>

        <div
          className={cn(
            "flex flex-col",
            compact ? "min-h-[420px]" : "h-[calc(100vh-49px)]",
          )}
        >          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {tab === "comentarios" ? (
              comments.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum comentário ainda.</p>
              ) : (
                comments.map((c) => {
                  const author = profileMap.get(c.user_id);
                  return (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          {author?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={author.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-zinc-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {author?.full_name || "Usuário"}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {relativeTime(c.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap pl-10 text-sm text-zinc-700 dark:text-zinc-300">
                        {c.body}
                      </p>
                    </div>
                  );
                })
              )
            ) : activity.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma atividade ainda.</p>
            ) : (
              activity.map((a) => {
                const actor = a.user_id ? profileMap.get(a.user_id) : null;
                return (
                  <div key={a.id} className="text-sm">
                    <p className="font-medium">
                      {actor?.full_name || "Sistema"} · {a.action}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {relativeTime(a.created_at)}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {tab === "comentarios" ? (
            <form
              className="border-t border-zinc-200 p-3 dark:border-zinc-800"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const res = await createComment(client.id, comment);
                  if (res.error) setError(res.error);
                  else {
                    setComment("");
                    refresh();
                  }
                });
              }}
            >
              <Textarea
                placeholder="Escreva um comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={pending || !comment.trim()}>
                  Enviar
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function PropField({
  label,
  value,
  editable,
  onSave,
}: {
  label: string;
  value: string;
  editable: boolean;
  onSave: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <Input
        defaultValue={value}
        disabled={!editable}
        onBlur={(e) => {
          if (!editable) return;
          if (e.target.value === value) return;
          onSave(e.target.value);
        }}
      />
    </div>
  );
}
