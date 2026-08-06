"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400"
        aria-label="Tema"
      >
        <Moon className="h-5 w-5" />
      </button>
    );
  }

  const dark = theme === "dark";
  const nextTheme = dark ? "light" : "dark";

  function applyTheme() {
    flushSync(() => {
      setTheme(nextTheme);
    });
  }

  function handleToggle() {
    if (
      !prefersReducedMotion() &&
      typeof document !== "undefined" &&
      "startViewTransition" in document
    ) {
      document.startViewTransition(applyTheme);
      return;
    }
    applyTheme();
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-[background-color,color,transform] duration-200 ease-out hover:bg-zinc-800/60 hover:text-white active:scale-95 dark:hover:bg-zinc-800"
      aria-label="Alternar tema"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
