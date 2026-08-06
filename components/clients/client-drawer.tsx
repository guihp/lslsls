"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Full-viewport client drawer.
 *
 * MUST portal to document.body. App Router `template.tsx` wraps pages in
 * `.route-enter`, whose animation uses `transform` + `animation-fill-mode: both`.
 * That creates a containing block for `position: fixed`, so an in-tree drawer
 * only covers the short content box (~657px) with a white gap below.
 *
 * Never render the overlay in-tree (SSR / pre-mount) — return null until the
 * client portal target exists.
 */
export function ClientDrawer({
  children,
  closeHref = "/clientes",
  onClose,
}: {
  children: ReactNode;
  closeHref?: string;
  onClose?: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while the drawer is open (portal covers viewport).
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted) return null;

  const closeControl = onClose ? (
    <button
      type="button"
      onClick={onClose}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10"
      aria-label="Fechar painel"
    >
      <X className="h-5 w-5" />
    </button>
  ) : (
    <Link
      href={closeHref}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10"
      aria-label="Fechar painel"
    >
      <X className="h-5 w-5" />
    </Link>
  );

  const backdrop = onClose ? (
    <button
      type="button"
      onClick={onClose}
      className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
      aria-label="Fechar"
    />
  ) : (
    <Link
      href={closeHref}
      className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
      aria-label="Fechar"
    />
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen justify-end"
      role="dialog"
      aria-modal="true"
    >
      {backdrop}
      <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full flex-col border-l border-zinc-200 bg-white shadow-2xl md:w-1/2 md:max-w-3xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex shrink-0 items-center justify-end border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          {closeControl}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
