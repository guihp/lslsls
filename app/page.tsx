import { redirect } from "next/navigation";
import { firstAllowedPath, getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  redirect(firstAllowedPath(session));
}
