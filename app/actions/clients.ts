"use server";

import { canCreateDemand, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ClientStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

async function log(clientId: string, action: string, meta: Record<string, unknown> = {}) {
  const supabase = await createClient();
  await supabase.rpc("log_activity", {
    p_client_id: clientId,
    p_action: action,
    p_meta: meta,
  });
}

export async function createClientRecord(formData: FormData) {
  const session = await requireUser();
  if (!canCreateDemand(session)) return { error: "Sem permissão para criar" };

  const name = String(formData.get("name") || "").trim();
  const status = String(formData.get("status") || "oportunidade") as ClientStatus;
  const responsibleId = String(formData.get("responsible_id") || "") || null;

  if (!name) return { error: "Nome obrigatório" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      status,
      responsible_id: responsibleId,
      deadline: null,
      created_by: session.profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  await log(data.id, "client_created", { name });
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { success: true, id: data.id };
}

export async function updateClient(
  clientId: string,
  data: {
    name?: string;
    status?: ClientStatus;
    responsible_id?: string | null;
    deadline?: string | null;
    description?: string | null;
    dev_stage?: number;
    week_priority?: number;
    focal_point?: string | null;
    focal_phone?: string | null;
  },
) {
  const session = await requireUser();
  if (!canCreateDemand(session) && !session.profile.is_admin) {
    // allow description updates for viewers? Plan says tech lead creates - keep write gated
    return { error: "Sem permissão" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(data).eq("id", clientId);
  if (error) return { error: error.message };
  await log(clientId, "client_updated", data as Record<string, unknown>);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createSprint(clientId: string, name: string) {
  const session = await requireUser();
  if (!canCreateDemand(session)) return { error: "Sem permissão" };

  const supabase = await createClient();
  const { count } = await supabase
    .from("sprints")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  const { data, error } = await supabase
    .from("sprints")
    .insert({
      client_id: clientId,
      name: name || `Sprint ${String((count || 0) + 1).padStart(2, "0")}`,
      position: count || 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  await log(clientId, "sprint_created", { sprint_id: data.id, name });
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/dashboard");
  return { success: true, id: data.id };
}

export async function uploadAttachment(clientId: string, formData: FormData) {
  await requireUser();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Arquivo obrigatório" };

  const supabase = await createClient();
  const path = `${clientId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const session = await requireUser();
  const { error } = await supabase.from("attachments").insert({
    client_id: clientId,
    file_name: file.name,
    file_path: path,
    file_size: file.size,
    mime_type: file.type,
    uploaded_by: session.profile.id,
  });

  if (error) return { error: error.message };
  await log(clientId, "attachment_uploaded", { file_name: file.name });
  revalidatePath(`/clientes/${clientId}`);
  return { success: true };
}
