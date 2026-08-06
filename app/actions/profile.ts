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

const AVATAR_FILE_NAME = /^avatar-\d+\.(jpg|jpeg|png|webp|gif|heic|heif)$/i;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function deleteAvatarFiles(
  supabase: SupabaseClient,
  userId: string,
  keep?: string,
) {
  const { data } = await supabase.storage.from("avatars").list(userId);
  const stale = (data ?? [])
    .map((entry) => `${userId}/${entry.name}`)
    .filter((path) => path !== keep);
  if (stale.length > 0) {
    await supabase.storage.from("avatars").remove(stale);
  }
}

/**
 * The browser uploads the image straight to Supabase Storage, so this action
 * only persists the resulting path — keeping the payload far below the Server
 * Actions body size limit.
 */
export async function saveAvatarPath(path: string) {
  const session = await requireUser();
  const userId = session.profile.id;

  const [folder, fileName, ...rest] = path.split("/");
  if (
    folder !== userId ||
    rest.length > 0 ||
    !AVATAR_FILE_NAME.test(fileName ?? "")
  ) {
    return { error: "Caminho de imagem inválido" };
  }

  const supabase = await createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (error) return { error: error.message };

  await deleteAvatarFiles(supabase, userId, path);
  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeAvatar() {
  const session = await requireUser();
  const supabase = await createClient();

  await deleteAvatarFiles(supabase, session.profile.id);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", session.profile.id);

  if (error) return { error: error.message };
  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true };
}
