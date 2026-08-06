"use server";

import { canCreateDemand, requireUser } from "@/lib/auth";
import { weekEndDateISO } from "@/lib/progress";
import { ensureWeekSprint } from "@/lib/sprints";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser, TaskStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

async function log(clientId: string, action: string, meta: Record<string, unknown> = {}) {
  const supabase = await createClient();
  await supabase.rpc("log_activity", {
    p_client_id: clientId,
    p_action: action,
    p_meta: meta,
  });
}

/** Demand creators/admins: full. Assignees: only self-assigned on a client they already work on. */
async function assertCanCreateTask(
  session: SessionUser,
  clientId: string,
  assigneeId: string | null,
): Promise<string | null> {
  if (canCreateDemand(session) || session.profile.is_admin) return null;

  if (assigneeId !== session.profile.id) {
    return "Você só pode criar tarefas atribuídas a você";
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("assignee_id", session.profile.id);

  if (error) return error.message;
  if (!count || count < 1) {
    return "Sem permissão para criar tarefa neste cliente";
  }
  return null;
}

function canEditTaskRow(
  session: SessionUser,
  task: { assignee_id: string | null },
): boolean {
  return (
    session.profile.is_admin ||
    canCreateDemand(session) ||
    task.assignee_id === session.profile.id
  );
}

export async function createTask(formData: FormData) {
  const session = await requireUser();

  const clientId = String(formData.get("client_id") || "");
  const title = String(formData.get("title") || "").trim();
  let assigneeId = String(formData.get("assignee_id") || "") || null;
  let sprintId = String(formData.get("sprint_id") || "") || null;
  // Points field removed from Nova demanda UI — default to 1.
  const rawPoints = formData.get("points");
  const points =
    rawPoints === null || rawPoints === ""
      ? 1
      : Number(rawPoints);
  // Prefill / fallback: Saturday that closes the current work week (Mon–Sat).
  const dueDate =
    String(formData.get("due_date") || "").trim() || weekEndDateISO();

  if (!clientId || !title) return { error: "Cliente e título obrigatórios" };

  // Collaborators cannot assign work to others.
  if (!canCreateDemand(session) && !session.profile.is_admin) {
    assigneeId = session.profile.id;
  }

  const denied = await assertCanCreateTask(session, clientId, assigneeId);
  if (denied) return { error: denied };

  const supabase = await createClient();

  // Dashboard "Nova demanda" / "Adicionar tarefa" omit sprint_id — attach to
  // the client's Mon–Sat week sprint (create if missing). Explicit sprint_id
  // from client detail is preserved.
  if (!sprintId) {
    const ensured = await ensureWeekSprint(supabase, clientId, dueDate);
    if ("error" in ensured) return { error: ensured.error };
    sprintId = ensured.id;
  }

  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      client_id: clientId,
      sprint_id: sprintId,
      title,
      assignee_id: assigneeId,
      points: Number.isFinite(points) ? points : 1,
      due_date: dueDate,
      position: count || 0,
      created_by: session.profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  await log(clientId, "task_created", {
    task_id: data.id,
    title,
    assignee_id: assigneeId,
    sprint_id: sprintId,
  });
  revalidatePath("/dashboard");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/progresso");
  return { success: true, id: data.id };
}

export async function toggleTaskStatus(taskId: string, status: TaskStatus) {
  const session = await requireUser();
  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchError || !task) return { error: fetchError?.message || "Task não encontrada" };

  if (!canEditTaskRow(session, task)) return { error: "Sem permissão" };

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) return { error: error.message };
  const action =
    status === "done"
      ? "task_completed"
      : status === "doing"
        ? "task_started"
        : "task_reopened";
  await log(task.client_id, action, {
    task_id: taskId,
    title: task.title,
  });
  revalidatePath("/dashboard");
  revalidatePath(`/clientes/${task.client_id}`);
  revalidatePath("/progresso");
  return { success: true };
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    assignee_id?: string | null;
    points?: number;
    due_date?: string | null;
    sprint_id?: string | null;
  },
) {
  const session = await requireUser();
  const supabase = await createClient();
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchError || !task) {
    return { error: fetchError?.message || "Task não encontrada" };
  }

  if (!canEditTaskRow(session, task)) {
    return { error: "Sem permissão" };
  }

  const isDemandCreator =
    canCreateDemand(session) || session.profile.is_admin;

  // Assignees may edit content of their tasks, not reassign to others.
  const patch: typeof data = { ...data };
  if (!isDemandCreator) {
    delete patch.assignee_id;
    delete patch.sprint_id;
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of ["title", "assignee_id", "points", "due_date", "sprint_id"] as const) {
    if (patch[key] === undefined) continue;
    const from = task[key];
    const to = patch[key];
    if (from !== to) {
      changes[key] = { from, to };
    }
  }

  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
  if (error) return { error: error.message };

  await log(task.client_id, "task_updated", {
    task_id: taskId,
    title: typeof patch.title === "string" ? patch.title : task.title,
    changes,
    ...patch,
  });
  revalidatePath(`/clientes/${task.client_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/progresso");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const session = await requireUser();
  if (!canCreateDemand(session) && !session.profile.is_admin) {
    return { error: "Sem permissão" };
  }

  const supabase = await createClient();
  // Single round-trip: delete + return row for logging/revalidation.
  const { data: task, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select("client_id, title")
    .single();

  if (error) return { error: error.message };

  // Activity log is best-effort — don't block the client on it.
  if (task) {
    void log(task.client_id, "task_deleted", { title: task.title });
    revalidatePath(`/clientes/${task.client_id}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/progresso");
  return { success: true };
}
