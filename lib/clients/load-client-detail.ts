import { createClient } from "@/lib/supabase/server";
import type {
  ActivityLog,
  Attachment,
  Client,
  Comment,
  Profile,
  Sprint,
  Task,
} from "@/lib/types";

export type ClientDetailData = {
  client: Client;
  sprints: Sprint[];
  tasks: Task[];
  comments: Comment[];
  activity: ActivityLog[];
  attachments: Attachment[];
  profiles: Profile[];
};

export async function loadClientDetail(
  id: string,
): Promise<ClientDetailData | null> {
  const supabase = await createClient();

  const [
    { data: client },
    { data: sprints },
    { data: tasks },
    { data: comments },
    { data: activity },
    { data: attachments },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("sprints").select("*").eq("client_id", id).order("position"),
    supabase.from("tasks").select("*").eq("client_id", id).order("position"),
    supabase
      .from("comments")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("attachments")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*"),
  ]);

  if (!client) return null;

  return {
    client: client as Client,
    sprints: (sprints as Sprint[]) || [],
    tasks: (tasks as Task[]) || [],
    comments: (comments as Comment[]) || [],
    activity: (activity as ActivityLog[]) || [],
    attachments: (attachments as Attachment[]) || [],
    profiles: (profiles as Profile[]) || [],
  };
}
