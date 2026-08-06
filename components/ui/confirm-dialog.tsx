"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleCancel = useCallback(() => {
    if (pending) return;
    onCancel();
  }, [onCancel, pending]);

  useEffect(() => {
    if (!open) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frame = requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!pending) onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open, onCancel, pending]);

  function onPanelKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onOverlayClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleCancel();
  }

  if (!open) return null;

  return (
    <div
      data-slot="dialog-overlay"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onOverlayClick}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className={cn(
          "w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-black/10 sm:p-6",
          "dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40",
        )}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-zinc-900 dark:text-white"
        >
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm leading-relaxed text-zinc-500">
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={cancelRef}
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            disabled={pending}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {pending ? "Excluindo…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
