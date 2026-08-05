import { AppSidebar } from "@/components/app-sidebar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-black">
      <AppSidebar session={session} />
      <main className="min-h-screen pb-20 md:pb-0 md:pl-16">{children}</main>
    </div>
  );
}
