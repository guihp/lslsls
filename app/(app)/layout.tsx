import { AppSidebar } from "@/components/app-sidebar";
import { NavigationProgress } from "@/components/navigation-progress";
import { requireUser } from "@/lib/auth";
import { Suspense } from "react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-black">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <AppSidebar session={session} />
      <main className="min-h-screen pb-20 md:pb-0 md:pl-16">{children}</main>
    </div>
  );
}
