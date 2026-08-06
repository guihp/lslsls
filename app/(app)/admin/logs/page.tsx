import { AdminLogsView } from "@/components/admin/admin-logs-view";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActivityLog, Client, Profile } from "@/lib/types";
import { ScrollText } from "lucide-react";
import { redirect } from "next/navigation";

const PAGE_SIZE = 50;

function sanitizeFilterToken(value: string) {
  return value.replace(/[%_,.()"'\\]/g, " ").replace(/\s+/g, " ").trim();
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    client?: string;
    user?: string;
    q?: string;
  }>;
}) {
  const session = await requireUser();
  if (!session.profile.is_admin) redirect("/perfil");

  const {
    page: pageRaw,
    client: clientRaw,
    user: userRaw,
    q: qRaw,
  } = await searchParams;

  const page = Math.max(1, Number.parseInt(pageRaw || "1", 10) || 1);
  const clientId = clientRaw?.trim() || "";
  const userId = userRaw?.trim() || "";
  const q = sanitizeFilterToken(qRaw || "");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const [{ data: allClients }, { data: allProfiles }] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  const filterClients =
    (allClients as Pick<Client, "id" | "name">[] | null) || [];
  const filterUsers =
    (allProfiles as Pick<Profile, "id" | "full_name">[] | null) || [];

  let matchingClientIds: string[] = [];
  let matchingUserIds: string[] = [];
  if (q) {
    const qPattern = `%${q}%`;
    const [{ data: nameClients }, { data: nameUsers }] = await Promise.all([
      supabase.from("clients").select("id").ilike("name", qPattern),
      supabase.from("profiles").select("id").ilike("full_name", qPattern),
    ]);
    matchingClientIds = (nameClients || []).map((c) => c.id as string);
    matchingUserIds = (nameUsers || []).map((u) => u.id as string);
  }

  let logsQuery = supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (clientId) logsQuery = logsQuery.eq("client_id", clientId);
  if (userId) logsQuery = logsQuery.eq("user_id", userId);

  if (q) {
    const parts = [`action.ilike.%${q}%`];
    if (matchingClientIds.length) {
      parts.push(`client_id.in.(${matchingClientIds.join(",")})`);
    }
    if (matchingUserIds.length) {
      parts.push(`user_id.in.(${matchingUserIds.join(",")})`);
    }
    logsQuery = logsQuery.or(parts.join(","));
  }

  const { data: logs, count } = await logsQuery.range(from, to);

  const list = (logs as ActivityLog[] | null) || [];
  const userIds = [
    ...new Set(list.map((l) => l.user_id).filter((id): id is string => Boolean(id))),
  ];
  const clientIds = [
    ...new Set(
      list.map((l) => l.client_id).filter((id): id is string => Boolean(id)),
    ),
  ];

  const profileMap = new Map(filterUsers.map((p) => [p.id, p.full_name]));
  const clientMap = new Map(filterClients.map((c) => [c.id, c.name]));

  // Ensure names for any IDs not in the full lists (edge case)
  const missingUserIds = userIds.filter((id) => !profileMap.has(id));
  const missingClientIds = clientIds.filter((id) => !clientMap.has(id));
  if (missingUserIds.length || missingClientIds.length) {
    const [{ data: profiles }, { data: clients }] = await Promise.all([
      missingUserIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", missingUserIds)
        : Promise.resolve({ data: [] as Pick<Profile, "id" | "full_name">[] }),
      missingClientIds.length
        ? supabase.from("clients").select("id, name").in("id", missingClientIds)
        : Promise.resolve({ data: [] as Pick<Client, "id" | "name">[] }),
    ]);
    for (const p of (profiles as Pick<Profile, "id" | "full_name">[] | null) || []) {
      profileMap.set(p.id, p.full_name);
    }
    for (const c of (clients as Pick<Client, "id" | "name">[] | null) || []) {
      clientMap.set(c.id, c.name);
    }
  }

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
  const filters = { client: clientId, user: userId, q };
  const hasFilters = Boolean(clientId || userId || q);

  return (
    <div className="overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-orange-600" />
        <div>
          <h1 className="text-xl font-semibold">Logs do sistema</h1>
          <p className="text-sm text-zinc-500">
            Toda a atividade registrada · {total} evento
            {total === 1 ? "" : "s"}
            {hasFilters ? " (filtrado)" : ""}
          </p>
        </div>
      </div>
      <AdminLogsView
        rows={rows}
        page={page}
        totalPages={totalPages}
        filters={filters}
        clients={filterClients}
        users={filterUsers}
        hasFilters={hasFilters}
      />
    </div>
  );
}
