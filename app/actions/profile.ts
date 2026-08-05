"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await requireUser();
  const fullName = String(formData.get("full_name") || "").trim();
  if (!fullName) return { error: "Nome obrigatório" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", session.profile.id);

  if (error) return { error: error.message };
  revalidatePath("/perfil");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const session = await requireUser();
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Selecione uma imagem" };
  if (file.size > 10 * 1024 * 1024) return { error: "Máximo 10MB" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${session.profile.id}/avatar.${ext}`;
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
    .eq("id", session.profile.id);

  if (error) return { error: error.message };
  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeAvatar() {
  const session = await requireUser();
  const supabase = await createClient();

  await supabase.storage.from("avatars").remove([
    `${session.profile.id}/avatar.jpg`,
    `${session.profile.id}/avatar.png`,
    `${session.profile.id}/avatar.webp`,
    `${session.profile.id}/avatar.gif`,
  ]);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", session.profile.id);

  if (error) return { error: error.message };
  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true };
}
