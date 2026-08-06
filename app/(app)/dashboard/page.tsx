import { DashboardView } from "@/components/dashboard/dashboard-view";
import { canCreateDemand, canViewScreen, requireUser } from "@/lib/auth";
import {
  formatWeekRange,
  weeklyProgress,
  workdayIndex,
} from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import type { Client, Profile, Sprint, Task } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await requireUser();
  if (!canViewScreen(session, "dashboard")) redirect("/perfil");

  const supabase = await createClient();
  const userId = session.profile.id;
  const isAdmin = session.profile.is_admin;

  const [{ data: tasks }, { data: clients }, { data: profiles }, { data: sprints }] =
    await Promise.all([
      isAdmin
        ? supabase.from("tasks").select("*").order("position")
        : supabase
            .from("tasks")
            .select("*")
            .eq("assignee_id", userId)
            .order("position"),
      supabase.from("clients").select("*").order("name"),
      supabase.from("profiles").select("id, full_name, avatar_url, job_title"),
      supabase.from("sprints").select("*").order("position"),
    ]);

  const allTasks = (tasks as Task[]) || [];
  // Gauge "Sua meta" always uses only the current user's assignments —
  // admins still see the team list, but expected must not include others.
  const myTasks = allTasks.filter((t) => t.assignee_id === userId);
  const visibleTasks = isAdmin ? allTasks : myTasks;
  const allClients = (clients as Client[]) || [];
  const clientIds = new Set(visibleTasks.map((t) => t.client_id));
  // Dashboard lista só clientes que já têm demanda — criar cliente ≠ task
  const relevantClients = allClients.filter((c) => clientIds.has(c.id));

  const week = weeklyProgress(myTasks);
  const workday = workdayIndex();

  return (
    <DashboardView
      clients={relevantClients}
      allClients={allClients}
      tasks={visibleTasks}
      sprints={(sprints as Sprint[]) || []}
      profiles={
        (profiles as Pick<
          Profile,
          "id" | "full_name" | "avatar_url" | "job_title"
        >[]) || []
      }
      canCreate={canCreateDemand(session)}
      isAdmin={isAdmin}
      weekLabel={formatWeekRange()}
      dayLabel={`Dia ${workday.current}/${workday.total}`}
      weekly={week}
      currentUserId={userId}
    />
  );
}
