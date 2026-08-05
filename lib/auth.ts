import { createClient } from "@/lib/supabase/server";
import type { Profile, SessionUser, UserPermissions } from "@/lib/types";
import { redirect } from "next/navigation";

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: permissions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("user_permissions")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profile || !permissions) return null;

  return {
    profile: profile as Profile,
    permissions: permissions as UserPermissions,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

export function canViewScreen(
  session: SessionUser,
  screen:
    | "dashboard"
    | "clientes"
    | "documentos"
    | "progresso"
    | "admin",
): boolean {
  if (session.profile.is_admin) return true;
  const map = {
    dashboard: session.permissions.can_view_dashboard,
    clientes: session.permissions.can_view_clientes,
    documentos: session.permissions.can_view_documentos,
    progresso: session.permissions.can_view_progresso,
    admin: session.permissions.can_view_admin,
  } as const;
  return map[screen];
}

export function canCreateDemand(session: SessionUser): boolean {
  return session.profile.is_admin || session.permissions.can_create_demand;
}

export function firstAllowedPath(session: SessionUser): string {
  if (canViewScreen(session, "dashboard")) return "/dashboard";
  if (canViewScreen(session, "clientes")) return "/clientes";
  if (canViewScreen(session, "documentos")) return "/documentos";
  if (canViewScreen(session, "progresso")) return "/progresso";
  if (canViewScreen(session, "admin")) return "/admin/usuarios";
  return "/perfil";
}
