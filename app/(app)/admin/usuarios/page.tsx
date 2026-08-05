import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { canViewScreen, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserPermissions } from "@/lib/types";
import { Shield } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await requireUser();
  if (!canViewScreen(session, "admin")) redirect("/perfil");

  const supabase = await createClient();
  const [{ data: profiles }, { data: permissions }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("user_permissions").select("*"),
  ]);

  const permMap = new Map(
    (permissions as UserPermissions[] | null)?.map((p) => [p.user_id, p]) || [],
  );

  const users = ((profiles as Profile[] | null) || []).map((p) => ({
    profile: p,
    permissions: permMap.get(p.id)!,
  })).filter((u) => u.permissions);

  return (
    <div className="px-6 py-8">
      <div className="mb-8 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <div>
          <h1 className="text-xl font-semibold">Usuários e permissões</h1>
          <p className="text-sm text-zinc-500">
            Defina telas e se cada profissional pode criar demanda
          </p>
        </div>
      </div>
      <AdminUsersPanel users={users} currentUserId={session.profile.id} />
    </div>
  );
}
