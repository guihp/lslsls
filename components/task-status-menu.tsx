"use client";

import { TaskStatusIcon } from "@/components/task-status-icon";
import {
  TASK_STATUS_LABEL,
  TASK_STATUS_OPTIONS,
  type TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Props = {
  status: TaskStatus;
  disabled?: boolean;
  iconClassName?: string;
  buttonClassName?: string;
  onSelect: (status: TaskStatus) => void;
};

type MenuPos = { top: number; left: number };

function computeMenuPos(button: HTMLElement, menu: HTMLElement | null): MenuPos {
  const rect = button.getBoundingClientRect();
  const menuWidth = menu?.offsetWidth ?? 176;
  const menuHeight = menu?.offsetHeight ?? 140;
  const gap = 4;
  const pad = 8;

  const spaceBelow = window.innerHeight - rect.bottom;
  const top =
    spaceBelow < menuHeight + gap && rect.top > menuHeight + gap
      ? rect.top - menuHeight - gap
      : rect.bottom + gap;

  let left = rect.left;
  if (left + menuWidth > window.innerWidth - pad) {
    left = window.innerWidth - menuWidth - pad;
  }
  if (left < pad) left = pad;

  return { top, left };
}

export function TaskStatusMenu({
  status,
  disabled,
  iconClassName = "h-5 w-5",
  buttonClassName,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    setMenuPos(computeMenuPos(buttonRef.current, menuRef.current));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function close() {
      setOpen(false);
    }

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        close();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    function onReposition() {
      if (buttonRef.current) {
        setMenuPos(computeMenuPos(buttonRef.current, menuRef.current));
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", close, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center",
          buttonClassName,
        )}
        disabled={disabled}
        title={TASK_STATUS_LABEL[status]}
        aria-label={TASK_STATUS_LABEL[status]}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <TaskStatusIcon status={status} className={iconClassName} />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Status da tarefa"
          className="fixed z-50 min-w-[11rem] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          style={
            menuPos
              ? { top: menuPos.top, left: menuPos.left }
              : { visibility: "hidden", top: 0, left: 0 }
          }
        >
          {TASK_STATUS_OPTIONS.map((option) => {
            const selected = option === status;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm touch-manipulation",
                  selected
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800/70 dark:active:bg-zinc-800",
                )}
                onClick={() => {
                  setOpen(false);
                  if (option !== status) onSelect(option);
                }}
              >
                <TaskStatusIcon
                  status={option}
                  className="h-4 w-4 shrink-0"
                />
                <span>{TASK_STATUS_LABEL[option]}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
