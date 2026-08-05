"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesColumn,
  FileText,
  Gauge,
  ListTodo,
  Shield,
  User,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { canViewScreen } from "@/lib/permissions-client";

const NAV = [
  { href: "/clientes", key: "clientes" as const, icon: ListTodo, label: "Clientes" },
  { href: "/dashboard", key: "dashboard" as const, icon: Gauge, label: "Dashboard" },
  { href: "/documentos", key: "documentos" as const, icon: FileText, label: "Documentos" },
  { href: "/progresso", key: "progresso" as const, icon: ChartNoAxesColumn, label: "Progresso" },
  { href: "/admin/usuarios", key: "admin" as const, icon: Shield, label: "Admin" },
];

export function AppSidebar({ session }: { session: SessionUser }) {
  const pathname = usePathname();
  const avatar = session.profile.avatar_url;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col items-center border-r border-orange-100 bg-white py-4 dark:border-orange-500/15 dark:bg-zinc-950">
      <Link
        href="/dashboard"
        className="mb-6 flex h-11 w-11 items-center justify-center transition hover:scale-105"
        title="IAFE"
      >
        <BrandLogo size={44} />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV.filter((item) => canViewScreen(session, item.key)).map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition",
                active
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                  : "text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400",
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        <ThemeToggle />
        <Link
          href="/perfil"
          title="Meu Perfil"
          className={cn(
            "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700",
            pathname.startsWith("/perfil") && "ring-2 ring-orange-500",
          )}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-zinc-400" />
          )}
        </Link>
      </div>
    </aside>
  );
}
