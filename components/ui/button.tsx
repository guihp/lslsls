import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-500/25",
        variant === "secondary" &&
          "border border-orange-200 bg-transparent text-orange-700 hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10",
        variant === "ghost" &&
          "text-zinc-600 hover:bg-orange-50 hover:text-orange-700 dark:text-zinc-300 dark:hover:bg-orange-500/10",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-500",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
