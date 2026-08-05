import { TASK_STATUS_LABEL, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

export function TaskStatusIcon({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  if (status === "done") {
    return (
      <CheckCircle2
        className={cn("text-emerald-500", className)}
        aria-label={TASK_STATUS_LABEL.done}
      />
    );
  }
  if (status === "doing") {
    return (
      <Circle
        className={cn("text-amber-400", className)}
        aria-label={TASK_STATUS_LABEL.doing}
      />
    );
  }
  return (
    <Circle
      className={cn("text-zinc-400", className)}
      aria-label={TASK_STATUS_LABEL.todo}
    />
  );
}

export function taskTitleClassName(status: TaskStatus) {
  if (status === "done") return "text-emerald-500 line-through";
  if (status === "doing") return "text-amber-600 dark:text-amber-400";
  return "";
}
