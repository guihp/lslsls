"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

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

  const panel = (
    <div className="fixed inset-0 z-[60] flex h-dvh max-h-dvh justify-end">
      {onClose ? (
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
      )}
      <div className="relative flex h-full min-h-0 w-full flex-col border-l border-zinc-200 bg-white shadow-2xl md:w-1/2 md:max-w-3xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex shrink-0 items-center justify-end border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          {closeControl}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>
  );

  // Escape app shell `overflow-x-hidden` (clips fixed panels). SSR/first paint
  // stays in-tree; after mount, portal to body so the drawer is full viewport.
  if (!mounted) return panel;
  return createPortal(panel, document.body);
}
