"use client";

import { ProgressGauge } from "@/components/progress-gauge";
import { EmptyState } from "@/components/empty-state";
import type { ProgressSnapshot } from "@/lib/progress";
import { progressTone } from "@/lib/progress";
import { cn } from "@/lib/utils";

type WeekRow = ProgressSnapshot & {
  label: string;
};

export function ProgressView({
  weekLabel,
  dayLabel,
  daily,
  weekly,
  history,
}: {
  weekLabel: string;
  dayLabel: string;
  daily: ProgressSnapshot;
  weekly: ProgressSnapshot;
  history: WeekRow[];
}) {
  const hasAny = history.some((h) => h.expected > 0 || h.completed > 0);
  const totalPercent =
    history.reduce((s, h) => s + h.percent, 0) /
    Math.max(1, history.filter((h) => h.expected > 0).length || 1);

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Dev Dashboard</h1>
        <span className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-500 dark:border-zinc-700">
          {weekLabel}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">
          {dayLabel}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressGauge
          percent={daily.percent}
          completed={daily.completed}
          expected={daily.expected}
          weekPoints={weekly.completed}
          weekExpected={weekly.expected}
        />

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Resumo do Período</h2>
            <span className="text-sm text-zinc-500">
              {hasAny ? `${Math.round(totalPercent)}% total` : "0% total"}
            </span>
          </div>

          {!hasAny ? (
            <EmptyState
              className="border-0 bg-transparent py-8"
              title="Sem histórico ainda"
              description="Conforme você concluir demandas com prazo, o histórico das últimas semanas aparece aqui."
            />
          ) : (
            <div className="space-y-4">
              {history.map((week) => {
                const tone = progressTone(week.percent);
                return (
                  <div key={week.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{week.label}</span>
                      <span className="text-zinc-500">
                        {week.expected === 0
                          ? "—"
                          : `${week.completed}/${week.expected} (${week.percent}%)`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          tone === "green" && "bg-orange-500",
                          tone === "orange" && "bg-orange-500",
                          tone === "red" && "bg-red-500",
                          tone === "gray" && "bg-zinc-400",
                        )}
                        style={{ width: `${Math.min(100, week.percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold">
            Histórico - Últimas 4 Semanas
          </h2>
          {!hasAny ? (
            <EmptyState
              className="border-0 bg-transparent py-8"
              title="Aguardando dados reais"
              description="Nenhuma demanda com prazo nas últimas semanas. O gráfico nasce vazio para você validar o fluxo."
            />
          ) : (
            <div className="flex h-48 items-end gap-4">
              {[...history].reverse().map((week) => {
                const tone = progressTone(week.percent);
                return (
                  <div
                    key={week.label}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-xs font-medium">{week.percent}%</span>
                    <div className="flex h-36 w-full items-end rounded-t-xl bg-zinc-100 dark:bg-zinc-900">
                      <div
                        className={cn(
                          "w-full rounded-t-xl transition-all",
                          tone === "green" && "bg-orange-500",
                          tone === "orange" && "bg-orange-500",
                          tone === "red" && "bg-red-500",
                          tone === "gray" && "bg-zinc-400",
                        )}
                        style={{
                          height: `${Math.max(4, Math.min(100, week.percent))}%`,
                        }}
                      />
                    </div>
                    <span className="text-center text-[10px] text-zinc-500">
                      {week.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
