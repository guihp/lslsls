import { ProgressView } from "@/components/progress/progress-view";
import { canViewScreen, requireUser } from "@/lib/auth";
import {
  formatWeekRange,
  lastWeeksProgress,
  weeklyProgress,
  workdayIndex,
} from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function ProgressoPage() {
  const session = await requireUser();
  if (!canViewScreen(session, "progresso")) redirect("/perfil");

  const supabase = await createClient();
  const query = session.profile.is_admin
    ? supabase.from("tasks").select("*")
    : supabase.from("tasks").select("*").eq("assignee_id", session.profile.id);

  const { data: tasks } = await query;
  const list = (tasks as Task[]) || [];
  const weekly = weeklyProgress(list);
  const history = lastWeeksProgress(list, 4);
  const workday = workdayIndex();

  return (
    <ProgressView
      weekLabel={formatWeekRange()}
      dayLabel={`Dia ${workday.current}/${workday.total}`}
      weekly={weekly}
      history={history}
    />
  );
}
