import { AdminLogsView } from "@/components/admin/admin-logs-view";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActivityLog, Client, Profile } from "@/lib/types";
import { ScrollText } from "lucide-react";
import { redirect } from "next/navigation";

const PAGE_SIZE = 50;

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireUser();
  if (!session.profile.is_admin) redirect("/perfil");

  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageRaw || "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: logs, count } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const list = (logs as ActivityLog[] | null) || [];
  const userIds = [
    ...new Set(list.map((l) => l.user_id).filter((id): id is string => Boolean(id))),
  ];
  const clientIds = [
    ...new Set(
      list.map((l) => l.client_id).filter((id): id is string => Boolean(id)),
    ),
  ];

  const [{ data: profiles }, { data: clients }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] as Pick<Profile, "id" | "full_name">[] }),
    clientIds.length
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] as Pick<Client, "id" | "name">[] }),
  ]);

  const profileMap = new Map(
    ((profiles as Pick<Profile, "id" | "full_name">[] | null) || []).map((p) => [
      p.id,
      p.full_name,
    ]),
  );
  const clientMap = new Map(
    ((clients as Pick<Client, "id" | "name">[] | null) || []).map((c) => [
      c.id,
      c.name,
    ]),
  );

  const rows = list.map((log) => ({
    log,
    actorName: log.user_id
      ? profileMap.get(log.user_id) || "Usuário"
      : "Sistema",
    clientName: log.client_id ? clientMap.get(log.client_id) || null : null,
    clientId: log.client_id,
  }));

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-orange-600" />
        <div>
          <h1 className="text-xl font-semibold">Logs do sistema</h1>
          <p className="text-sm text-zinc-500">
            Toda a atividade registrada · {total} evento{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <AdminLogsView rows={rows} page={page} totalPages={totalPages} />
    </div>
  );
}
