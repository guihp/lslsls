import { format, parseISO } from "date-fns";
import { weekBounds } from "@/lib/progress";
import type { SupabaseClient } from "@supabase/supabase-js";

export type WeekSprintBounds = {
  start: string;
  end: string;
};

/** ISO dates (yyyy-MM-dd) for Mon–Sat of the work week containing `date`. */
export function weekSprintBoundsISO(date = new Date()): WeekSprintBounds {
  const { start, end } = weekBounds(date);
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

/** Display name e.g. "Semana 03/08 – 08/08". */
export function weekSprintName(date = new Date()) {
  const { start, end } = weekBounds(date);
  return `Semana ${format(start, "dd/MM")} – ${format(end, "dd/MM")}`;
}

function refDateFromDue(dueDate: string | null | undefined, fallback = new Date()) {
  if (!dueDate) return fallback;
  try {
    return parseISO(dueDate);
  } catch {
    return fallback;
  }
}

/**
 * Find or create a sprint for `clientId` covering the Mon–Sat week of `dueDate`
 * (or today when dueDate is empty). Uses unique (client_id, start_date, end_date).
 */
export async function ensureWeekSprint(
  supabase: SupabaseClient,
  clientId: string,
  dueDate?: string | null,
): Promise<{ id: string } | { error: string }> {
  const ref = refDateFromDue(dueDate);
  const { start, end } = weekSprintBoundsISO(ref);
  const name = weekSprintName(ref);

  const { data: existing, error: findError } = await supabase
    .from("sprints")
    .select("id")
    .eq("client_id", clientId)
    .eq("start_date", start)
    .eq("end_date", end)
    .maybeSingle();

  if (findError) return { error: findError.message };
  if (existing?.id) return { id: existing.id };

  const { count } = await supabase
    .from("sprints")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  const { data, error } = await supabase
    .from("sprints")
    .insert({
      client_id: clientId,
      name,
      start_date: start,
      end_date: end,
      position: count || 0,
    })
    .select("id")
    .single();

  if (!error && data?.id) return { id: data.id };

  // Concurrent create: unique index race — re-fetch
  if (error?.code === "23505") {
    const { data: raced, error: raceError } = await supabase
      .from("sprints")
      .select("id")
      .eq("client_id", clientId)
      .eq("start_date", start)
      .eq("end_date", end)
      .maybeSingle();
    if (raceError) return { error: raceError.message };
    if (raced?.id) return { id: raced.id };
  }

  return { error: error?.message || "Falha ao criar sprint da semana" };
}
