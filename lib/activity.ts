import type { ActivityLog } from "@/lib/types";

function metaStr(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  if (v == null || v === "") return null;
  return String(v);
}

function formatChanges(meta: Record<string, unknown>): string | null {
  const changes = meta.changes;
  if (!changes || typeof changes !== "object") return null;
  const parts: string[] = [];
  for (const [field, delta] of Object.entries(
    changes as Record<string, { from?: unknown; to?: unknown }>,
  )) {
    const labels: Record<string, string> = {
      title: "título",
      status: "status",
      points: "pontos",
      due_date: "prazo",
      assignee_id: "responsável",
      sprint_id: "sprint",
    };
    const label = labels[field] || field;
    const from = delta?.from == null || delta.from === "" ? "—" : String(delta.from);
    const to = delta?.to == null || delta.to === "" ? "—" : String(delta.to);
    parts.push(`${label}: ${from} → ${to}`);
  }
  return parts.length ? parts.join("; ") : null;
}

/** Human-readable Portuguese summary for activity feed. */
export function formatActivityAction(
  log: ActivityLog,
  actorName: string,
): { headline: string; detail: string | null } {
  const meta = log.meta || {};
  const title = metaStr(meta, "title");
  const name = metaStr(meta, "name");
  const who = actorName || "Sistema";

  switch (log.action) {
    case "task_created":
      return {
        headline: `${who} criou a tarefa${title ? ` “${title}”` : ""}`,
        detail: null,
      };
    case "task_updated":
      return {
        headline: `${who} atualizou a tarefa${title ? ` “${title}”` : ""}`,
        detail: formatChanges(meta),
      };
    case "task_deleted":
      return {
        headline: `${who} excluiu a tarefa${title ? ` “${title}”` : ""}`,
        detail: null,
      };
    case "task_completed":
      return {
        headline: `${who} concluiu a tarefa${title ? ` “${title}”` : ""}`,
        detail: null,
      };
    case "task_started":
      return {
        headline: `${who} iniciou a tarefa${title ? ` “${title}”` : ""}`,
        detail: null,
      };
    case "task_reopened":
      return {
        headline: `${who} reabriu a tarefa${title ? ` “${title}”` : ""}`,
        detail: null,
      };
    case "client_created":
      return {
        headline: `${who} criou o cliente${name ? ` “${name}”` : ""}`,
        detail: null,
      };
    case "client_updated":
      return {
        headline: `${who} atualizou o cliente`,
        detail: Object.keys(meta).length
          ? Object.entries(meta)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join("; ")
          : null,
      };
    case "sprint_created":
      return {
        headline: `${who} criou a sprint${name ? ` “${name}”` : ""}`,
        detail: null,
      };
    case "attachment_uploaded":
      return {
        headline: `${who} enviou um anexo${
          metaStr(meta, "file_name") ? ` (${metaStr(meta, "file_name")})` : ""
        }`,
        detail: null,
      };
    default:
      return {
        headline: `${who} · ${log.action}`,
        detail: Object.keys(meta).length ? JSON.stringify(meta) : null,
      };
  }
}
