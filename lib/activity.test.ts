import { describe, expect, it } from "vitest";
import { formatActivityAction } from "@/lib/activity";
import type { ActivityLog } from "@/lib/types";

function log(
  action: string,
  meta: Record<string, unknown> = {},
): ActivityLog {
  return {
    id: "1",
    client_id: "c1",
    user_id: "u1",
    action,
    meta,
    created_at: new Date().toISOString(),
  };
}

describe("formatActivityAction", () => {
  it("formats task create/update/delete in Portuguese", () => {
    expect(formatActivityAction(log("task_created", { title: "X" }), "Ana").headline).toBe(
      'Ana criou a tarefa “X”',
    );
    expect(
      formatActivityAction(
        log("task_updated", {
          title: "X",
          changes: { points: { from: 1, to: 3 } },
        }),
        "Ana",
      ).detail,
    ).toContain("pontos: 1 → 3");
    expect(formatActivityAction(log("task_deleted", { title: "X" }), "Ana").headline).toBe(
      'Ana excluiu a tarefa “X”',
    );
  });

  it("formats client created", () => {
    expect(
      formatActivityAction(log("client_created", { name: "Acme" }), "Bob").headline,
    ).toBe('Bob criou o cliente “Acme”');
  });
});
