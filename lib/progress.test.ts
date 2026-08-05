import { describe, expect, it } from "vitest";
import {
  calcProgress,
  dailyProgress,
  progressStatusLabel,
  progressTone,
  weeklyProgress,
} from "@/lib/progress";
import type { Task } from "@/lib/types";
import { canCreateDemand, canViewScreen } from "@/lib/permissions-client";
import type { SessionUser } from "@/lib/types";

function task(partial: Partial<Task>): Task {
  return {
    id: "1",
    client_id: "c1",
    sprint_id: null,
    title: "t",
    assignee_id: "u1",
    points: 1,
    due_date: "2026-08-05",
    status: "todo",
    position: 0,
    completed_at: null,
    created_by: null,
    created_at: "2026-08-05T00:00:00Z",
    updated_at: "2026-08-05T00:00:00Z",
    ...partial,
  };
}

describe("progress", () => {
  it("calculates daily completion percent", () => {
    const tasks = [
      task({ id: "1", points: 2, status: "done", due_date: "2026-08-05" }),
      task({ id: "2", points: 3, status: "todo", due_date: "2026-08-05" }),
    ];
    const snap = calcProgress(
      tasks,
      new Date("2026-08-05T00:00:00"),
      new Date("2026-08-05T23:59:59"),
    );
    expect(snap.expected).toBe(5);
    expect(snap.completed).toBe(2);
    expect(snap.percent).toBe(40);
  });

  it("returns zero when no tasks in range", () => {
    const snap = dailyProgress([], new Date("2026-08-05"));
    expect(snap.percent).toBe(0);
    expect(snap.expected).toBe(0);
  });

  it("aggregates weekly points", () => {
    const tasks = [
      task({ due_date: "2026-08-03", points: 4, status: "done" }),
      task({ due_date: "2026-08-07", points: 6, status: "todo" }),
      task({ due_date: "2026-07-01", points: 10, status: "done" }),
    ];
    const snap = weeklyProgress(tasks, new Date("2026-08-05"));
    expect(snap.expected).toBe(10);
    expect(snap.completed).toBe(4);
  });

  it("does not count doing as completed", () => {
    const tasks = [
      task({ id: "1", points: 2, status: "done", due_date: "2026-08-05" }),
      task({ id: "2", points: 3, status: "doing", due_date: "2026-08-05" }),
      task({ id: "3", points: 5, status: "todo", due_date: "2026-08-05" }),
    ];
    const snap = calcProgress(
      tasks,
      new Date("2026-08-05T00:00:00"),
      new Date("2026-08-05T23:59:59"),
    );
    expect(snap.expected).toBe(10);
    expect(snap.completed).toBe(2);
    expect(snap.percent).toBe(20);
  });

  it("maps tones and labels", () => {
    expect(progressTone(100)).toBe("green");
    expect(progressTone(80)).toBe("orange");
    expect(progressTone(20)).toBe("red");
    expect(progressStatusLabel(100)).toBe("No ritmo!");
  });
});

describe("permissions", () => {
  const base: SessionUser = {
    profile: {
      id: "u1",
      email: "a@b.com",
      full_name: "A",
      avatar_url: null,
      job_title: "Dev",
      is_admin: false,
      created_at: "",
      updated_at: "",
    },
    permissions: {
      user_id: "u1",
      can_view_dashboard: true,
      can_view_clientes: false,
      can_view_documentos: false,
      can_view_progresso: true,
      can_view_admin: false,
      can_create_demand: false,
      updated_at: "",
    },
  };

  it("respects per-user screen flags", () => {
    expect(canViewScreen(base, "dashboard")).toBe(true);
    expect(canViewScreen(base, "clientes")).toBe(false);
    expect(canCreateDemand(base)).toBe(false);
  });

  it("grants everything to admin", () => {
    const admin = {
      ...base,
      profile: { ...base.profile, is_admin: true },
    };
    expect(canViewScreen(admin, "admin")).toBe(true);
    expect(canCreateDemand(admin)).toBe(true);
  });
});
