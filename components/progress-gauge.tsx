"use client";

import { progressStatusLabel, progressTone } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function ProgressGauge({
  percent,
  completed,
  expected,
  weekPoints,
  weekExpected,
  title = "Progresso Semanal",
  subtitle = "Sua meta para a semana",
  periodLabel = "esperados na semana",
}: {
  percent: number;
  completed: number;
  expected: number;
  weekPoints?: number;
  weekExpected?: number;
  title?: string;
  subtitle?: string;
  periodLabel?: string;
}) {
  const tone = progressTone(percent);
  const clamped = Math.min(100, Math.max(0, percent));
  const rotation = (clamped / 100) * 180 - 90;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            tone === "green" && "bg-orange-500/15 text-orange-600",
            tone === "orange" && "bg-orange-500/15 text-orange-500",
            tone === "red" && "bg-red-500/15 text-red-500",
            tone === "gray" && "bg-zinc-500/15 text-zinc-400",
          )}
        >
          {progressStatusLabel(percent)}
        </span>
      </div>

      <div className="relative mx-auto h-40 w-72">
        <svg viewBox="0 0 200 110" className="h-full w-full">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            className="text-zinc-200 dark:text-zinc-800"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * 251} 251`}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ff6b00" />
            </linearGradient>
          </defs>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke="currentColor"
            strokeWidth="3"
            className="text-zinc-700 dark:text-zinc-200"
            transform={`rotate(${rotation} 100 100)`}
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" className="fill-zinc-700 dark:fill-zinc-200" />
        </svg>
        <div className="absolute inset-x-0 top-16 text-center">
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            {percent}%
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-sm text-zinc-500">
        {completed} / {expected} {periodLabel}
      </p>

      {weekPoints !== undefined && weekExpected !== undefined ? (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Pontos na semana</span>
            <span className="font-medium text-zinc-900 dark:text-white">
              {weekPoints}
              {weekExpected > 0 ? ` / ${weekExpected}` : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{
                width: `${
                  weekExpected === 0
                    ? 0
                    : Math.min(
                        100,
                        Math.round((weekPoints / weekExpected) * 100),
                      )
                }%`,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
