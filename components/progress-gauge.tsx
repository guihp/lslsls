"use client";

import { useId } from "react";
import { progressStatusLabel, progressTone } from "@/lib/progress";
import { cn } from "@/lib/utils";

const CX = 100;
const CY = 100;
const RADIUS = 78;
const ARC_LENGTH = Math.PI * RADIUS;
const TRACK = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;

export function ProgressGauge({
  percent,
  completed,
  expected,
  title = "Progresso Semanal",
  subtitle = "Sua meta para a semana",
  periodLabel = "esperados na semana",
}: {
  percent: number;
  completed: number;
  expected: number;
  title?: string;
  subtitle?: string;
  periodLabel?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `gauge-fill-${uid}`;
  const tone = progressTone(percent);
  const clamped = Math.min(100, Math.max(0, percent));
  const progress = clamped / 100;

  // Marker along the upper semicircle (0% left → 100% right)
  const theta = Math.PI * (1 - progress);
  const markerX = CX + RADIUS * Math.cos(theta);
  const markerY = CY - RADIUS * Math.sin(theta);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
            tone === "green" && "bg-orange-500/15 text-orange-600 dark:text-orange-400",
            tone === "orange" && "bg-orange-500/15 text-orange-500",
            tone === "red" && "bg-red-500/15 text-red-500",
            tone === "gray" && "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
          )}
        >
          {progressStatusLabel(percent)}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[280px]">
        <svg
          viewBox="0 0 200 122"
          className="h-auto w-full"
          role="img"
          aria-label={`${Math.round(clamped)}% concluído, ${completed} de ${expected} ${periodLabel}`}
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#E85D04" />
              <stop offset="100%" stopColor="#FF6B00" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path
            d={TRACK}
            fill="none"
            stroke="currentColor"
            strokeWidth="11"
            strokeLinecap="round"
            className="text-zinc-200 dark:text-zinc-800"
          />

          {/* Filled progress */}
          {clamped > 0 ? (
            <path
              d={TRACK}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${progress * ARC_LENGTH} ${ARC_LENGTH}`}
            />
          ) : null}

          {/* Soft marker on the arc */}
          <circle
            cx={markerX}
            cy={markerY}
            r="7"
            className="fill-white dark:fill-zinc-900"
          />
          <circle
            cx={markerX}
            cy={markerY}
            r="4.5"
            fill="#FF6B00"
          />
        </svg>

        <div className="pointer-events-none absolute inset-x-0 top-[58%] -translate-y-1/2 text-center">
          <p className="text-[2.5rem] font-semibold leading-none tracking-tight text-zinc-900 tabular-nums sm:text-5xl dark:text-white">
            {Math.round(clamped)}
            <span className="text-[0.55em] font-medium text-zinc-400 dark:text-zinc-500">
              %
            </span>
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-sm leading-snug text-zinc-500 dark:text-zinc-400">
        <span className="font-medium text-zinc-800 tabular-nums dark:text-zinc-200">
          {completed}
        </span>
        <span className="text-zinc-400 dark:text-zinc-600"> / </span>
        <span className="tabular-nums">{expected}</span>
        <span className="text-zinc-400 dark:text-zinc-500"> {periodLabel}</span>
      </p>
    </div>
  );
}
