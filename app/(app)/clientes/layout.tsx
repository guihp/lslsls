import { ClientesBoard } from "@/components/clients/clientes-board";
import { canCreateDemand, canViewScreen, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Client, Profile, Task } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function ClientesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  if (!canViewScreen(session, "clientes")) redirect("/perfil");

  const supabase = await createClient();
  const [{ data: clients }, { data: tasks }, { data: profiles }] =
    await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("tasks").select("*"),
      supabase.from("profiles").select("id, full_name, avatar_url, job_title"),
    ]);

  return (
    <>
      <ClientesBoard
        clients={(clients as Client[]) || []}
        tasks={(tasks as Task[]) || []}
        profiles={
          (profiles as Pick<
            Profile,
            "id" | "full_name" | "avatar_url" | "job_title"
          >[]) || []
        }
        canCreate={canCreateDemand(session)}
      />
      {children}
    </>
  );
}
