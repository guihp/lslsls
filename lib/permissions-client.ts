import type { SessionUser } from "@/lib/types";

export function canViewScreen(
  session: SessionUser,
  screen: "dashboard" | "clientes" | "documentos" | "progresso" | "admin",
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
