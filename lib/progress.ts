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

function inRange(dueDate: string | null, start: Date, end: Date) {
  if (!dueDate) return false;
  const d = parseISO(dueDate);
  return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) });
}

export function calcProgress(
  tasks: Pick<Task, "points" | "due_date" | "status" | "completed_at">[],
  start: Date,
  end: Date,
): ProgressSnapshot {
  const relevant = tasks.filter((t) => inRange(t.due_date, start, end));
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

export function dailyProgress(tasks: Task[], date = new Date()) {
  return calcProgress(tasks, startOfDay(date), endOfDay(date));
}

export function weeklyProgress(tasks: Task[], date = new Date()) {
  const { start, end } = weekBounds(date);
  return calcProgress(tasks, start, end);
}

export function lastWeeksProgress(tasks: Task[], weeks = 4, date = new Date()) {
  const results = [];
  for (let i = 0; i < weeks; i++) {
    const ref = subWeeks(date, i);
    const { start, end } = weekBounds(ref);
    const snap = calcProgress(tasks, start, end);
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
