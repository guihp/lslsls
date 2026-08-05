import { DocumentsView } from "@/components/documents/documents-view";
import { canCreateDemand, canViewScreen, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Document } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireUser();
  if (!canViewScreen(session, "documentos")) redirect("/perfil");

  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: documents } = await query;

  return (
    <DocumentsView
      documents={(documents as Document[]) || []}
      canCreate={canCreateDemand(session) || session.profile.is_admin}
      query={q || ""}
    />
  );
}
