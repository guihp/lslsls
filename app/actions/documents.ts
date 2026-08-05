"use server";

import { canCreateDemand, canViewScreen, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { DocumentVisibility } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function createDocument(formData: FormData) {
  const session = await requireUser();
  if (!canCreateDemand(session) && !session.profile.is_admin) {
    return { error: "Sem permissão" };
  }
  if (!canViewScreen(session, "documentos") && !session.profile.is_admin) {
    return { error: "Sem acesso a documentos" };
  }

  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim() || null;
  const category = String(formData.get("category") || "geral");
  const icon = String(formData.get("icon") || "file");
  const visibility = (String(formData.get("visibility") || "todos") as DocumentVisibility);
  const file = formData.get("file") as File | null;

  if (!title) return { error: "Título obrigatório" };
  if (!url && (!file || file.size === 0)) {
    return { error: "Informe um link ou envie um arquivo" };
  }

  const supabase = await createClient();
  let filePath: string | null = null;

  if (file && file.size > 0) {
    filePath = `${session.profile.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { contentType: file.type });
    if (uploadError) return { error: uploadError.message };
  }

  const { error } = await supabase.from("documents").insert({
    title,
    url,
    file_path: filePath,
    category,
    icon,
    visibility,
    created_by: session.profile.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/documentos");
  return { success: true };
}

export async function deleteDocument(documentId: string) {
  const session = await requireUser();
  if (!canCreateDemand(session) && !session.profile.is_admin) {
    return { error: "Sem permissão" };
  }

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", documentId)
    .single();

  if (doc?.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) return { error: error.message };
  revalidatePath("/documentos");
  return { success: true };
}
