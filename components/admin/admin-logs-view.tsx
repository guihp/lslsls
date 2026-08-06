import { formatActivityAction } from "@/lib/activity";
import type { ActivityLog } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import Link from "next/link";

export type AdminLogRow = {
  log: ActivityLog;
  actorName: string;
  clientName: string | null;
  clientId: string | null;
};

function formatWhen(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AdminLogsView({
  rows,
  page,
  totalPages,
}: {
  rows: AdminLogRow[];
  page: number;
  totalPages: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
        Nenhuma atividade registrada ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-900 dark:border-zinc-800">
        {rows.map(({ log, actorName, clientName, clientId }) => {
          const formatted = formatActivityAction(log, actorName);
          return (
            <li
              key={log.id}
              className="bg-white px-4 py-3 dark:bg-zinc-950 sm:px-5"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatted.headline}
                  </p>
                  {formatted.detail ? (
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {formatted.detail}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                    <span>
                      <span className="text-zinc-400">Quem · </span>
                      {actorName}
                    </span>
                    {clientId && clientName ? (
                      <span>
                        <span className="text-zinc-400">Cliente · </span>
                        <Link
                          href={`/clientes/${clientId}`}
                          className="font-medium text-orange-600 hover:underline dark:text-orange-400"
                        >
                          {clientName}
                        </Link>
                      </span>
                    ) : clientId ? (
                      <Link
                        href={`/clientes/${clientId}`}
                        className="font-medium text-orange-600 hover:underline dark:text-orange-400"
                      >
                        Ver cliente
                      </Link>
                    ) : null}
                  </div>
                </div>
                <time
                  dateTime={log.created_at}
                  className="shrink-0 text-xs text-zinc-500 sm:text-right"
                  title={log.created_at}
                >
                  <span className="block">{formatWhen(log.created_at)}</span>
                  <span className="text-zinc-400">
                    {relativeTime(log.created_at)}
                  </span>
                </time>
              </div>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-between gap-3 text-sm"
          aria-label="Paginação dos logs"
        >
          {page > 1 ? (
            <Link
              href={`/admin/logs?page=${page - 1}`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:text-orange-400"
            >
              Anterior
            </Link>
          ) : (
            <span className="px-3 py-1.5 text-zinc-300 dark:text-zinc-700">
              Anterior
            </span>
          )}
          <span className="text-zinc-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/logs?page=${page + 1}`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:text-orange-400"
            >
              Próxima
            </Link>
          ) : (
            <span className="px-3 py-1.5 text-zinc-300 dark:text-zinc-700">
              Próxima
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
