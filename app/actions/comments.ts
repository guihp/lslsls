"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createComment(clientId: string, body: string, parentId?: string) {
  const session = await requireUser();
  const text = body.trim();
  if (!text) return { error: "Comentário vazio" };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    client_id: clientId,
    user_id: session.profile.id,
    body: text,
    parent_id: parentId || null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  return { success: true };
}

export async function updateComment(commentId: string, body: string, clientId: string) {
  const session = await requireUser();
  const text = body.trim();
  if (!text) return { error: "Comentário vazio" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .update({ body: text })
    .eq("id", commentId)
    .eq("user_id", session.profile.id);

  if (error) return { error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  return { success: true };
}
