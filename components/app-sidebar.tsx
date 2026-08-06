"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesColumn,
  FileText,
  Gauge,
  ListTodo,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { canViewScreen } from "@/lib/permissions-client";

const NAV = [
  { href: "/clientes", key: "clientes" as const, icon: ListTodo, label: "Clientes" },
  { href: "/dashboard", key: "dashboard" as const, icon: Gauge, label: "Dashboard" },
  { href: "/documentos", key: "documentos" as const, icon: FileText, label: "Docs" },
  { href: "/progresso", key: "progresso" as const, icon: ChartNoAxesColumn, label: "Progresso" },
  { href: "/admin/usuarios", key: "admin" as const, icon: Shield, label: "Admin" },
];

function NavLinks({
  session,
  pathname,
  compact,
}: {
  session: SessionUser;
  pathname: string;
  compact?: boolean;
}) {
  return (
    <>
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
              compact
                ? "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium"
                : "flex h-10 w-10 items-center justify-center rounded-xl transition",
              active
                ? compact
                  ? "text-orange-600"
                  : "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                : compact
                  ? "text-zinc-400"
                  : "text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400",
            )}
          >
            <Icon className={cn(compact ? "h-5 w-5" : "h-5 w-5")} />
            {compact ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
      })}
    </>
  );
}

function SignOutButton({ compact }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        title="Sair"
        aria-label="Sair"
        className={cn(
          compact
            ? "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium text-zinc-400 hover:text-orange-600"
            : "flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400",
        )}
      >
        <LogOut className="h-5 w-5" />
        {compact ? <span className="truncate">Sair</span> : null}
      </button>
    </form>
  );
}

export function AppSidebar({ session }: { session: SessionUser }) {
  const pathname = usePathname();
  const avatar = session.profile.avatar_url;

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center border-r border-orange-100 bg-white py-4 md:flex dark:border-orange-500/15 dark:bg-zinc-950">
        <Link
          href="/dashboard"
          className="mb-6 flex h-11 w-11 items-center justify-center bg-transparent transition hover:scale-105"
          title="IAFÉ Daily"
        >
          <BrandLogo size={44} className="bg-transparent" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-2">
          <NavLinks session={session} pathname={pathname} />
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          <SignOutButton />
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

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-orange-100 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden dark:border-orange-500/15 dark:bg-zinc-950/95">
        <Link href="/dashboard" className="flex items-center gap-2 bg-transparent">
          <BrandLogo size={32} className="bg-transparent" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            IAFÉ Daily
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <SignOutButton />
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
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-orange-100 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur md:hidden dark:border-orange-500/15 dark:bg-zinc-950/95">
        <NavLinks session={session} pathname={pathname} compact />
        <SignOutButton compact />
      </nav>
    </>
  );
}
