"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Thin orange top bar during client navigations (nprogress-style, no deps).
 * Starts on same-origin <a> clicks; completes when pathname/search settles.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKeyRef = useRef(routeKey);

  function clearTimers() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (hideRef.current) {
      clearTimeout(hideRef.current);
      hideRef.current = null;
    }
  }

  function start() {
    clearTimers();
    setActive(true);
    setWidth(12);
    timerRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 88) return w;
        const step = w < 40 ? 8 : w < 70 ? 3 : 1;
        return Math.min(88, w + step);
      });
    }, 120);
  }

  function finish() {
    clearTimers();
    setWidth(100);
    hideRef.current = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 220);
  }

  useEffect(() => {
    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey;
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish is stable enough for route settle
  }, [routeKey]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.getAttribute("target") === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const nextKey = `${url.pathname}?${url.searchParams.toString()}`;
      const currentKey = `${window.location.pathname}?${window.location.search.slice(1)}`;
      if (nextKey === currentKey) return;

      start();
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, []);

  if (!active && width === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
      role="progressbar"
      aria-hidden={!active}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div
        className="nav-progress-bar h-full bg-orange-500 shadow-[0_0_8px_rgba(255,107,0,0.55)] transition-[width] duration-150 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
