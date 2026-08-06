export type ClientStatus =
  | "oportunidade"
  | "kickoff"
  | "aguardando_informacoes"
  | "execucao"
  | "testes"
  | "melhorias"
  | "finalizado"
  | "cancelado";

export type TaskStatus = "todo" | "doing" | "done";
export type DocumentVisibility = "todos" | "admin";

/** Cycle: todo → doing → done → todo */
export function nextTaskStatus(status: TaskStatus): TaskStatus {
  if (status === "todo") return "doing";
  if (status === "doing") return "done";
  return "todo";
}

/** UI order for the status chooser menu */
export const TASK_STATUS_OPTIONS: TaskStatus[] = ["todo", "doing", "done"];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Não iniciada",
  doing: "A fazer",
  done: "Concluída",
};

export type ScreenKey =
  | "dashboard"
  | "clientes"
  | "documentos"
  | "progresso"
  | "admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type UserPermissions = {
  user_id: string;
  can_view_dashboard: boolean;
  can_view_clientes: boolean;
  can_view_documentos: boolean;
  can_view_progresso: boolean;
  can_view_admin: boolean;
  can_create_demand: boolean;
  updated_at: string;
};

export type Client = {
  id: string;
  name: string;
  status: ClientStatus;
  responsible_id: string | null;
  deadline: string | null;
  description: string | null;
  dev_stage: number;
  week_priority: number;
  focal_point: string | null;
  focal_phone: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Sprint = {
  id: string;
  client_id: string;
  name: string;
  /** Work-week Monday (yyyy-MM-dd), when this is a week sprint */
  start_date: string | null;
  /** Work-week Saturday (yyyy-MM-dd), when this is a week sprint */
  end_date: string | null;
  position: number;
  created_at: string;
};

export type Task = {
  id: string;
  client_id: string;
  sprint_id: string | null;
  title: string;
  assignee_id: string | null;
  points: number;
  due_date: string | null;
  status: TaskStatus;
  position: number;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  client_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  client_id: string | null;
  user_id: string | null;
  action: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export type Document = {
  id: string;
  title: string;
  icon: string;
  category: string;
  visibility: DocumentVisibility;
  url: string | null;
  file_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Attachment = {
  id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type SessionUser = {
  profile: Profile;
  permissions: UserPermissions;
};

export const CLIENT_STATUS_META: Record<
  ClientStatus,
  { label: string; color: string; icon: string }
> = {
  oportunidade: { label: "Oportunidade", color: "#ec4899", icon: "rocket" },
  kickoff: { label: "Kickoff", color: "#a3a3a3", icon: "megaphone" },
  aguardando_informacoes: {
    label: "Aguardando Informações",
    color: "#14b8a6",
    icon: "folder",
  },
  execucao: { label: "Execução", color: "#3b82f6", icon: "wrench" },
  testes: { label: "Testes", color: "#eab308", icon: "flask" },
  melhorias: { label: "Melhorias", color: "#f97316", icon: "settings" },
  finalizado: { label: "Finalizado", color: "#22c55e", icon: "check" },
  cancelado: { label: "Cancelado", color: "#ef4444", icon: "x" },
};

/**
 * Pipeline columns / create & filter options for /clientes.
 * kickoff and execucao remain valid DB enum values but are hidden from the board.
 */
export const CLIENT_STATUS_ORDER: ClientStatus[] = [
  "oportunidade",
  "aguardando_informacoes",
  "testes",
  "melhorias",
  "finalizado",
  "cancelado",
];

/**
 * Map removed pipeline statuses into a visible board column so clients
 * are not orphaned when kickoff/execucao columns are hidden.
 * kickoff → oportunidade (early stage)
 * execucao → testes (active delivery → nearest active column)
 */
export function boardClientStatus(status: ClientStatus): ClientStatus {
  if (status === "kickoff") return "oportunidade";
  if (status === "execucao") return "testes";
  return status;
}

/** Select options: board order, plus current value if it is a legacy status. */
export function clientStatusSelectOptions(
  current: ClientStatus,
): ClientStatus[] {
  if ((CLIENT_STATUS_ORDER as ClientStatus[]).includes(current)) {
    return CLIENT_STATUS_ORDER;
  }
  return [current, ...CLIENT_STATUS_ORDER];
}
