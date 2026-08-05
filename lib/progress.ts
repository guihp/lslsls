import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Task } from "@/lib/types";

export type ProgressSnapshot = {
  expected: number;
  completed: number;
  percent: number;
  label: string;
};

export type ProgressTask = Pick<
  Task,
  "points" | "due_date" | "status" | "completed_at"
>;

export function weekBounds(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

export function formatWeekRange(date = new Date()) {
  const { start, end } = weekBounds(date);
  return `${format(start, "dd", { locale: ptBR })} - ${format(end, "dd MMM", { locale: ptBR })}`;
}

export function workdayIndex(date = new Date()) {
  const day = date.getDay();
  // Mon=1 ... Fri=5
  if (day === 0 || day === 6) return { current: 5, total: 5 };
  return { current: day, total: 5 };
}

function inRange(dueDate: string, start: Date, end: Date) {
  const d = parseISO(dueDate);
  return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) });
}

/**
 * Weekly / period progress from task points.
 * - expected: sum of points for tasks in range
 * - completed: sum of points with status === "done" only (`doing` does not count)
 * - includeUndated: tasks without due_date (dashboard weekly backlog)
 */
export function calcProgress(
  tasks: ProgressTask[],
  start: Date,
  end: Date,
  options?: { includeUndated?: boolean },
): ProgressSnapshot {
  const includeUndated = options?.includeUndated ?? false;

  const relevant = tasks.filter((t) => {
    if (!t.due_date) return includeUndated;
    return inRange(t.due_date, start, end);
  });

  const expected = relevant.reduce((sum, t) => sum + (t.points || 0), 0);
  const completed = relevant
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.points || 0), 0);
  const percent = expected === 0 ? 0 : Math.round((completed / expected) * 100);
  return {
    expected,
    completed,
    percent,
    label: expected === 0 ? "Sem meta" : `${completed} / ${expected}`,
  };
}

export function dailyProgress(tasks: ProgressTask[], date = new Date()) {
  return calcProgress(tasks, startOfDay(date), endOfDay(date), {
    includeUndated: false,
  });
}

/** Current-week set: due this week + undated tasks shown on the weekly dashboard. */
export function weeklyProgress(tasks: ProgressTask[], date = new Date()) {
  const { start, end } = weekBounds(date);
  return calcProgress(tasks, start, end, { includeUndated: true });
}

export function lastWeeksProgress(
  tasks: ProgressTask[],
  weeks = 4,
  date = new Date(),
) {
  const results = [];
  for (let i = 0; i < weeks; i++) {
    const ref = subWeeks(date, i);
    const { start, end } = weekBounds(ref);
    // Undated backlog only belongs to the current week (i === 0).
    const snap = calcProgress(tasks, start, end, {
      includeUndated: i === 0,
    });
    results.push({
      start,
      end,
      ...snap,
      label: `${format(start, "dd", { locale: ptBR })} - ${format(end, "dd MMM", { locale: ptBR })}`,
    });
  }
  return results;
}

export function progressTone(percent: number) {
  if (percent >= 100) return "green";
  if (percent >= 70) return "orange";
  if (percent > 0) return "red";
  return "gray";
}

export function progressStatusLabel(percent: number) {
  if (percent >= 100) return "No ritmo!";
  if (percent >= 70) return "Quase lá";
  if (percent > 0) return "Atrasado";
  return "Sem meta";
}

export function isOverdue(
  dueDate: string | null,
  status: string,
  today = new Date(),
) {
  if (!dueDate || status === "done" || status === "finalizado") return false;
  return parseISO(dueDate) < startOfDay(today);
}

export function nextDays(n: number, from = new Date()) {
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}
