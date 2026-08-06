"use server";

import { canCreateDemand, requireUser } from "@/lib/auth";
import { weekEndDateISO } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

async function log(clientId: string, action: string, meta: Record<string, unknown> = {}) {
  const supabase = await createClient();
  await supabase.rpc("log_activity", {
    p_client_id: clientId,
    p_action: action,
    p_meta: meta,
  });
}

export async function createTask(formData: FormData) {
  const session = await requireUser();
  if (!canCreateDemand(session)) return { error: "Sem permissão para criar demanda" };

  const clientId = String(formData.get("client_id") || "");
  const title = String(formData.get("title") || "").trim();
  const assigneeId = String(formData.get("assignee_id") || "") || null;
  const sprintId = String(formData.get("sprint_id") || "") || null;
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

  const supabase = await createClient();
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
  await log(clientId, "task_created", { task_id: data.id, title, assignee_id: assigneeId });
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

  const canEdit =
    session.profile.is_admin ||
    canCreateDemand(session) ||
    task.assignee_id === session.profile.id;

  if (!canEdit) return { error: "Sem permissão" };

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
  if (!canCreateDemand(session) && !session.profile.is_admin) {
    return { error: "Sem permissão" };
  }

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("client_id")
    .eq("id", taskId)
    .single();

  const { error } = await supabase.from("tasks").update(data).eq("id", taskId);
  if (error) return { error: error.message };

  if (task) {
    await log(task.client_id, "task_updated", { task_id: taskId, ...data });
    revalidatePath(`/clientes/${task.client_id}`);
  }
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
  const { data: task } = await supabase
    .from("tasks")
    .select("client_id, title")
    .eq("id", taskId)
    .single();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };

  if (task) {
    await log(task.client_id, "task_deleted", { title: task.title });
    revalidatePath(`/clientes/${task.client_id}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/progresso");
  return { success: true };
}
