import { ClientDetailView } from "@/components/clients/client-detail-view";
import { ClientDrawer } from "@/components/clients/client-drawer";
import { canCreateDemand, canViewScreen, requireUser } from "@/lib/auth";
import { loadClientDetail } from "@/lib/clients/load-client-detail";
import { notFound, redirect } from "next/navigation";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  if (
    !canViewScreen(session, "clientes") &&
    !canViewScreen(session, "dashboard")
  ) {
    redirect("/perfil");
  }

  const { id } = await params;
  const data = await loadClientDetail(id);
  if (!data) notFound();

  const canCreate = canCreateDemand(session);
  const canManageTasks =
    canCreate ||
    data.tasks.some((t) => t.assignee_id === session.profile.id);

  return (
    <ClientDrawer closeHref="/clientes">
      <ClientDetailView
        client={data.client}
        sprints={data.sprints}
        tasks={data.tasks}
        comments={data.comments}
        activity={data.activity}
        attachments={data.attachments}
        profiles={data.profiles}
        canCreate={canCreate}
        canManageTasks={canManageTasks}
        currentUserId={session.profile.id}
        compact
      />
    </ClientDrawer>
  );
}
