import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";

export default function NotFound() {
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
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Esse endereço não existe ou foi movido. Volte ao dashboard para
          continuar.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 sm:w-auto"
          >
            Ir ao dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-transparent px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 sm:w-auto dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10"
          >
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
