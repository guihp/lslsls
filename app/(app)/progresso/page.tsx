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
  // Personal progress only — even admins measure their own assignments here.
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("assignee_id", session.profile.id);

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
