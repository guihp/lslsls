"use client";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,107,0,0.14),_transparent_55%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-lg shadow-orange-500/10 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto mb-4 flex justify-center">
          <BrandLogo size={56} className="bg-transparent" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-orange-600">
          IAFÉ Daily
        </p>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Não foi possível carregar esta página. Tente de novo ou volte ao
          dashboard.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-zinc-400">
            Ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={() => retry()} className="w-full sm:w-auto">
            Tentar novamente
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-transparent px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 sm:w-auto dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10"
          >
            Ir ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
