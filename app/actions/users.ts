"use server";

import { canViewScreen, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserPermissions(
  userId: string,
  data: {
    job_title?: string;
    is_admin?: boolean;
    can_view_dashboard?: boolean;
    can_view_clientes?: boolean;
    can_view_documentos?: boolean;
    can_view_progresso?: boolean;
    can_view_admin?: boolean;
    can_create_demand?: boolean;
  },
) {
  const session = await requireUser();
  if (!canViewScreen(session, "admin") && !session.profile.is_admin) {
    return { error: "Sem permissão" };
  }
  if (!session.profile.is_admin) {
    return { error: "Apenas ADMIN pode alterar permissões" };
  }

  const supabase = await createClient();

  if (data.job_title !== undefined || data.is_admin !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(data.job_title !== undefined ? { job_title: data.job_title } : {}),
        ...(data.is_admin !== undefined ? { is_admin: data.is_admin } : {}),
      })
      .eq("id", userId);
    if (error) return { error: error.message };
  }

  const permUpdate: Record<string, boolean> = {};
  for (const key of [
    "can_view_dashboard",
    "can_view_clientes",
    "can_view_documentos",
    "can_view_progresso",
    "can_view_admin",
    "can_create_demand",
  ] as const) {
    if (data[key] !== undefined) permUpdate[key] = data[key]!;
  }

  if (Object.keys(permUpdate).length > 0) {
    const { error } = await supabase
      .from("user_permissions")
      .update(permUpdate)
      .eq("user_id", userId);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function createUserByAdmin(formData: FormData) {
  const session = await requireUser();
  if (!session.profile.is_admin) {
    return { error: "Apenas ADMIN pode criar usuários" };
  }

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const jobTitle = String(formData.get("job_title") || "Desenvolvedor").trim();

  const permissions = {
    can_view_dashboard: formData.get("can_view_dashboard") === "on",
    can_view_clientes: formData.get("can_view_clientes") === "on",
    can_view_documentos: formData.get("can_view_documentos") === "on",
    can_view_progresso: formData.get("can_view_progresso") === "on",
    can_view_admin: formData.get("can_view_admin") === "on",
    can_create_demand: formData.get("can_create_demand") === "on",
  };

  if (!fullName || !email || password.length < 6) {
    return { error: "Nome, email e senha (mín. 6) obrigatórios" };
  }

  const supabase = await createClient();
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();

  if (!authSession?.access_token) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { error: "Configuração Supabase ausente" };
  }

  const res = await fetch(`${url}/functions/v1/admin-create-user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authSession.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
      job_title: jobTitle,
      permissions,
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    success?: boolean;
  };

  if (!res.ok) {
    return { error: payload.error || "Falha ao criar usuário" };
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}
